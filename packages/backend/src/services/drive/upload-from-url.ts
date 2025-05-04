import { URL } from "node:url";
import type { User } from "@/models/entities/user.js";
import { createTemp } from "@/misc/create-temp.js";
import { downloadUrl, isPrivateIp } from "@/misc/download-url.js";
import type { DriveFolder } from "@/models/entities/drive-folder.js";
import type {
	DriveFile,
	DriveFileUsageHint,
} from "@/models/entities/drive-file.js";
import { DriveFiles } from "@/models/index.js";
import { driveLogger } from "./logger.js";
import { addFile } from "./add-file.js";
import { inspect } from "node:util";

const logger = driveLogger.createSubLogger("downloader");

type Args = {
	url: string;
	user: {
		id: User["id"];
		host: User["host"];
		driveCapacityOverrideMb: User["driveCapacityOverrideMb"];
	} | null;
	name?: string;
	folderId?: DriveFolder["id"] | null;
	uri?: string | null;
	sensitive?: boolean;
	force?: boolean;
	isLink?: boolean;
	comment?: string | null;
	requestIp?: string | null;
	requestHeaders?: Record<string, string> | null;
	usageHint?: DriveFileUsageHint;
};

export async function uploadFromUrl({
	url,
	name,
	user,
	folderId = null,
	uri = null,
	sensitive = false,
	force = false,
	isLink = false,
	comment = null,
	requestIp = null,
	requestHeaders = null,
	usageHint = null,
}: Args): Promise<DriveFile> {
	const parsedUrl = new URL(url);
	if (
		process.env.NODE_ENV === "production" &&
		isPrivateIp(parsedUrl.hostname.replaceAll(/(\[)|(\])/g, ""))
	) {
		throw new Error("Private IP is not allowed");
	}

	let filename = name ?? parsedUrl.pathname.split("/").pop();
	if (filename == null || !DriveFiles.validateFileName(filename)) {
		filename = null;
	}

	// If the comment is same as the name, skip comment
	// (image.name is passed in when receiving attachment)
	if (comment != null && filename === comment) {
		comment = null;
	}

	// Create temp file
	const [path, cleanup] = await createTemp();

	try {
		// write content at URL to temp file
		await downloadUrl(url, path);

		const driveFile = await addFile({
			user,
			path,
			name: filename,
			comment,
			folderId,
			force,
			isLink,
			url,
			uri,
			sensitive,
			requestIp,
			requestHeaders,
			usageHint,
		});
		logger.info(`Got: ${driveFile.id}`);
		return driveFile;
	} catch (e) {
		logger.error(`Failed to create drive file:\n${inspect(e)}`);
		throw e;
	} finally {
		cleanup();
	}
}
