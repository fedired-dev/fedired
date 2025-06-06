import define from "@/server/api/define.js";
import { Ads } from "@/models/index.js";
import { genIdAt } from "backend-rs";

export const meta = {
	tags: ["admin"],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {
		url: { type: "string", minLength: 1 },
		memo: { type: "string" },
		place: { type: "string" },
		priority: { type: "string" },
		ratio: { type: "integer" },
		expiresAt: { type: "integer" },
		imageUrl: { type: "string", minLength: 1 },
	},
	required: [
		"url",
		"memo",
		"place",
		"priority",
		"ratio",
		"expiresAt",
		"imageUrl",
	],
} as const;

export default define(meta, paramDef, async (ps) => {
	const now = new Date();

	await Ads.insert({
		id: genIdAt(now),
		createdAt: now,
		expiresAt: new Date(ps.expiresAt),
		url: ps.url,
		imageUrl: ps.imageUrl,
		priority: ps.priority,
		ratio: ps.ratio,
		place: ps.place,
		memo: ps.memo,
	});
});
