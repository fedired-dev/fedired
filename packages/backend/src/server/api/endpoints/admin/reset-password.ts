import define from "@/server/api/define.js";
import rndstr from "rndstr";
import { Users, UserProfiles } from "@/models/index.js";
import { hashPassword } from "backend-rs";

export const meta = {
	tags: ["admin"],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: "object",
		optional: false,
		nullable: false,
		properties: {
			password: {
				type: "string",
				optional: false,
				nullable: false,
				minLength: 8,
				maxLength: 8,
			},
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		userId: { type: "string", format: "misskey:id" },
	},
	required: ["userId"],
} as const;

export default define(meta, paramDef, async (ps) => {
	const user = await Users.findOneBy({ id: ps.userId });

	if (user == null) {
		throw new Error("user not found");
	}

	if (user.isAdmin) {
		throw new Error("cannot reset password of admin");
	}

	const passwd = rndstr("a-zA-Z0-9", 8);

	// Generate hash of password
	const hash = hashPassword(passwd);

	await UserProfiles.update(
		{
			userId: user.id,
		},
		{
			password: hash,
		},
	);

	return {
		password: passwd,
	};
});
