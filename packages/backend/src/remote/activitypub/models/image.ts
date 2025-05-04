import { uploadFromUrl } from "@/services/drive/upload-from-url.js";
import type { CacheableRemoteUser } from "@/models/entities/user.js";
import Resolver from "../resolver.js";
import { fetchMeta } from "backend-rs";
import { apLogger } from "../logger.js";
import type {
	DriveFile,
	DriveFileUsageHint,
} from "@/models/entities/drive-file.js";
import { DriveFiles } from "@/models/index.js";
import { truncate } from "@/misc/truncate.js";
import { config } from "@/config.js";

/**
 * create an Image.
 */
export async function createImage(
	actor: CacheableRemoteUser,
	value: any,
	usage: DriveFileUsageHint,
): Promise<DriveFile> {
	// Skip if author is frozen.
	if (actor.isSuspended) {
		throw new Error("actor has been suspended");
	}

	const image = (await new Resolver().resolve(value)) as any;

	if (image.url == null) {
		throw new Error("Invalid image, URL not provided");
	}

	if (!image.url.startsWith("https://") && !image.url.startsWith("http://")) {
		throw new Error(`Invalid image, unexpected schema: ${image.url}`);
	}

	apLogger.info(`Creating an image: ${image.url}`);

	const instanceMeta = await fetchMeta();

	let file = await uploadFromUrl({
		url: image.url,
		user: actor,
		uri: image.url,
		sensitive: image.sensitive,
		isLink: !instanceMeta.cacheRemoteFiles,
		comment: truncate(image.name, config.maxCaptionLength),
		usageHint: usage,
	});

	if (file.isLink) {
		// If the URL is different, it means that the same image was previously
		// registered with a different URL, so update the URL
		if (file.url !== image.url) {
			await DriveFiles.update(
				{ id: file.id },
				{
					url: image.url,
					uri: image.url,
				},
			);

			file = await DriveFiles.findOneByOrFail({ id: file.id });
		}
	}

	return file;
}

/**
 * Resolve Image.
 *
 * If the target Image is registered in fedired, return it, otherwise
 * Fetch from remote server, register with fedired and return it.
 */
export async function resolveImage(
	actor: CacheableRemoteUser,
	value: any,
	usage: DriveFileUsageHint,
): Promise<DriveFile> {
	// TODO

	// Fetch from remote server and register
	return await createImage(actor, value, usage);
}
