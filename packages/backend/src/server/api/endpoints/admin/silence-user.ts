import define from "@/server/api/define.js";
import { Users } from "@/models/index.js";
import { insertModerationLog } from "@/services/insert-moderation-log.js";
import { InternalEvent, publishToInternalStream } from "backend-rs";

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
		throw new Error("cannot silence admin");
	}

	await Users.update(user.id, {
		isSilenced: true,
	});

	publishToInternalStream(InternalEvent.Silence, {
		id: user.id,
		isSilenced: true,
	});

	insertModerationLog(me, "silence", {
		targetId: user.id,
	});
});
