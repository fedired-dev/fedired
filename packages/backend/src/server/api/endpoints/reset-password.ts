import { UserProfiles, PasswordResetRequests } from "@/models/index.js";
import define from "@/server/api/define.js";
import { hashPassword } from "backend-rs";

export const meta = {
	tags: ["reset password"],

	requireCredential: false,

	description: "Complete the password reset that was previously requested.",

	errors: {},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		token: { type: "string" },
		password: { type: "string" },
	},
	required: ["token", "password"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const req = await PasswordResetRequests.findOneByOrFail({
		token: ps.token,
	});

	// 発行してから30分以上経過していたら無効
	if (Date.now() - req.createdAt.getTime() > 1000 * 60 * 30) {
		throw new Error(); // TODO
	}

	// Generate hash of password
	const hash = hashPassword(ps.password);

	await UserProfiles.update(req.userId, {
		password: hash,
	});

	PasswordResetRequests.delete(req.id);
});
