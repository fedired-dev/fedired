import { Users, UserProfiles } from "@/models/index.js";
import { Event, publishToMainStream } from "backend-rs";
import define from "@/server/api/define.js";

export const meta = {
	tags: ["admin"],

	requireCredential: true,
	requireAdmin: true,

	res: {},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		userId: { type: "string", format: "misskey:id" },
	},
	required: ["userId"],
} as const;

export default define(meta, paramDef, async (ps) => {
	const user = await Users.findOneByOrFail({ id: ps.userId });
	if (user.isDeleted) {
		return;
	}

	await UserProfiles.update(user.id, {
		twoFactorSecret: null,
		twoFactorEnabled: false,
		usePasswordLessLogin: false,
	});

	const iObj = await Users.pack(user.id, user, {
		detail: true,
		includeSecrets: true,
	});

	publishToMainStream(user.id, Event.Me, iObj);
});
