import define from "@/server/api/define.js";
import { AccessTokens } from "@/models/index.js";
import { genId, generateSecureRandomString } from "backend-rs";

export const meta = {
	tags: ["auth"],

	requireCredential: true,

	secure: true,

	res: {
		type: "object",
		optional: false,
		nullable: false,
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
		session: { type: "string", nullable: true },
		name: { type: "string", nullable: true },
		description: { type: "string", nullable: true },
		iconUrl: { type: "string", nullable: true },
		permission: {
			type: "array",
			uniqueItems: true,
			items: {
				type: "string",
			},
		},
	},
	required: ["session", "permission"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	// Generate access token
	const accessToken = generateSecureRandomString(32);

	const now = new Date();

	// Insert access token doc
	await AccessTokens.insert({
		id: genId(),
		createdAt: now,
		lastUsedAt: now,
		session: ps.session,
		userId: user.id,
		token: accessToken,
		hash: accessToken,
		name: ps.name,
		description: ps.description,
		iconUrl: ps.iconUrl,
		permission: ps.permission,
	});

	return {
		token: accessToken,
	};
});
