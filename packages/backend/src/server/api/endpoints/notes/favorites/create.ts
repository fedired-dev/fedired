import { NoteFavorites } from "@/models/index.js";
import { genIdAt } from "backend-rs";
import define from "@/server/api/define.js";
import { ApiError } from "@/server/api/error.js";
import { getNote } from "@/server/api/common/getters.js";

export const meta = {
	tags: ["notes", "favorites"],

	requireCredential: true,

	kind: "write:favorites",

	errors: {
		noSuchNote: {
			message: "No such note.",
			code: "NO_SUCH_NOTE",
			id: "6dd26674-e060-4816-909a-45ba3f4da458",
		},

		alreadyFavorited: {
			message: "The note has already been marked as a favorite.",
			code: "ALREADY_FAVORITED",
			id: "a402c12b-34dd-41d2-97d8-4d2ffd96a1a6",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		noteId: { type: "string", format: "misskey:id" },
	},
	required: ["noteId"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	// Get favoritee
	const note = await getNote(ps.noteId, user).catch((err) => {
		if (err.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24")
			throw new ApiError(meta.errors.noSuchNote);
		throw err;
	});

	// if already favorited
	const exists = await NoteFavorites.existsBy({
		noteId: note.id,
		userId: user.id,
	});

	if (exists) {
		throw new ApiError(meta.errors.alreadyFavorited);
	}

	const now = new Date();

	// Create favorite
	await NoteFavorites.insert({
		id: genIdAt(now),
		createdAt: now,
		noteId: note.id,
		userId: user.id,
	});
});
