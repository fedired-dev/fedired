import define from "@/server/api/define.js";
import { Emojis } from "@/models/index.js";
import { insertModerationLog } from "@/services/insert-moderation-log.js";
import { ApiError } from "@/server/api/error.js";
import { db } from "@/db/postgre.js";

export const meta = {
	tags: ["admin", "emoji"],

	requireCredential: true,
	requireModerator: false,

	errors: {
		noSuchEmoji: {
			message: "No such emoji.",
			code: "NO_SUCH_EMOJI",
			id: "be83669b-773a-44b7-b1f8-e5e5170ac3c2",
		},
		accessDenied: {
			message: "Access denied.",
			code: "ACCESS_DENIED",
			id: "fe8d7103-0ea8-4ec3-814d-f8b401dc69e9",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		id: { type: "string", format: "misskey:id" },
	},
	required: ["id"],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	// require emoji "full" permission
	if (!(me.isAdmin || me.isModerator || me.emojiModPerm === "full"))
		throw new ApiError(meta.errors.accessDenied);

	const emoji = await Emojis.findOneBy({ id: ps.id });

	if (emoji == null) throw new ApiError(meta.errors.noSuchEmoji);

	await Emojis.delete(emoji.id);

	await db.queryResultCache!.remove(["meta_emojis"]);

	insertModerationLog(me, "deleteEmoji", {
		emoji: emoji,
	});
});
