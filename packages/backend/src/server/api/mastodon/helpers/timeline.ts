import type { Note } from "@/models/entities/note.js";
import type { ILocalUser, User } from "@/models/entities/user.js";
import {
	Notes,
	Notifications,
	RegistryItems,
	UserListJoinings,
} from "@/models/index.js";
import { Brackets } from "typeorm";
import { generateChannelQuery } from "@/server/api/common/generate-channel-query.js";
import { generateRepliesQuery } from "@/server/api/common/generate-replies-query.js";
import { generateVisibilityQuery } from "@/server/api/common/generate-visibility-query.js";
import { generateMutedUserQuery } from "@/server/api/common/generate-muted-user-query.js";
import { generateBlockedUserQuery } from "@/server/api/common/generate-block-query.js";
import { generateMutedUserRenotesQueryForNotes } from "@/server/api/common/generated-muted-renote-query.js";
import { fetchMeta, genId } from "backend-rs";
import { PaginationHelpers } from "@/server/api/mastodon/helpers/pagination.js";
import type { UserList } from "@/models/entities/user-list.js";
import { UserHelpers } from "@/server/api/mastodon/helpers/user.js";
import { UserConverter } from "@/server/api/mastodon/converters/user.js";
import { NoteConverter } from "@/server/api/mastodon/converters/note.js";
import { awaitAll } from "@/prelude/await-all.js";
import { unique } from "@/prelude/array.js";
import { MastoApiError } from "@/server/api/mastodon/middleware/catch-errors.js";
import { generatePaginationData } from "@/server/api/mastodon/middleware/pagination.js";
import type { MastoContext } from "@/server/api/mastodon/index.js";
import { generateListQuery } from "@/server/api/common/generate-list-query.js";
import { generateFollowingQuery } from "@/server/api/common/generate-following-query.js";

export class TimelineHelpers {
	public static async getHomeTimeline(
		maxId: string | undefined,
		sinceId: string | undefined,
		minId: string | undefined,
		limit = 20,
		ctx: MastoContext,
	): Promise<Note[]> {
		if (limit > 40) limit = 40;
		const user = ctx.user as ILocalUser;

		const query = PaginationHelpers.makePaginationQuery(
			Notes.createQueryBuilder("note"),
			sinceId,
			maxId,
			minId,
		)
			.leftJoinAndSelect("note.user", "user")
			.leftJoinAndSelect("note.renote", "renote");

		await generateFollowingQuery(query, user);
		generateListQuery(query, user);
		generateChannelQuery(query, user);
		generateRepliesQuery(query, true, user);
		generateVisibilityQuery(query, user);
		generateMutedUserQuery(query, user);
		generateBlockedUserQuery(query, user);
		generateMutedUserRenotesQueryForNotes(query, user);

		query
			.andWhere("note.visibility != 'hidden'")
			.andWhere("note.scheduledAt IS NULL");

		return PaginationHelpers.execQueryLinkPagination(
			query,
			limit,
			minId !== undefined,
			ctx,
		);
	}

	public static async getPublicTimeline(
		maxId: string | undefined,
		sinceId: string | undefined,
		minId: string | undefined,
		limit = 20,
		onlyMedia = false,
		local = false,
		remote = false,
		ctx: MastoContext,
	): Promise<Note[]> {
		if (limit > 40) limit = 40;
		const user = ctx.user as ILocalUser;

		if (local && remote) {
			throw new Error("local and remote are mutually exclusive options");
		}

		if (!local) {
			const instanceMeta = await fetchMeta();
			if (instanceMeta.disableGlobalTimeline) {
				if (user == null || !(user.isAdmin || user.isModerator)) {
					throw new Error("global timeline is disabled");
				}
			}
		}

		const query = PaginationHelpers.makePaginationQuery(
			Notes.createQueryBuilder("note"),
			sinceId,
			maxId,
			minId,
		)
			.andWhere("note.visibility = 'public'")
			.andWhere("note.scheduledAt IS NULL");

		if (remote) query.andWhere("note.userHost IS NOT NULL");
		if (local) query.andWhere("note.userHost IS NULL");
		if (!local) query.andWhere("note.channelId IS NULL");

		query
			.leftJoinAndSelect("note.user", "user")
			.leftJoinAndSelect("note.renote", "renote");

		generateRepliesQuery(query, true, user);

		if (user) {
			generateMutedUserQuery(query, user);
			generateBlockedUserQuery(query, user);
			generateMutedUserRenotesQueryForNotes(query, user);
		}

		if (onlyMedia) query.andWhere("note.fileIds != '{}'");

		return PaginationHelpers.execQueryLinkPagination(
			query,
			limit,
			minId !== undefined,
			ctx,
		);
	}

	public static async getListTimeline(
		list: UserList,
		maxId: string | undefined,
		sinceId: string | undefined,
		minId: string | undefined,
		limit = 20,
		ctx: MastoContext,
	): Promise<Note[]> {
		if (limit > 40) limit = 40;
		const user = ctx.user as ILocalUser;
		if (user.id !== list.userId) throw new Error("List is not owned by user");

		const listQuery = UserListJoinings.createQueryBuilder("member")
			.select("member.userId", "userId")
			.where("member.userListId = :listId");

		const query = PaginationHelpers.makePaginationQuery(
			Notes.createQueryBuilder("note"),
			sinceId,
			maxId,
			minId,
		)
			.andWhere(`note.userId IN (${listQuery.getQuery()})`)
			.andWhere("note.visibility != 'specified'")
			.andWhere("note.scheduledAt IS NULL")
			.leftJoinAndSelect("note.user", "user")
			.leftJoinAndSelect("note.renote", "renote")
			.setParameters({ listId: list.id });

		generateVisibilityQuery(query, user);

		return PaginationHelpers.execQueryLinkPagination(
			query,
			limit,
			minId !== undefined,
			ctx,
		);
	}

	public static async getTagTimeline(
		tag: string,
		maxId: string | undefined,
		sinceId: string | undefined,
		minId: string | undefined,
		limit = 20,
		any: string[],
		all: string[],
		none: string[],
		onlyMedia = false,
		local = false,
		remote = false,
		ctx: MastoContext,
	): Promise<Note[]> {
		if (limit > 40) limit = 40;
		const user = ctx.user as ILocalUser | null;

		if (tag.length < 1) throw new MastoApiError(400, "Tag cannot be empty");

		if (local && remote) {
			throw new Error("local and remote are mutually exclusive options");
		}

		const query = PaginationHelpers.makePaginationQuery(
			Notes.createQueryBuilder("note"),
			sinceId,
			maxId,
			minId,
		)
			.andWhere("note.visibility = 'public'")
			.andWhere("note.scheduledAt IS NULL")
			.andWhere("note.tags @> array[:tag]::varchar[]", { tag: tag });

		if (any.length > 0)
			query.andWhere("note.tags && array[:...any]::varchar[]", { any: any });
		if (all.length > 0)
			query.andWhere("note.tags @> array[:...all]::varchar[]", { all: all });
		if (none.length > 0)
			query.andWhere("NOT(note.tags @> array[:...none]::varchar[])", {
				none: none,
			});

		if (remote) query.andWhere("note.userHost IS NOT NULL");
		if (local) query.andWhere("note.userHost IS NULL");
		if (!local) query.andWhere("note.channelId IS NULL");

		query
			.leftJoinAndSelect("note.user", "user")
			.leftJoinAndSelect("note.renote", "renote");

		generateRepliesQuery(query, true, user);

		if (user) {
			generateMutedUserQuery(query, user);
			generateBlockedUserQuery(query, user);
			generateMutedUserRenotesQueryForNotes(query, user);
		}

		if (onlyMedia) query.andWhere("note.fileIds != '{}'");

		return PaginationHelpers.execQueryLinkPagination(
			query,
			limit,
			minId !== undefined,
			ctx,
		);
	}

	public static async getConversations(
		maxId: string | undefined,
		sinceId: string | undefined,
		minId: string | undefined,
		limit = 20,
		ctx: MastoContext,
	): Promise<MastodonEntity.Conversation[]> {
		if (limit > 40) limit = 40;
		const user = ctx.user as ILocalUser;
		const sq = Notes.createQueryBuilder("note")
			.select("COALESCE(note.threadId, note.id)", "conversationId")
			.addSelect("note.id", "latest")
			.distinctOn(["COALESCE(note.threadId, note.id)"])
			.orderBy({
				"COALESCE(note.threadId, note.id)": minId ? "ASC" : "DESC",
				"note.id": "DESC",
			})
			.andWhere("note.visibility = 'specified'")
			.andWhere(
				new Brackets((qb) => {
					qb.where("note.userId = :userId");
					qb.orWhere("note.visibleUserIds @> array[:userId]::varchar[]");
				}),
			);

		const query = PaginationHelpers.makePaginationQuery(
			Notes.createQueryBuilder("note"),
			sinceId,
			maxId,
			minId,
		)
			.andWhere("note.scheduledAt IS NULL")
			.innerJoin(`(${sq.getQuery()})`, "sq", "note.id = sq.latest")
			.setParameters({ userId: user.id });

		return query
			.take(limit)
			.getMany()
			.then((p) => {
				if (minId !== undefined) p = p.reverse();
				const conversations = p.map((c) => {
					// Gather all unique IDs except for the local user
					const userIds = unique(
						[c.userId].concat(c.visibleUserIds).filter((p) => p !== user.id),
					);
					const users = userIds.map((id) =>
						UserHelpers.getUserCached(id, ctx).catch((_) => null),
					);
					const accounts = Promise.all(users).then((u) =>
						UserConverter.encodeMany(u.filter((u) => u) as User[], ctx),
					);
					const unread = Notifications.createQueryBuilder("notification")
						.where("notification.noteId = :noteId")
						.andWhere("notification.notifieeId = :userId")
						.andWhere("notification.isRead = FALSE")
						.andWhere("notification.type IN (:...types)")
						.setParameter("noteId", c.id)
						.setParameter("userId", user.id)
						.setParameter("types", ["reply", "mention"])
						.getExists();

					return {
						id: c.threadId ?? c.id,
						accounts: accounts.then((u) =>
							u.length > 0 ? u : UserConverter.encodeMany([user], ctx),
						), // failsafe to prevent apps from crashing case when all participant users have been deleted
						last_status: NoteConverter.encode(c, ctx),
						unread: unread,
					};
				});

				ctx.pagination = generatePaginationData(
					p.map((p) => p.threadId ?? p.id),
					limit,
				);
				return Promise.all(conversations.map((c) => awaitAll(c)));
			});
	}

	public static async getMarkers(
		timelines: string[],
		ctx: MastoContext,
	): Promise<MastodonEntity.Marker> {
		const query = RegistryItems.createQueryBuilder("item")
			.where("item.userId = :userId", { userId: ctx.user.id })
			.andWhere("item.scope = :scope", { scope: ["mastodon", "markers"] })
			.andWhere("item.key IN (:...timelines)", { timelines });
		const markerData = await query.getMany();
		const result: MastodonEntity.Marker = {};
		for (const key of ["home", "notifications"] as const) {
			const m = markerData.find((m) => m.key === key);
			if (m) {
				result[key] = {
					last_read_id: m.value.lastReadId,
					version: m.value.version,
					updated_at: m.updatedAt.toISOString(),
				};
			}
		}
		return result;
	}

	public static async setMarkers(
		body: any,
		ctx: MastoContext,
	): Promise<MastodonEntity.Marker> {
		const result: MastodonEntity.Marker = {};
		const now = new Date();

		for (const key of ["home", "notifications"] as const) {
			if (!body[key]) continue;
			let entry = await RegistryItems.createQueryBuilder("item")
				.where("item.userId = :userId", { userId: ctx.user.id })
				.andWhere("item.scope = :scope", { scope: ["mastodon", "markers"] })
				.andWhere("item.key = :key", { key })
				.getOne();
			if (!entry) {
				entry = RegistryItems.create({
					id: genId(),
					userId: ctx.user.id,
					scope: ["mastodon", "markers"],
					key,
					createdAt: now,
					updatedAt: now,
					value: {
						lastReadId: body[key].last_read_id,
						version: 0,
					},
				});
			} else {
				entry.value = {
					lastReadId: body[key].last_read_id,
					version: entry.value.version + 1,
				};
				entry.updatedAt = now;
			}
			await RegistryItems.save(entry);
			result[key] = {
				last_read_id: entry.value.lastReadId,
				version: entry.value.version,
				updated_at: entry.updatedAt.toISOString(),
			};
		}
		return result;
	}
}
