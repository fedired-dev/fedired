import { v4 as uuid } from "uuid";
import { config } from "@/config.js";
import define from "@/server/api/define.js";
import { ApiError } from "@/server/api/error.js";
import { Apps, AuthSessions } from "@/models/index.js";
import { genIdAt } from "backend-rs";

export const meta = {
	tags: ["auth"],

	requireCredential: false,

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
			url: {
				type: "string",
				optional: false,
				nullable: false,
				format: "url",
			},
		},
	},

	errors: {
		noSuchApp: {
			message: "No such app.",
			code: "NO_SUCH_APP",
			id: "92f93e63-428e-4f2f-a5a4-39e1407fe998",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		appSecret: { type: "string" },
	},
	required: ["appSecret"],
} as const;

export default define(meta, paramDef, async (ps) => {
	// Lookup app
	const app = await Apps.findOneBy({
		secret: ps.appSecret,
	});

	if (app == null) {
		throw new ApiError(meta.errors.noSuchApp);
	}

	// Generate token
	const token = uuid();

	// Create session token document
	const now = new Date();
	const doc = await AuthSessions.insert({
		id: genIdAt(now),
		createdAt: now,
		appId: app.id,
		token: token,
	}).then((x) => AuthSessions.findOneByOrFail(x.identifiers[0]));

	return {
		token: doc.token,
		url: `${config.authUrl}/${doc.token}`,
	};
});
