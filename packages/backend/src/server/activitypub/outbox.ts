import { Brackets, IsNull } from "typeorm";
import { config } from "@/config.js";
import { renderActivity } from "@/remote/activitypub/renderer/index.js";
import renderOrderedCollection from "@/remote/activitypub/renderer/ordered-collection.js";
import renderOrderedCollectionPage from "@/remote/activitypub/renderer/ordered-collection-page.js";
import renderNote from "@/remote/activitypub/renderer/note.js";
import renderCreate from "@/remote/activitypub/renderer/create.js";
import renderAnnounce from "@/remote/activitypub/renderer/announce.js";
import { countIf } from "@/prelude/array.js";
import * as url from "@/prelude/url.js";
import { Users, Notes } from "@/models/index.js";
import type { Note } from "@/models/entities/note.js";
import { checkFetch } from "@/remote/activitypub/check-fetch.js";
import { fetchMeta } from "backend-rs";
import { makePaginationQuery } from "../api/common/make-pagination-query.js";
import { setResponseType } from "../activitypub.js";
import type Router from "@koa/router";

export default async (ctx: Router.RouterContext) => {
	const verify = await checkFetch(ctx.req);
	if (verify !== 200) {
		ctx.status = verify;
		return;
	}

	const userId = ctx.params.user;

	const sinceId = ctx.request.query.since_id;
	if (sinceId != null && typeof sinceId !== "string") {
		ctx.status = 400;
		return;
	}

	const untilId = ctx.request.query.until_id;
	if (untilId != null && typeof untilId !== "string") {
		ctx.status = 400;
		return;
	}

	const page = ctx.request.query.page === "true";

	if (countIf((x) => x != null, [sinceId, untilId]) > 1) {
		ctx.status = 400;
		return;
	}

	const user = await Users.findOneBy({
		id: userId,
		host: IsNull(),
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	const limit = 20;
	const partOf = `${config.url}/users/${userId}/outbox`;

	if (page) {
		const validateQueryParams = (param: any) => {
			return param == null || typeof param === "string";
		};

		if (!validateQueryParams(sinceId) || !validateQueryParams(untilId)) {
			ctx.status = 400;
			return;
		}

		const PUBLIC_VISIBILITY = 'public';
		const HOME_VISIBILITY = 'home';

		const query = Notes.createQueryBuilder("note")
			.where("note.userId = :userId", { userId: user.id })
			.andWhere("note.localOnly = FALSE")
			.andWhere(new Brackets((qb) => {
				qb.where("note.visibility = :public", { public: PUBLIC_VISIBILITY })
				  .orWhere("note.visibility = :home", { home: HOME_VISIBILITY });
			}))
			.orderBy("note.createdAt", "DESC")
			.take(limit);

		if (sinceId) {
			query.andWhere("note.id > :sinceId", { sinceId });
		}

		if (untilId) {
			query.andWhere("note.id < :untilId", { untilId });
		}

		const notes = await query.getMany();

		if (sinceId) notes.reverse();

		const activities = await Promise.all(
			notes.map((note) => packActivity(note)),
		);
		const rendered = renderOrderedCollectionPage(
			`${partOf}?${url.query({
				page: "true",
				since_id: sinceId,
				until_id: untilId,
			})}`,
			user.notesCount,
			activities,
			partOf,
			notes.length
				? `${partOf}?${url.query({
						page: "true",
						since_id: notes[0].id,
					})}`
				: undefined,
			notes.length
				? `${partOf}?${url.query({
						page: "true",
						until_id: notes[notes.length - 1].id,
					})}`
				: undefined,
		);

		ctx.body = renderActivity(rendered);
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(
			partOf,
			user.notesCount,
			`${partOf}?page=true`,
			`${partOf}?page=true&since_id=000000000000000000000000`,
		);
		ctx.body = renderActivity(rendered);

		setResponseType(ctx);
	}
	const instanceMeta = await fetchMeta();
	if (instanceMeta.secureMode || instanceMeta.privateMode) {
		ctx.set("Cache-Control", "private, max-age=0, must-revalidate");
	} else {
		ctx.set("Cache-Control", "public, max-age=180");
	}
};

/**
 * Pack Create<Note> or Announce Activity
 * @param note Note
 */
export async function packActivity(note: Note): Promise<any> {
	if (
		note.renoteId &&
		note.text == null &&
		!note.hasPoll &&
		(note.fileIds == null || note.fileIds.length === 0)
	) {
		const renote = await Notes.findOneByOrFail({ id: note.renoteId });
		return renderAnnounce(
			renote.uri ? renote.uri : `${config.url}/notes/${renote.id}`,
			note,
		);
	}

	return renderCreate(await renderNote(note, false), note);
}
