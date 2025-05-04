import { IsNull } from "typeorm";
import { config } from "@/config.js";
import { renderActivity } from "@/remote/activitypub/renderer/index.js";
import renderOrderedCollection from "@/remote/activitypub/renderer/ordered-collection.js";
import renderNote from "@/remote/activitypub/renderer/note.js";
import { Users, Notes, UserNotePinings } from "@/models/index.js";
import { checkFetch } from "@/remote/activitypub/check-fetch.js";
import { fetchMeta } from "backend-rs";
import { setResponseType } from "../activitypub.js";
import type Router from "@koa/router";

export default async (ctx: Router.RouterContext) => {
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

	const pinning = await UserNotePinings.find({
		where: { userId: user.id },
		order: { id: "DESC" },
	});

	const pinnedNotes = (
		await Promise.all(
			pinning.map((pinnedNote) =>
				Notes.findOneByOrFail({ id: pinnedNote.noteId }),
			),
		)
	).filter(
		(note) => !note.localOnly && ["public", "home"].includes(note.visibility),
	);

	const renderedNotes = await Promise.all(
		pinnedNotes.map((note) => renderNote(note)),
	);

	const rendered = renderOrderedCollection(
		`${config.url}/users/${userId}/collections/featured`,
		renderedNotes.length,
		undefined,
		undefined,
		renderedNotes,
	);

	ctx.body = renderActivity(rendered);

	const instanceMeta = await fetchMeta();
	if (instanceMeta.secureMode || instanceMeta.privateMode) {
		ctx.set("Cache-Control", "private, max-age=0, must-revalidate");
	} else {
		ctx.set("Cache-Control", "public, max-age=180");
	}
	setResponseType(ctx);
};
