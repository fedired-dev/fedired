import { Event, publishToMainStream } from "backend-rs";
import { Users, Pages } from "@/models/index.js";
import define from "@/server/api/define.js";
import { ApiError } from "@/server/api/error.js";

export const meta = {
	requireCredential: true,
	secure: true,

	errors: {
		noSuchPage: {
			message: "No such page.",
			code: "NO_SUCH_PAGE",
			id: "4a13ad31-6729-46b4-b9af-e86b265c2e74",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		pageId: { type: "string", format: "misskey:id" },
		event: { type: "string" },
		var: {},
	},
	required: ["pageId", "event"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const page = await Pages.findOneBy({ id: ps.pageId });
	if (page == null) {
		throw new ApiError(meta.errors.noSuchPage);
	}

	publishToMainStream(page.userId, Event.Page, {
		pageId: ps.pageId,
		event: ps.event,
		var: ps.var,
		userId: user.id,
		user: await Users.pack(
			user.id,
			{ id: page.userId },
			{
				detail: true,
			},
		),
	});
});
