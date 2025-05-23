import deleteNote from "@/services/note/delete.js";
import { Notes } from "@/models/index.js";
import define from "@/server/api/define.js";
import { getNote } from "@/server/api/common/getters.js";
import { ApiError } from "@/server/api/error.js";
import { SECOND, HOUR } from "@/const.js";
import { NoteEvent, publishToNoteStream } from "backend-rs";

export const meta = {
	tags: ["notes"],

	requireCredential: true,

	kind: "write:notes",

	limit: {
		duration: HOUR,
		max: 300,
		minInterval: SECOND,
	},

	errors: {
		noSuchNote: {
			message: "No such note.",
			code: "NO_SUCH_NOTE",
			id: "490be23f-8c1f-4796-819f-94cb4f9d1630",
		},

		accessDenied: {
			message: "Access denied.",
			code: "ACCESS_DENIED",
			id: "fe8d7103-0ea8-4ec3-814d-f8b401dc69e9",
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
	const note = await getNote(ps.noteId, user).catch((err) => {
		if (err.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24")
			throw new ApiError(meta.errors.noSuchNote);
		throw err;
	});

	if (note.userId !== user.id) {
		throw new ApiError(meta.errors.accessDenied);
	}

	await deleteNote(user, note, false);
	await Notes.update(note.id, {
		visibility: "specified",
		visibleUserIds: [],
	});

	// Publish update event for the updated note details
	// TODO: Send "deleted" to other users?
	publishToNoteStream(note.id, NoteEvent.Update, {
		updatedAt: new Date(),
	});
});
