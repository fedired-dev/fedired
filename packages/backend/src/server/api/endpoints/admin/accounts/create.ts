import define from "@/server/api/define.js";
import { Users } from "@/models/index.js";
import { signup } from "@/server/api/common/signup.js";
import { countLocalUsers } from "backend-rs";

export const meta = {
	tags: ["admin"],

	res: {
		type: "object",
		optional: false,
		nullable: false,
		ref: "User",
		properties: {
			token: {
				type: "string",
				optional: false,
				nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		username: Users.localUsernameSchema,
		password: Users.passwordSchema,
	},
	required: ["username", "password"],
} as const;

export default define(meta, paramDef, async (ps, _me, token) => {
	const me = _me ? await Users.findOneByOrFail({ id: _me.id }) : null;
	if (!me?.isAdmin && (await countLocalUsers()) !== 0)
		throw new Error("access denied");
	if (token) throw new Error("access denied");

	const { account, secret } = await signup({
		username: ps.username,
		password: ps.password,
	});

	const res = await Users.pack(account, account, {
		detail: true,
		includeSecrets: true,
	});

	(res as any).token = secret;

	return res;
});
