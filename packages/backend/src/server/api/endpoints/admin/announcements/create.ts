import define from "@/server/api/define.js";
import { Announcements } from "@/models/index.js";
import { genIdAt } from "backend-rs";

export const meta = {
	tags: ["admin"],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: "object",
		optional: false,
		nullable: false,
		properties: {
			id: {
				type: "string",
				optional: false,
				nullable: false,
				format: "id",
				example: "xxxxxxxxxx",
			},
			createdAt: {
				type: "string",
				optional: false,
				nullable: false,
				format: "date-time",
			},
			updatedAt: {
				type: "string",
				optional: false,
				nullable: true,
				format: "date-time",
			},
			title: {
				type: "string",
				optional: false,
				nullable: false,
			},
			text: {
				type: "string",
				optional: false,
				nullable: false,
			},
			imageUrl: {
				type: "string",
				optional: false,
				nullable: true,
			},
			showPopup: {
				type: "boolean",
				optional: true,
				nullable: false,
			},
			isGoodNews: {
				type: "boolean",
				optional: true,
				nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		title: { type: "string", minLength: 1 },
		text: { type: "string", minLength: 1 },
		imageUrl: { type: "string", nullable: true, minLength: 1 },
		showPopup: { type: "boolean" },
		isGoodNews: { type: "boolean" },
	},
	required: ["title", "text", "imageUrl"],
} as const;

export default define(meta, paramDef, async (ps) => {
	const now = new Date();
	const announcement = await Announcements.insert({
		id: genIdAt(now),
		createdAt: now,
		updatedAt: null,
		title: ps.title,
		text: ps.text,
		imageUrl: ps.imageUrl,
		showPopup: ps.showPopup ?? false,
		isGoodNews: ps.isGoodNews ?? false,
	}).then((x) => Announcements.findOneByOrFail(x.identifiers[0]));

	return Object.assign({}, announcement, {
		createdAt: announcement.createdAt.toISOString(),
		updatedAt: null,
	});
});
