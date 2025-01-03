import { Event, publishToMainStream } from "backend-rs";
import define from "@/server/api/define.js";
import { NoteUnreads } from "@/models/index.js";

export const meta = {
	tags: ["account"],

	requireCredential: true,

	kind: "write:account",
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	// Remove documents
	await NoteUnreads.delete({
		userId: user.id,
	});

	// 全て既読になったイベントを発行
	publishToMainStream(user.id, Event.ReadAllMentions, {});
	publishToMainStream(user.id, Event.ReadAllDms, {});
});
