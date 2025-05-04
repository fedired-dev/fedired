import type Router from "@koa/router";
import { limitToInt, normalizeUrlQuery } from "./timeline.js";
import { NotificationHelpers } from "@/server/api/mastodon/helpers/notification.js";
import { NotificationConverter } from "@/server/api/mastodon/converters/notification.js";
import { auth } from "@/server/api/mastodon/middleware/auth.js";
import { filterContext } from "@/server/api/mastodon/middleware/filter-context.js";

export function setupEndpointsNotifications(router: Router): void {
	router.get(
		"/v1/notifications",
		auth(true, ["read:notifications"]),
		filterContext("notifications"),
		async (ctx) => {
			const args = normalizeUrlQuery(limitToInt(ctx.query), [
				"types[]",
				"exclude_types[]",
			]);
			const res = await NotificationHelpers.getNotifications(
				args.max_id,
				args.since_id,
				args.min_id,
				args.limit,
				args["types[]"],
				args["exclude_types[]"],
				args.account_id,
				ctx,
			);
			ctx.body = await NotificationConverter.encodeMany(res, ctx);
		},
	);

	router.get(
		"/v1/notifications/:id",
		auth(true, ["read:notifications"]),
		filterContext("notifications"),
		async (ctx) => {
			const notification = await NotificationHelpers.getNotificationOr404(
				ctx.params.id,
				ctx,
			);
			ctx.body = await NotificationConverter.encode(notification, ctx);
		},
	);

	router.post(
		"/v1/notifications/clear",
		auth(true, ["write:notifications"]),
		async (ctx) => {
			await NotificationHelpers.clearAllNotifications(ctx);
			ctx.body = {};
		},
	);

	router.post(
		"/v1/notifications/:id/dismiss",
		auth(true, ["write:notifications"]),
		async (ctx) => {
			const notification = await NotificationHelpers.getNotificationOr404(
				ctx.params.id,
				ctx,
			);
			await NotificationHelpers.dismissNotification(notification.id, ctx);
			ctx.body = {};
		},
	);

	router.post(
		"/v1/conversations/:id/read",
		auth(true, ["write:conversations"]),
		async (ctx, _reply) => {
			await NotificationHelpers.markConversationAsRead(ctx.params.id, ctx);
			ctx.body = {};
		},
	);

	router.get("/v1/push/subscription", auth(true, ["push"]), async (ctx) => {
		const subscription =
			await NotificationHelpers.getPushSubscriptionOr404(ctx);
		ctx.body = await NotificationConverter.encodeSubscription(
			subscription,
			ctx,
		);
	});

	router.post("/v1/push/subscription", auth(true, ["push"]), async (ctx) => {
		const subscription = await NotificationHelpers.setPushSubscription(ctx);
		ctx.body = await NotificationConverter.encodeSubscription(
			subscription,
			ctx,
		);
	});

	router.delete("/v1/push/subscription", auth(true, ["push"]), async (ctx) => {
		await NotificationHelpers.deletePushSubscription(ctx);
		ctx.body = {};
	});

	router.put("/v1/push/subscription", auth(true, ["push"]), async (ctx) => {
		const subscription =
			await NotificationHelpers.getPushSubscriptionOr404(ctx);
		await NotificationHelpers.putPushSubscription(subscription, ctx);
		ctx.body = await NotificationConverter.encodeSubscription(
			subscription,
			ctx,
		);
	});
}
