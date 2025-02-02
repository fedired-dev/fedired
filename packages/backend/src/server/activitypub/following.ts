import { LessThan, IsNull } from "typeorm";
import { config } from "@/config.js";
import * as url from "@/prelude/url.js";
import { renderActivity } from "@/remote/activitypub/renderer/index.js";
import renderOrderedCollection from "@/remote/activitypub/renderer/ordered-collection.js";
import renderOrderedCollectionPage from "@/remote/activitypub/renderer/ordered-collection-page.js";
import renderFollowUser from "@/remote/activitypub/renderer/follow-user.js";
import { Users, Followings, UserProfiles } from "@/models/index.js";
import type { Following } from "@/models/entities/following.js";
import { checkFetch } from "@/remote/activitypub/check-fetch.js";
import { fetchMeta } from "backend-rs";
import { setResponseType } from "../activitypub.js";
import type { FindOptionsWhere } from "typeorm";
import type Router from "@koa/router";

export default async (ctx: Router.RouterContext) => {
	const verify = await checkFetch(ctx.req);
	if (verify !== 200) {
		ctx.status = verify;
		return;
	}

	const userId = ctx.params.user;

	const cursor = ctx.request.query.cursor;
	if (cursor != null && typeof cursor !== "string") {
		ctx.status = 400;
		return;
	}

	const page = ctx.request.query.page === "true";

	const user = await Users.findOneBy({
		id: userId,
		host: IsNull(),
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	//#region Check ff visibility
	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	if (profile.ffVisibility === "private") {
		ctx.status = 403;
		ctx.set("Cache-Control", "public, max-age=30");
		return;
	} else if (profile.ffVisibility === "followers") {
		ctx.status = 403;
		ctx.set("Cache-Control", "public, max-age=30");
		return;
	}
	//#endregion

	const limit = 10;
	const partOf = `${config.url}/users/${userId}/following`;

	if (page) {
		const query = {
			followerId: user.id,
		} as FindOptionsWhere<Following>;

		// If a cursor is specified
		if (cursor) {
			query.id = LessThan(cursor);
		}

		// Get followings
		const followings = await Followings.find({
			where: query,
			take: limit + 1,
			order: { id: -1 },
		});

		// Whether there is a "next page" or not
		const inStock = followings.length === limit + 1;
		if (inStock) followings.pop();

		const renderedFollowees = await Promise.all(
			followings.map((following) => renderFollowUser(following.followeeId)),
		);
		const rendered = renderOrderedCollectionPage(
			`${partOf}?${url.query({
				page: "true",
				cursor,
			})}`,
			user.followingCount,
			renderedFollowees,
			partOf,
			undefined,
			inStock
				? `${partOf}?${url.query({
						page: "true",
						cursor: followings[followings.length - 1].id,
					})}`
				: undefined,
		);

		ctx.body = renderActivity(rendered);
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(
			partOf,
			user.followingCount,
			`${partOf}?page=true`,
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
