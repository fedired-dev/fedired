import { UserLists } from "@/models/index.js";
import { genIdAt } from "backend-rs";
import type { UserList } from "@/models/entities/user-list.js";
import define from "@/server/api/define.js";

export const meta = {
	tags: ["lists"],

	requireCredential: true,

	kind: "write:account",

	description: "Create a new list of users.",

	res: {
		type: "object",
		optional: false,
		nullable: false,
		ref: "UserList",
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		name: { type: "string", minLength: 1, maxLength: 100 },
	},
	required: ["name"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const now = new Date();
	const userList = await UserLists.insert({
		id: genIdAt(now),
		createdAt: now,
		userId: user.id,
		name: ps.name,
	} as UserList).then((x) => UserLists.findOneByOrFail(x.identifiers[0]));

	return await UserLists.pack(userList);
});
