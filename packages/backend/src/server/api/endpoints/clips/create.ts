import define from "@/server/api/define.js";
import { genIdAt } from "backend-rs";
import { Clips } from "@/models/index.js";

export const meta = {
	tags: ["clips"],

	requireCredential: true,

	kind: "write:account",

	res: {
		type: "object",
		optional: false,
		nullable: false,
		ref: "Clip",
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		name: { type: "string", minLength: 1, maxLength: 100 },
		isPublic: { type: "boolean", default: false },
		description: {
			type: "string",
			nullable: true,
			minLength: 1,
			maxLength: 2048,
		},
	},
	required: ["name"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const now = new Date();
	const clip = await Clips.insert({
		id: genIdAt(now),
		createdAt: now,
		userId: user.id,
		name: ps.name,
		isPublic: ps.isPublic,
		description: ps.description,
	}).then((x) => Clips.findOneByOrFail(x.identifiers[0]));

	return await Clips.pack(clip);
});
