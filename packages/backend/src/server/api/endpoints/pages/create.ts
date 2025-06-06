import { Pages, DriveFiles } from "@/models/index.js";
import { genIdAt } from "backend-rs";
import { HOUR } from "@/const.js";
import { Page } from "@/models/entities/page.js";
import define from "@/server/api/define.js";
import { ApiError } from "@/server/api/error.js";

export const meta = {
	tags: ["pages"],

	requireCredential: true,

	kind: "write:pages",

	limit: {
		duration: HOUR,
		max: 300,
	},

	res: {
		type: "object",
		optional: false,
		nullable: false,
		ref: "Page",
	},

	errors: {
		noSuchFile: {
			message: "No such file.",
			code: "NO_SUCH_FILE",
			id: "b7b97489-0f66-4b12-a5ff-b21bd63f6e1c",
		},
		nameAlreadyExists: {
			message: "Specified name already exists.",
			code: "NAME_ALREADY_EXISTS",
			id: "4650348e-301c-499a-83c9-6aa988c66bc1",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		title: { type: "string" },
		name: { type: "string", minLength: 1 },
		summary: { type: "string", nullable: true },
		content: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: true,
			},
		},
		variables: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: true,
			},
		},
		script: { type: "string" },
		eyeCatchingImageId: {
			type: "string",
			format: "misskey:id",
			nullable: true,
		},
		font: {
			type: "string",
			enum: ["serif", "sans-serif"],
			default: "sans-serif",
		},
		alignCenter: { type: "boolean", default: false },
		isPublic: { type: "boolean", default: true },
		hideTitleWhenPinned: { type: "boolean", default: false },
	},
	required: ["title", "name", "content", "variables", "script"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	let eyeCatchingImage = null;
	if (ps.eyeCatchingImageId != null) {
		eyeCatchingImage = await DriveFiles.findOneBy({
			id: ps.eyeCatchingImageId,
			userId: user.id,
		});

		if (eyeCatchingImage == null) {
			throw new ApiError(meta.errors.noSuchFile);
		}
	}

	await Pages.findBy({
		userId: user.id,
		name: ps.name,
	}).then((result) => {
		if (result.length > 0) {
			throw new ApiError(meta.errors.nameAlreadyExists);
		}
	});

	const now = new Date();

	const page = await Pages.insert(
		new Page({
			id: genIdAt(now),
			createdAt: now,
			updatedAt: now,
			title: ps.title,
			name: ps.name,
			summary: ps.summary,
			content: ps.content,
			variables: ps.variables,
			script: ps.script,
			eyeCatchingImageId: eyeCatchingImage ? eyeCatchingImage.id : null,
			userId: user.id,
			visibility: "public",
			alignCenter: ps.alignCenter,
			hideTitleWhenPinned: ps.hideTitleWhenPinned,
			font: ps.font,
			isPublic: ps.isPublic,
		}),
	).then((x) => Pages.findOneByOrFail(x.identifiers[0]));

	return await Pages.pack(page);
});
