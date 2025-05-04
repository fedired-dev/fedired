import { IsNull } from "typeorm";
import { Users, Followings, UserProfiles } from "@/models/index.js";
import { toPuny } from "backend-rs";
import define from "@/server/api/define.js";
import { ApiError } from "@/server/api/error.js";
import { makePaginationQuery } from "@/server/api/common/make-pagination-query.js";

export const meta = {
	tags: ["users"],

	requireCredential: false,
	requireCredentialPrivateMode: true,

	description: "Show everyone that this user is following.",

	res: {
		type: "array",
		optional: false,
		nullable: false,
		items: {
			type: "object",
			optional: false,
			nullable: false,
			ref: "Following",
		},
	},

	errors: {
		noSuchUser: {
			message: "No such user.",
			code: "NO_SUCH_USER",
			id: "63e4aba4-4156-4e53-be25-c9559e42d71b",
		},

		forbidden: {
			message: "Forbidden.",
			code: "FORBIDDEN",
			id: "f6cdb0df-c19f-ec5c-7dbb-0ba84a1f92ba",
		},
		cannot_find: {
			message: "Cannot find the following.",
			code: "CANNOT_FIND",
			id: "7a55f0d7-8e06-4a7e-9c77-ee7d59b25a82",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		sinceId: { type: "string", format: "misskey:id" },
		untilId: { type: "string", format: "misskey:id" },
		limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
	},
	anyOf: [
		{
			properties: {
				userId: { type: "string", format: "misskey:id" },
			},
			required: ["userId"],
		},
		{
			properties: {
				username: { type: "string" },
				host: {
					type: "string",
					nullable: true,
					description: "The local host is represented with `null`.",
				},
			},
			required: ["username", "host"],
		},
	],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	const user = await Users.findOneBy(
		ps.userId != null
			? { id: ps.userId }
			: {
					usernameLower: ps.username!.toLowerCase(),
					host: ps.host == null ? IsNull() : toPuny(ps.host),
				},
	);

	if (user == null) {
		throw new ApiError(meta.errors.noSuchUser);
	}

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	// TODO: federate ffVisibility
	if (profile.userHost != null) {
		throw new ApiError(meta.errors.forbidden);
	}

	if (profile.ffVisibility === "private") {
		if (me == null || me.id !== user.id) {
			throw new ApiError(meta.errors.forbidden);
		}
	} else if (profile.ffVisibility === "followers") {
		if (me == null) {
			throw new ApiError(meta.errors.forbidden);
		} else if (me.id !== user.id) {
			const isFollowing = await Followings.existsBy({
				followeeId: user.id,
				followerId: me.id,
			});
			if (!isFollowing) {
				throw new ApiError(meta.errors.cannot_find);
			}
		}
	}

	const query = makePaginationQuery(
		Followings.createQueryBuilder("following"),
		ps.sinceId,
		ps.untilId,
	)
		.andWhere("following.followerId = :userId", { userId: user.id })
		.innerJoinAndSelect("following.followee", "followee");

	const followings = await query.take(ps.limit).getMany();

	return await Followings.packMany(followings, me, { populateFollowee: true });
});
