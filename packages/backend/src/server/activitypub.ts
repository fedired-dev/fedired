import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import httpSignature from "@peertube/http-signature";

import { In, IsNull, Not } from "typeorm";
import { renderActivity } from "@/remote/activitypub/renderer/index.js";
import renderNote from "@/remote/activitypub/renderer/note.js";
import renderKey from "@/remote/activitypub/renderer/key.js";
import { renderPerson } from "@/remote/activitypub/renderer/person.js";
import { inbox as processInbox } from "@/queue/index.js";
import {
	fetchMeta,
	getInstanceActor,
	isSelfHost,
	renderEmoji,
	renderFollow,
	renderLike,
} from "backend-rs";
import {
	Notes,
	Users,
	Emojis,
	NoteReactions,
	FollowRequests,
} from "@/models/index.js";
import type { ILocalUser, User } from "@/models/entities/user.js";
import { getUserKeypair } from "@/misc/keypair-store.js";
import {
	checkFetch,
	getSignatureUser,
} from "@/remote/activitypub/check-fetch.js";
import Featured from "./activitypub/featured.js";
import Following from "./activitypub/following.js";
import Followers from "./activitypub/followers.js";
import Outbox, { packActivity } from "./activitypub/outbox.js";
import { serverLogger } from "./index.js";
import { config } from "@/config.js";
import type Koa from "koa";
import * as crypto from "node:crypto";
import { inspect } from "node:util";
import type { IActivity } from "@/remote/activitypub/type.js";

// Init router
const router = new Router();

//#region Routing

function inbox(ctx: Router.RouterContext) {
	const inboxLogger = serverLogger.createSubLogger("inbox");

	if (ctx.req.headers.host !== config.host) {
		inboxLogger.warn(`regecting invalid host (${ctx.req.headers.host})`);
		ctx.status = 400;
		ctx.message = "Invalid Host";
		return;
	}

	let signature: httpSignature.IParsedSignature;

	try {
		signature = httpSignature.parseRequest(ctx.req, {
			headers: ["(request-target)", "digest", "host", "date"],
		});
	} catch (e) {
		ctx.status = 401;

		if (e instanceof Error) {
			if (e.name === "ExpiredRequestError")
				ctx.message = "Expired Request Error";
			if (e.name === "MissingHeaderError")
				ctx.message = "Missing Required Header";
		}

		inboxLogger.info(`signature parse error: ${ctx.message}`);
		inboxLogger.debug(inspect(e));

		return;
	}

	// Validate signature algorithm
	if (
		!signature.algorithm
			.toLowerCase()
			.match(/^((dsa|rsa|ecdsa)-(sha256|sha384|sha512)|ed25519-sha512|hs2019)$/)
	) {
		inboxLogger.info(
			`rejecting signature: unknown algorithm (${signature.algorithm})`,
		);
		ctx.status = 401;
		ctx.message = "Invalid Signature Algorithm";
		return;

		// hs2019
		// keyType=ED25519 => ed25519-sha512
		// keyType=other => (keyType)-sha256
	}

	// Validate digest header
	const digest = ctx.req.headers.digest;

	if (typeof digest !== "string") {
		inboxLogger.info(
			"rejecting invalid signature: zero or more than one digest header(s)",
		);
		ctx.status = 401;
		ctx.message = "Invalid Digest Header";
		return;
	}

	const match = digest.match(/^([0-9A-Za-z-]+)=(.+)$/);

	if (match == null) {
		inboxLogger.info("rejecting signature: unrecognized digest header");
		ctx.status = 401;
		ctx.message = "Invalid Digest Header";
		return;
	}

	const digestAlgo = match[1];
	const expectedDigest = match[2];

	if (digestAlgo.toUpperCase() !== "SHA-256") {
		inboxLogger.info("rejecting signature: unsupported digest algorithm");
		ctx.status = 401;
		ctx.message = "Unsupported Digest Algorithm";
		return;
	}

	const actualDigest = crypto
		.createHash("sha256")
		.update(ctx.request.rawBody)
		.digest("base64");

	if (expectedDigest !== actualDigest) {
		inboxLogger.info("rejecting invalid signature: Digest Mismatch");
		ctx.status = 401;
		ctx.message = "Digest Missmatch";
		return;
	}

	processInbox(ctx.request.body as IActivity, signature);

	ctx.status = 202;
}

const ACTIVITY_JSON = "application/activity+json; charset=utf-8";
const LD_JSON =
	'application/ld+json; profile="https://www.w3.org/ns/activitystreams"; charset=utf-8';

function isActivityPubReq(ctx: Router.RouterContext) {
	ctx.response.vary("Accept");
	const accepted = ctx.accepts("html", ACTIVITY_JSON, LD_JSON);
	return typeof accepted === "string" && !accepted.match(/html/);
}

export function setResponseType(ctx: Router.RouterContext) {
	const accept = ctx.accepts(ACTIVITY_JSON, LD_JSON);
	if (accept === LD_JSON) {
		ctx.response.type = LD_JSON;
	} else {
		ctx.response.type = ACTIVITY_JSON;
	}
}

async function parseJsonBodyOrFail(ctx: Router.RouterContext, next: Koa.Next) {
	const koaBodyParser = bodyParser({
		enableTypes: ["json"],
		detectJSON: () => true,
	});

	try {
		await koaBodyParser(ctx, next);
	} catch {
		ctx.status = 400;
		return;
	}
}

// inbox
router.post("/inbox", parseJsonBodyOrFail, inbox);
router.post("/users/:user/inbox", parseJsonBodyOrFail, inbox);

// note
router.get("/notes/:note", async (ctx, next) => {
	if (!isActivityPubReq(ctx)) return await next();

	const verify = await checkFetch(ctx.req);
	if (verify !== 200) {
		ctx.status = verify;
		return;
	}

	const note = await Notes.findOneBy({
		id: ctx.params.note,
		visibility: In(["public" as const, "home" as const, "followers" as const]),
		localOnly: false,
	});

	if (note == null) {
		ctx.status = 404;
		return;
	}

	// redirect if remote
	if (note.userHost != null) {
		if (note.uri == null || isSelfHost(note.userHost)) {
			ctx.status = 500;
			return;
		}
		ctx.redirect(note.uri);
		return;
	}

	if (note.visibility === "followers") {
		serverLogger.debug(
			"Responding to request for follower-only note, validating access...",
		);
		const remoteUser = await getSignatureUser(ctx.req);
		serverLogger.debug("Local note author user:");
		serverLogger.debug(JSON.stringify(note, null, 2));
		serverLogger.debug("Authenticated remote user:");
		serverLogger.debug(JSON.stringify(remoteUser, null, 2));

		if (remoteUser == null) {
			serverLogger.info(
				"rejecting fetch attempt of private post: no authentication",
			);
			ctx.status = 401;
			return;
		}

		const relation = await Users.getRelation(remoteUser.user.id, note.userId);
		serverLogger.debug("Relation:");
		serverLogger.debug(JSON.stringify(relation, null, 2));

		if (!relation.isFollowing || relation.isBlocked) {
			serverLogger.info(
				"rejecting fetch attempt of private post: user is not a follower or is blocked",
			);
			ctx.status = 403;
			return;
		}

		serverLogger.debug("accepting fetch attempt of private post");
	}

	ctx.body = renderActivity(await renderNote(note, false));

	const instanceMeta = await fetchMeta();
	if (instanceMeta.secureMode || instanceMeta.privateMode) {
		ctx.set("Cache-Control", "private, max-age=0, must-revalidate");
	} else {
		ctx.set("Cache-Control", "public, max-age=180");
	}
	setResponseType(ctx);
});

// note activity
router.get("/notes/:note/activity", async (ctx) => {
	const verify = await checkFetch(ctx.req);
	if (verify !== 200) {
		ctx.status = verify;
		return;
	}

	const note = await Notes.findOneBy({
		id: ctx.params.note,
		userHost: IsNull(),
		visibility: In(["public" as const, "home" as const]),
		localOnly: false,
	});

	if (note == null) {
		ctx.status = 404;
		return;
	}

	ctx.body = renderActivity(await packActivity(note));
	const instanceMeta = await fetchMeta();
	if (instanceMeta.secureMode || instanceMeta.privateMode) {
		ctx.set("Cache-Control", "private, max-age=0, must-revalidate");
	} else {
		ctx.set("Cache-Control", "public, max-age=180");
	}
	setResponseType(ctx);
});

// outbox
router.get("/users/:user/outbox", Outbox);

// followers
router.get("/users/:user/followers", Followers);

// following
router.get("/users/:user/following", Following);

// featured
router.get("/users/:user/collections/featured", Featured);

// publickey
router.get("/users/:user/publickey", async (ctx) => {
	const instanceActor = (await getInstanceActor()) as ILocalUser;
	if (ctx.params.user === instanceActor.id) {
		ctx.body = renderActivity(
			renderKey(instanceActor, await getUserKeypair(instanceActor.id)),
		);
		ctx.set("Cache-Control", "public, max-age=180");
		setResponseType(ctx);
		return;
	}

	const verify = await checkFetch(ctx.req);
	if (verify !== 200) {
		ctx.status = verify;
		return;
	}

	const userId = ctx.params.user;

	const user = await Users.findOneBy({
		id: userId,
		host: IsNull(),
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	const keypair = await getUserKeypair(user.id);

	if (Users.isLocalUser(user)) {
		ctx.body = renderActivity(renderKey(user, keypair));
		const instanceMeta = await fetchMeta();
		if (instanceMeta.secureMode || instanceMeta.privateMode) {
			ctx.set("Cache-Control", "private, max-age=0, must-revalidate");
		} else {
			ctx.set("Cache-Control", "public, max-age=180");
		}
		setResponseType(ctx);
	} else {
		ctx.status = 400;
	}
});

// user
async function userInfo(ctx: Router.RouterContext, user: User | null) {
	if (user == null) {
		ctx.status = 404;
		return;
	}

	ctx.body = renderActivity(await renderPerson(user as ILocalUser));
	const instanceMeta = await fetchMeta();
	if (instanceMeta.secureMode || instanceMeta.privateMode) {
		ctx.set("Cache-Control", "private, max-age=0, must-revalidate");
	} else {
		ctx.set("Cache-Control", "public, max-age=180");
	}
	setResponseType(ctx);
}

router.get("/users/:user", async (ctx, next) => {
	if (!isActivityPubReq(ctx)) return await next();

	const instanceActor = (await getInstanceActor()) as ILocalUser;
	if (ctx.params.user === instanceActor.id) {
		await userInfo(ctx, instanceActor);
		return;
	}

	const verify = await checkFetch(ctx.req);
	if (verify !== 200) {
		ctx.status = verify;
		return;
	}

	const userId = ctx.params.user;

	const user = await Users.findOneBy({
		id: userId,
		host: IsNull(),
		isSuspended: false,
	});

	await userInfo(ctx, user);
});

router.get("/@:user", async (ctx, next) => {
	if (!isActivityPubReq(ctx)) return await next();

	if (ctx.params.user === "instance.actor") {
		const instanceActor = (await getInstanceActor()) as ILocalUser;
		await userInfo(ctx, instanceActor);
		return;
	}

	const verify = await checkFetch(ctx.req);
	if (verify !== 200) {
		ctx.status = verify;
		return;
	}

	const user = await Users.findOneBy({
		usernameLower: ctx.params.user.toLowerCase(),
		host: IsNull(),
		isSuspended: false,
	});

	await userInfo(ctx, user);
});

router.get("/actor", async (ctx, _next) => {
	const instanceActor = (await getInstanceActor()) as ILocalUser;
	await userInfo(ctx, instanceActor);
});
//#endregion

// emoji
router.get("/emojis/:emoji", async (ctx) => {
	const verify = await checkFetch(ctx.req);
	if (verify !== 200) {
		ctx.status = verify;
		return;
	}

	const emoji = await Emojis.findOneBy({
		host: IsNull(),
		name: ctx.params.emoji,
	});

	if (emoji == null) {
		ctx.status = 404;
		return;
	}

	ctx.body = renderActivity(renderEmoji(emoji));
	const instanceMeta = await fetchMeta();
	if (instanceMeta.secureMode || instanceMeta.privateMode) {
		ctx.set("Cache-Control", "private, max-age=0, must-revalidate");
	} else {
		ctx.set("Cache-Control", "public, max-age=180");
	}
	setResponseType(ctx);
});

// like
router.get("/likes/:like", async (ctx) => {
	const verify = await checkFetch(ctx.req);
	if (verify !== 200) {
		ctx.status = verify;
		return;
	}

	const reaction = await NoteReactions.findOneBy({ id: ctx.params.like });

	if (reaction == null) {
		ctx.status = 404;
		return;
	}

	const note = await Notes.findOneBy({ id: reaction.noteId });

	if (note == null) {
		ctx.status = 404;
		return;
	}

	ctx.body = renderActivity(await renderLike(reaction));
	const instanceMeta = await fetchMeta();
	if (instanceMeta.secureMode || instanceMeta.privateMode) {
		ctx.set("Cache-Control", "private, max-age=0, must-revalidate");
	} else {
		ctx.set("Cache-Control", "public, max-age=180");
	}
	setResponseType(ctx);
});

// follow
router.get(
	"/follows/:follower/:followee",
	async (ctx: Router.RouterContext) => {
		const verify = await checkFetch(ctx.req);
		if (verify !== 200) {
			ctx.status = verify;
			return;
		}
		// This may be used before the follow is completed, so we do not
		// check if the following exists.

		const [follower, followee] = await Promise.all([
			Users.findOneBy({
				id: ctx.params.follower,
				host: IsNull(),
			}),
			Users.findOneBy({
				id: ctx.params.followee,
				host: Not(IsNull()),
			}),
		]);

		if (follower == null || followee == null) {
			ctx.status = 404;
			return;
		}

		ctx.body = renderActivity(renderFollow(follower, followee));
		const instanceMeta = await fetchMeta();
		if (instanceMeta.secureMode || instanceMeta.privateMode) {
			ctx.set("Cache-Control", "private, max-age=0, must-revalidate");
		} else {
			ctx.set("Cache-Control", "public, max-age=180");
		}
		setResponseType(ctx);
	},
);

// follow request
router.get("/follows/:followRequestId", async (ctx: Router.RouterContext) => {
	const verify = await checkFetch(ctx.req);
	if (verify !== 200) {
		ctx.status = verify;
		return;
	}

	const followRequest = await FollowRequests.findOneBy({
		id: ctx.params.followRequestId,
	});

	if (followRequest == null) {
		ctx.status = 404;
		return;
	}

	const [follower, followee] = await Promise.all([
		Users.findOneBy({
			id: followRequest.followerId,
			host: IsNull(),
		}),
		Users.findOneBy({
			id: followRequest.followeeId,
			host: Not(IsNull()),
		}),
	]);

	if (follower == null || followee == null) {
		ctx.status = 404;
		return;
	}

	const instanceMeta = await fetchMeta();
	if (instanceMeta.secureMode || instanceMeta.privateMode) {
		ctx.set("Cache-Control", "private, max-age=0, must-revalidate");
	} else {
		ctx.set("Cache-Control", "public, max-age=180");
	}
	ctx.body = renderActivity(renderFollow(follower, followee));
	setResponseType(ctx);
});

export default router;
