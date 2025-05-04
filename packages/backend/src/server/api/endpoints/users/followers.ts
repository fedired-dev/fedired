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

	description: "Show everyone that follows this user.",

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
			id: "27fa5435-88ab-43de-9360-387de88727cd",
		},

		forbidden: {
			message: "Forbidden.",
			code: "FORBIDDEN",
			id: "3c6a84db-d619-26af-ca14-06232a21df8a",
		},

		nullFollowers: {
			message: "No followers found.",
			code: "NULL_FOLLOWERS",
			id: "174a6507-a6c2-4925-8e5d-92fd08aedc9e",
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
			const isFollowed = await Followings.existsBy({
				followeeId: user.id,
				followerId: me.id,
			});
			if (!isFollowed) {
				throw new ApiError(meta.errors.nullFollowers);
			}
		}
	}

	const query = makePaginationQuery(
		Followings.createQueryBuilder("following"),
		ps.sinceId,
		ps.untilId,
	)
		.andWhere("following.followeeId = :userId", { userId: user.id })
		.innerJoinAndSelect("following.follower", "follower");

	const followings = await query.take(ps.limit).getMany();

	return await Followings.packMany(followings, me, { populateFollower: true });
});
