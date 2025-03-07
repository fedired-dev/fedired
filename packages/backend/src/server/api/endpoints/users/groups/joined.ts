import { Not, In } from "typeorm";
import { UserGroups, UserGroupJoinings } from "@/models/index.js";
import define from "@/server/api/define.js";

export const meta = {
	tags: ["groups", "account"],

	requireCredential: true,

	kind: "read:user-groups",

	description: "List the groups that the authenticated user is a member of.",

	res: {
		type: "array",
		optional: false,
		nullable: false,
		items: {
			type: "object",
			optional: false,
			nullable: false,
			ref: "UserGroup",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	const ownedGroups = await UserGroups.findBy({
		userId: me.id,
	});

	const joinings = await UserGroupJoinings.findBy({
		userId: me.id,
		...(ownedGroups.length > 0
			? {
					userGroupId: Not(In(ownedGroups.map((x) => x.id))),
				}
			: {}),
	});

	return await Promise.all(joinings.map((x) => UserGroups.pack(x.userGroupId)));
});
