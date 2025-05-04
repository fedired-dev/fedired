import type Bull from "bull";

import { queueLogger } from "../../logger.js";
import { resolveUser } from "@/remote/resolve-user.js";
import { downloadTextFile } from "@/misc/download-text-file.js";
import { Users, DriveFiles, Mutings } from "@/models/index.js";
import type { DbUserImportJobData } from "@/queue/types.js";
import type { User } from "@/models/entities/user.js";
import { genIdAt, isSelfHost, stringToAcct, toPuny } from "backend-rs";
import { IsNull } from "typeorm";
import { inspect } from "node:util";

const logger = queueLogger.createSubLogger("import-muting");

export async function importMuting(
	job: Bull.Job<DbUserImportJobData>,
	done: any,
): Promise<void> {
	logger.info(`Importing muting of ${job.data.user.id} ...`);

	const user = await Users.findOneBy({ id: job.data.user.id });
	if (user == null) {
		done();
		return;
	}

	const file = await DriveFiles.findOneBy({
		id: job.data.fileId,
	});
	if (file == null) {
		done();
		return;
	}

	const csv = await downloadTextFile(file.url);

	let linenum = 0;

	for (const line of csv.trim().split("\n")) {
		linenum++;

		try {
			const acct = line.split(",")[0].trim();
			const { username, host } = stringToAcct(acct);

			let target = isSelfHost(host!)
				? await Users.findOneBy({
						host: IsNull(),
						usernameLower: username.toLowerCase(),
					})
				: await Users.findOneBy({
						host: toPuny(host!),
						usernameLower: username.toLowerCase(),
					});

			if (host == null && target == null) continue;

			if (target == null) {
				target = await resolveUser(username, host);
			}

			if (target == null) {
				throw new Error(`cannot resolve user: @${username}@${host}`);
			}

			// skip myself
			if (target.id === job.data.user.id) continue;

			logger.debug(`Mute[${linenum}] ${target.id} ...`);

			await mute(user, target);
		} catch (e) {
			logger.warn(`Error in line ${linenum}`);
			logger.info(inspect(e));
		}
	}

	logger.info("Imported");
	done();
}

async function mute(user: User, target: User) {
	const now = new Date();

	await Mutings.insert({
		id: genIdAt(now),
		createdAt: now,
		muterId: user.id,
		muteeId: target.id,
	});
}
