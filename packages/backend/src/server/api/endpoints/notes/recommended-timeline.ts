import { Brackets } from "typeorm";
import { fetchMeta } from "backend-rs";
import { Notes } from "@/models/index.js";
import { activeUsersChart } from "@/services/chart/index.js";
import define from "@/server/api/define.js";
import { ApiError } from "@/server/api/error.js";
import { generateMutedUserQuery } from "@/server/api/common/generate-muted-user-query.js";
import { makePaginationQuery } from "@/server/api/common/make-pagination-query.js";
import { generateVisibilityQuery } from "@/server/api/common/generate-visibility-query.js";
import { generateRepliesQuery } from "@/server/api/common/generate-replies-query.js";
import { generateMutedNoteQuery } from "@/server/api/common/generate-muted-note-query.js";
import { generateChannelQuery } from "@/server/api/common/generate-channel-query.js";
import { generateBlockedUserQuery } from "@/server/api/common/generate-block-query.js";
import { generateMutedUserRenotesQueryForNotes } from "@/server/api/common/generated-muted-renote-query.js";
import { generateMutedUserRepliesQueryForNotes } from "@/server/api/common/generated-muted-reply-query.js";

export const meta = {
	tags: ["notes"],
	requireCredentialPrivateMode: true,

	res: {
		type: "array",
		optional: false,
		nullable: false,
		items: {
			type: "object",
			optional: false,
			nullable: false,
			ref: "Note",
		},
	},

	errors: {
		rtlDisabled: {
			message: "Recommended timeline has been disabled.",
			code: "RTL_DISABLED",
			id: "45a6eb02-7695-4393-b023-dd3be9aaaefe",
		},
		queryError: {
			message: "Please follow more users.",
			code: "QUERY_ERROR",
			id: "620763f4-f621-4533-ab33-0577a1a3c343",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		withFiles: {
			type: "boolean",
			default: false,
			description: "Only show notes that have attached files.",
		},
		fileType: {
			type: "array",
			items: {
				type: "string",
			},
		},
		excludeNsfw: { type: "boolean", default: false },
		limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: "string", format: "misskey:id" },
		untilId: { type: "string", format: "misskey:id" },
		sinceDate: { type: "integer" },
		untilDate: { type: "integer" },
		withReplies: {
			type: "boolean",
			default: false,
			description: "Show replies in the timeline",
		},
	},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const instanceMeta = await fetchMeta();
	if (instanceMeta.disableRecommendedTimeline) {
		if (user == null || !(user.isAdmin || user.isModerator)) {
			throw new ApiError(meta.errors.rtlDisabled);
		}
	}

	//#region Construct query
	const query = makePaginationQuery(
		Notes.createQueryBuilder("note"),
		ps.sinceId,
		ps.untilId,
		ps.sinceDate,
		ps.untilDate,
	)
		.andWhere(
			`(note.userHost = ANY ('{"${instanceMeta.recommendedInstances.join('","')}"}'))`,
		)
		.andWhere("(note.visibility = 'public')")
		.innerJoinAndSelect("note.user", "user")
		.leftJoinAndSelect("user.avatar", "avatar")
		.leftJoinAndSelect("user.banner", "banner")
		.leftJoinAndSelect("note.reply", "reply")
		.leftJoinAndSelect("note.renote", "renote")
		.leftJoinAndSelect("reply.user", "replyUser")
		.leftJoinAndSelect("replyUser.avatar", "replyUserAvatar")
		.leftJoinAndSelect("replyUser.banner", "replyUserBanner")
		.leftJoinAndSelect("renote.user", "renoteUser")
		.leftJoinAndSelect("renoteUser.avatar", "renoteUserAvatar")
		.leftJoinAndSelect("renoteUser.banner", "renoteUserBanner");

	generateChannelQuery(query, user);
	generateRepliesQuery(query, ps.withReplies, user);
	generateVisibilityQuery(query, user);
	if (user != null) {
		generateMutedUserQuery(query, user);
		generateMutedNoteQuery(query, user);
		generateBlockedUserQuery(query, user);
		generateMutedUserRenotesQueryForNotes(query, user);
		generateMutedUserRepliesQueryForNotes(query, user);
	}

	if (ps.withFiles) {
		query.andWhere("note.fileIds != '{}'");
	}

	if (ps.fileType != null) {
		query.andWhere("note.fileIds != '{}'");
		query.andWhere(
			new Brackets((qb) => {
				for (const type of ps.fileType!) {
					const i = ps.fileType!.indexOf(type);
					qb.orWhere(`:type${i} = ANY(note.attachedFileTypes)`, {
						[`type${i}`]: type,
					});
				}
			}),
		);

		if (ps.excludeNsfw) {
			query.andWhere("note.cw IS NULL");
			query.andWhere(
				'0 = (SELECT COUNT(*) FROM drive_file df WHERE df.id = ANY(note."fileIds") AND df."isSensitive" = TRUE)',
			);
		}
	}
	query.andWhere("note.visibility != 'hidden'");
	//#endregion

	process.nextTick(() => {
		if (user) {
			activeUsersChart.read(user);
		}
	});

	// We fetch more than requested because some may be filtered out, and if there's less than
	// requested, the pagination stops.
	const found = [];
	const take = Math.floor(ps.limit * 1.5);
	let skip = 0;
	try {
		while (found.length < ps.limit) {
			const notes = await query.take(take).skip(skip).getMany();
			found.push(...(await Notes.packMany(notes, user)));
			skip += take;
			if (notes.length < take) break;
		}
	} catch (error) {
		throw new ApiError(meta.errors.queryError);
	}

	if (found.length > ps.limit) {
		found.length = ps.limit;
	}

	return found;
});
