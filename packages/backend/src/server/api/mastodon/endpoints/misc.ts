import type Router from "@koa/router";
import { MiscHelpers } from "@/server/api/mastodon/helpers/misc.js";
import {
	argsToBools,
	limitToInt,
} from "@/server/api/mastodon/endpoints/timeline.js";
import { Announcements } from "@/models/index.js";
import { auth } from "@/server/api/mastodon/middleware/auth.js";
import { MastoApiError } from "@/server/api/mastodon/middleware/catch-errors.js";
import { filterContext } from "@/server/api/mastodon/middleware/filter-context.js";

export function setupEndpointsMisc(router: Router): void {
	// Enhanced caching for public endpoints
	router.get("/v1/custom_emojis", async (ctx) => {
		// Add cache headers for public emoji endpoint
		ctx.set("Cache-Control", "public, max-age=3600, s-maxage=7200");
		ctx.body = await MiscHelpers.getCustomEmoji();
	});

	router.get("/v1/instance", async (ctx) => {
		// Add cache headers for instance info
		ctx.set("Cache-Control", "public, max-age=1800, s-maxage=3600");
		ctx.body = await MiscHelpers.getInstance(ctx);
	});

	router.get("/v2/instance", async (ctx) => {
		// Add cache headers for v2 instance info
		ctx.set("Cache-Control", "public, max-age=1800, s-maxage=3600");
		ctx.body = await MiscHelpers.getInstanceV2(ctx);
	});

	// Add v1/instance/peers endpoint for better Mastodon compatibility
	router.get("/v1/instance/peers", async (ctx) => {
		ctx.set("Cache-Control", "public, max-age=3600, s-maxage=7200");
		ctx.body = await MiscHelpers.getInstancePeers(ctx);
	});

	// Add v1/instance/activity endpoint for better Mastodon compatibility
	router.get("/v1/instance/activity", async (ctx) => {
		ctx.set("Cache-Control", "public, max-age=3600, s-maxage=7200");
		ctx.body = await MiscHelpers.getInstanceActivity(ctx);
	});

	router.get("/v1/announcements", auth(true), async (ctx) => {
		const args = argsToBools(ctx.query, ["with_dismissed"]);
		ctx.body = await MiscHelpers.getAnnouncements(args.with_dismissed, ctx);
	});

	router.post<{ Params: { id: string } }>(
		"/v1/announcements/:id/dismiss",
		auth(true, ["write:accounts"]),
		async (ctx) => {
			const announcement = await Announcements.findOneBy({ id: ctx.params.id });
			if (!announcement) throw new MastoApiError(404);

			await MiscHelpers.dismissAnnouncement(announcement, ctx);
			ctx.body = {};
		},
	);

	// Enhanced trends endpoint with better caching
	router.get(["/v1/trends/tags", "/v1/trends"], async (ctx) => {
		const args = limitToInt(ctx.query);
		ctx.set("Cache-Control", "public, max-age=1800, s-maxage=3600");
		ctx.body = await MiscHelpers.getTrendingHashtags(args.limit, args.offset);
	});

	router.get("/v1/trends/statuses", filterContext("public"), async (ctx) => {
		const args = limitToInt(ctx.query);
		ctx.set("Cache-Control", "public, max-age=900, s-maxage=1800");
		ctx.body = await MiscHelpers.getTrendingStatuses(
			args.limit,
			args.offset,
			ctx,
		);
	});

	router.get("/v1/trends/links", async (ctx) => {
		ctx.set("Cache-Control", "public, max-age=1800, s-maxage=3600");
		ctx.body = [];
	});

	router.get("/v1/preferences", auth(true, ["read:accounts"]), async (ctx) => {
		ctx.body = await MiscHelpers.getPreferences(ctx);
	});

	router.get("/v2/suggestions", auth(true, ["read:accounts"]), async (ctx) => {
		const args = limitToInt(ctx.query);
		ctx.body = await MiscHelpers.getFollowSuggestions(args.limit, ctx);
	});

	// Add v1/directory endpoint for better Mastodon compatibility
	router.get("/v1/directory", async (ctx) => {
		const args = limitToInt(ctx.query);
		ctx.set("Cache-Control", "public, max-age=1800, s-maxage=3600");
		ctx.body = await MiscHelpers.getDirectory(args.limit, args.offset, ctx);
	});

	// Add v1/endorsements endpoint for better Mastodon compatibility
	router.get("/v1/endorsements", auth(true, ["read:accounts"]), async (ctx) => {
		const args = limitToInt(ctx.query);
		ctx.body = await MiscHelpers.getEndorsements(args.limit, args.max_id, args.since_id, ctx);
	});
}
