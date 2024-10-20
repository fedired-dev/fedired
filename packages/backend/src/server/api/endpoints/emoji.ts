import { IsNull } from "typeorm";
import { Emojis } from "@/models/index.js";
import define from "@/server/api/define.js";
import { ApiError } from "@/server/api/error.js";

export const meta = {
	tags: ["meta"],

	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,

	errors: {
		noSuchEmoji: {
			message: "No such emoji.",
			code: "NO_SUCH_EMOJI",
			id: "6a5e3be7-5ac3-44a6-a425-9937cd66f8e1",
			httpStatusCode: 404,
		},
	},

	res: {
		type: "object",
		optional: false,
		nullable: false,
		ref: "Emoji",
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		name: {
			type: "string",
		},
	},
	required: ["name"],
} as const;

export default define(meta, paramDef, async (ps) => {
	const emoji = await Emojis.findOneBy({
		name: ps.name,
		host: IsNull(),
	});

	if (emoji == null) {
		throw new ApiError(meta.errors.noSuchEmoji);
	}

	return Emojis.pack(emoji);
});
