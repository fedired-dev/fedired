import type Bull from "bull";
import * as fs from "node:fs";

import mime from "mime-types";
import archiver from "archiver";
import { queueLogger } from "../../logger.js";
import { addFile } from "@/services/drive/add-file.js";
import { format as dateFormat } from "date-fns";
import { Users, Emojis } from "@/models/index.js";
import { createTemp, createTempDir } from "@/misc/create-temp.js";
import { downloadUrl } from "@/misc/download-url.js";
import { config } from "@/config.js";
import { IsNull } from "typeorm";
import { inspect } from "node:util";

const logger = queueLogger.createSubLogger("export-custom-emojis");

export async function exportCustomEmojis(
	job: Bull.Job,
	done: () => void,
): Promise<void> {
	logger.info("Exporting custom emojis ...");

	const user = await Users.findOneBy({ id: job.data.user.id });
	if (user == null) {
		done();
		return;
	}

	const [path, cleanup] = await createTempDir();

	logger.info(`temp dir created: ${path}`);

	const metaPath = `${path}/meta.json`;

	fs.writeFileSync(metaPath, "", "utf-8");

	const metaStream = fs.createWriteStream(metaPath, { flags: "a" });

	const writeMeta = (text: string): Promise<void> => {
		return new Promise<void>((res, rej) => {
			metaStream.write(text, (err) => {
				if (err) {
					logger.warn("Failed to export custom emojis");
					logger.info(inspect(err));
					rej(err);
				} else {
					res();
				}
			});
		});
	};

	await writeMeta(
		`{"metaVersion":2,"host":"${
			config.host
		}","exportedAt":"${new Date().toString()}","emojis":[`,
	);

	const customEmojis = await Emojis.find({
		where: {
			host: IsNull(),
		},
		order: {
			id: "ASC",
		},
	});

	for (const emoji of customEmojis) {
		const ext = mime.extension(emoji.type);
		const fileName = emoji.name + (ext ? `.${ext}` : "");
		const emojiPath = `${path}/${fileName}`;
		fs.writeFileSync(emojiPath, "", "binary");
		let downloaded = false;

		try {
			await downloadUrl(emoji.originalUrl, emojiPath);
			downloaded = true;
		} catch (e) {
			// TODO: 何度か再試行
			logger.error(inspect(e));
		}

		if (!downloaded) {
			fs.unlinkSync(emojiPath);
		}

		const content = JSON.stringify({
			fileName: fileName,
			downloaded: downloaded,
			emoji: emoji,
		});
		const isFirst = customEmojis.indexOf(emoji) === 0;

		await writeMeta(isFirst ? content : ",\n" + content);
	}

	await writeMeta("]}");

	metaStream.end();

	// Create archive
	const [archivePath, archiveCleanup] = await createTemp();
	const archiveStream = fs.createWriteStream(archivePath);
	const archive = archiver("zip", {
		zlib: { level: 0 },
	});
	archiveStream.on("close", async () => {
		logger.info(`Exported to: ${archivePath}`);

		const fileName = `custom-emojis-${dateFormat(
			new Date(),
			"yyyy-MM-dd-HH-mm-ss",
		)}.zip`;
		const driveFile = await addFile({
			user,
			path: archivePath,
			name: fileName,
			force: true,
		});

		logger.info(`Exported to: ${driveFile.id}`);
		cleanup();
		archiveCleanup();
		done();
	});
	archive.pipe(archiveStream);
	archive.directory(path, false);
	archive.finalize();
}
