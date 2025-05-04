import type { ILocalUser, User } from "@/models/entities/user.js";
import {
	Blockings,
	Followings,
	UserListJoinings,
	UserLists,
	Users,
} from "@/models/index.js";
import { PaginationHelpers } from "@/server/api/mastodon/helpers/pagination.js";
import type { UserList } from "@/models/entities/user-list.js";
import { pushUserToUserList } from "@/services/user-list/push.js";
import { genId } from "backend-rs";
import { MastoApiError } from "@/server/api/mastodon/middleware/catch-errors.js";
import type { MastoContext } from "@/server/api/mastodon/index.js";

export class ListHelpers {
	public static async getLists(
		ctx: MastoContext,
	): Promise<MastodonEntity.List[]> {
		const user = ctx.user as ILocalUser;

		return UserLists.findBy({ userId: user.id }).then((p) =>
			p.map((list) => {
				return {
					id: list.id,
					title: list.name,
					exclusive: false,
				};
			}),
		);
	}

	public static async getList(
		id: string,
		ctx: MastoContext,
	): Promise<MastodonEntity.List> {
		const user = ctx.user as ILocalUser;

		return UserLists.findOneByOrFail({ userId: user.id, id: id }).then(
			(list) => {
				return {
					id: list.id,
					title: list.name,
					exclusive: false,
				};
			},
		);
	}

	public static async getListOr404(
		id: string,
		ctx: MastoContext,
	): Promise<MastodonEntity.List> {
		return this.getList(id, ctx).catch((_) => {
			throw new MastoApiError(404);
		});
	}

	public static async getListUsers(
		id: string,
		maxId: string | undefined,
		sinceId: string | undefined,
		minId: string | undefined,
		limit = 40,
		ctx: MastoContext,
	): Promise<User[]> {
		if (limit > 80) limit = 80;
		const user = ctx.user as ILocalUser;
		const list = await UserLists.findOneBy({ userId: user.id, id: id });
		if (!list) throw new MastoApiError(404);
		const query = PaginationHelpers.makePaginationQuery(
			UserListJoinings.createQueryBuilder("member"),
			sinceId,
			maxId,
			minId,
		)
			.andWhere("member.userListId = :listId", { listId: list.id })
			.innerJoinAndSelect("member.user", "user");

		return PaginationHelpers.execQueryLinkPagination(
			query,
			limit,
			minId !== undefined,
			ctx,
		).then((members) => {
			return members.map((p) => p.user).filter((p) => p) as User[];
		});
	}

	public static async deleteList(list: UserList, ctx: MastoContext) {
		const user = ctx.user as ILocalUser;
		if (user.id !== list.userId) throw new Error("List is not owned by user");
		await UserLists.delete(list.id);
	}

	public static async addToList(
		list: UserList,
		usersToAdd: User[],
		ctx: MastoContext,
	) {
		const localUser = ctx.user as ILocalUser;
		if (localUser.id !== list.userId)
			throw new Error("List is not owned by user");
		for (const user of usersToAdd) {
			if (user.id !== localUser.id) {
				const isBlocked = await Blockings.exists({
					where: {
						blockerId: user.id,
						blockeeId: localUser.id,
					},
				});
				const isFollowed = await Followings.exists({
					where: {
						followeeId: user.id,
						followerId: localUser.id,
					},
				});
				if (isBlocked)
					throw Error("Can’t add users you’ve been blocked by to list");
				if (!isFollowed)
					throw Error("Can’t add users you’re not following to list");
			}

			const exists = await UserListJoinings.existsBy({
				userListId: list.id,
				userId: user.id,
			});

			if (exists) continue;
			await pushUserToUserList(user, list);
		}
	}

	public static async removeFromList(
		list: UserList,
		usersToRemove: User[],
		ctx: MastoContext,
	) {
		const localUser = ctx.user as ILocalUser;
		if (localUser.id !== list.userId)
			throw new Error("List is not owned by user");
		for (const user of usersToRemove) {
			const exists = await UserListJoinings.existsBy({
				userListId: list.id,
				userId: user.id,
			});

			if (!exists) continue;
			await UserListJoinings.delete({ userListId: list.id, userId: user.id });
		}
	}

	public static async createList(
		title: string,
		ctx: MastoContext,
	): Promise<MastodonEntity.List> {
		if (title.length < 1)
			throw new MastoApiError(400, "Title must not be empty");

		const user = ctx.user as ILocalUser;
		const list = await UserLists.insert({
			id: genId(),
			createdAt: new Date(),
			userId: user.id,
			name: title,
		}).then(async (res) => await UserLists.findOneByOrFail(res.identifiers[0]));

		return {
			id: list.id,
			title: list.name,
			exclusive: false,
		};
	}

	public static async updateList(
		list: UserList,
		title: string,
		exclusive: boolean | undefined,
		ctx: MastoContext,
	): Promise<MastodonEntity.List> {
		if (title.length < 1 && exclusive === undefined)
			throw new MastoApiError(400, "Either title or exclusive must be set");

		const user = ctx.user as ILocalUser;
		if (user.id !== list.userId) throw new Error("List is not owned by user");

		const name = title.length > 0 ? title : undefined;
		const partial = { name: name };
		const result = await UserLists.update(list.id, partial).then(
			async (_) => await UserLists.findOneByOrFail({ id: list.id }),
		);

		/*
		// FIXME: Fedired doesn’t support exclusive lists
		if (exclusive !== undefined) {
			UserListJoinings.findBy({ userListId: list.id }).then((members) => {
				for (const member of members) {
					await publishToUserStream(
						list.userId,
						exclusive ? UserEvent.Hidden : UserEvent.Unhidden,
						member.userId,
					);
				}
			});
		}
		*/

		return {
			id: result.id,
			title: result.name,
			exclusive: false,
		};
	}

	public static async getListsByMember(
		member: User,
		ctx: MastoContext,
	): Promise<MastodonEntity.List[]> {
		const user = ctx.user as ILocalUser;
		const joinQuery = UserListJoinings.createQueryBuilder("member")
			.select("member.userListId")
			.where("member.userId = :memberId");
		const query = UserLists.createQueryBuilder("list")
			.where("list.userId = :userId", { userId: user.id })
			.andWhere(`list.id IN (${joinQuery.getQuery()})`)
			.setParameters({ memberId: member.id });

		return query.getMany().then((results) =>
			results.map((result) => {
				return {
					id: result.id,
					title: result.name,
					exclusive: false,
				};
			}),
		);
	}
}
