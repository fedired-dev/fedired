import define from "@/server/api/define.js";
import { ApiError } from "@/server/api/error.js";
import { Channels, DriveFiles } from "@/models/index.js";
import type { Channel } from "@/models/entities/channel.js";
import { genIdAt } from "backend-rs";

export const meta = {
	tags: ["channels"],

	requireCredential: true,

	kind: "write:channels",

	res: {
		type: "object",
		optional: false,
		nullable: false,
		ref: "Channel",
	},

	errors: {
		noSuchFile: {
			message: "No such file.",
			code: "NO_SUCH_FILE",
			id: "cd1e9f3e-5a12-4ab4-96f6-5d0a2cc32050",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		name: { type: "string", minLength: 1, maxLength: 128 },
		description: {
			type: "string",
			nullable: true,
			minLength: 1,
			maxLength: 2048,
		},
		bannerId: { type: "string", format: "misskey:id", nullable: true },
	},
	required: ["name"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	let banner = null;
	if (ps.bannerId != null) {
		banner = await DriveFiles.findOneBy({
			id: ps.bannerId,
			userId: user.id,
		});

		if (banner == null) {
			throw new ApiError(meta.errors.noSuchFile);
		}
	}

	const now = new Date();

	const channel = await Channels.insert({
		id: genIdAt(now),
		createdAt: now,
		userId: user.id,
		name: ps.name,
		description: ps.description || null,
		bannerId: banner ? banner.id : null,
	} as Channel).then((x) => Channels.findOneByOrFail(x.identifiers[0]));

	return await Channels.pack(channel, user);
});
