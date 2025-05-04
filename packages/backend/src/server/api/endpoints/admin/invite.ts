import rndstr from "rndstr";
import define from "@/server/api/define.js";
import { RegistrationTickets } from "@/models/index.js";
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
			code: {
				type: "string",
				optional: false,
				nullable: false,
				example: "2ERUA5VR",
				maxLength: 8,
				minLength: 8,
			},
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async () => {
	const code = rndstr({
		length: 8,
		chars: "2-9A-HJ-NP-Z", // [0-9A-Z] w/o [01IO] (32 patterns)
	});

	const now = new Date();

	await RegistrationTickets.insert({
		id: genIdAt(now),
		createdAt: now,
		code,
	});

	return {
		code,
	};
});
