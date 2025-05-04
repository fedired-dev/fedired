import { uploadFromUrl } from "@/services/drive/upload-from-url.js";
import define from "@/server/api/define.js";
import { DriveFiles } from "@/models/index.js";
import { Event, publishToMainStream } from "backend-rs";
import { HOUR } from "@/const.js";

export const meta = {
	tags: ["drive"],

	limit: {
		duration: HOUR,
		max: 60,
	},

	description:
		"Request the server to download a new drive file from the specified URL.",

	requireCredential: true,

	kind: "write:drive",
} as const;

export const paramDef = {
	type: "object",
	properties: {
		url: { type: "string" },
		name: { type: "string" },
		folderId: {
			type: "string",
			format: "misskey:id",
			nullable: true,
			default: null,
		},
		isSensitive: { type: "boolean", default: false },
		comment: { type: "string", nullable: true, maxLength: 512, default: null },
		marker: { type: "string", nullable: true, default: null },
		force: { type: "boolean", default: false },
	},
	required: ["url"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	uploadFromUrl({
		url: ps.url,
		name: ps.name,
		user,
		folderId: ps.folderId,
		sensitive: ps.isSensitive,
		force: ps.force,
		comment: ps.comment,
	}).then((file) => {
		DriveFiles.pack(file, { self: true }).then((packedFile) => {
			publishToMainStream(user.id, Event.UrlUploadFinished, {
				marker: ps.marker,
				file: packedFile,
			});
		});
	});
});
