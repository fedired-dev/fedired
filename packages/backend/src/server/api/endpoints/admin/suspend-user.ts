import define from "@/server/api/define.js";
import deleteFollowing from "@/services/following/delete.js";
import { Users, Followings, Notifications } from "@/models/index.js";
import type { User } from "@/models/entities/user.js";
import { insertModerationLog } from "@/services/insert-moderation-log.js";
import { doPostSuspend } from "@/services/suspend-user.js";
import { publishToUserStream, UserEvent } from "backend-rs";

export const meta = {
	tags: ["admin"],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {
		userId: { type: "string", format: "misskey:id" },
	},
	required: ["userId"],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	const user = await Users.findOneBy({ id: ps.userId });

	if (user == null) {
		throw new Error("user not found");
	}

	if (user.isAdmin) {
		throw new Error("cannot suspend admin");
	}

	if (user.isModerator) {
		throw new Error("cannot suspend moderator");
	}

	await Users.update(user.id, {
		isSuspended: true,
	});

	insertModerationLog(me, "suspend", {
		targetId: user.id,
	});

	// Terminate streaming
	if (Users.isLocalUser(user)) {
		await publishToUserStream(user.id, UserEvent.Disconnect, {});
	}

	(async () => {
		await doPostSuspend(user).catch((e) => {});
		await unFollowAll(user).catch((e) => {});
		await readAllNotify(user).catch((e) => {});
	})();
});

async function unFollowAll(follower: User) {
	const followings = await Followings.findBy({
		followerId: follower.id,
	});

	for (const following of followings) {
		const followee = await Users.findOneBy({
			id: following.followeeId,
		});

		if (followee == null) {
			throw new Error(`Cant find followee ${following.followeeId}`);
		}

		await deleteFollowing(follower, followee, true);
	}
}

async function readAllNotify(notifier: User) {
	await Notifications.update(
		{
			notifierId: notifier.id,
			isRead: false,
		},
		{
			isRead: true,
		},
	);
}
