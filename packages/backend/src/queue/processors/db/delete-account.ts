import type Bull from "bull";
import { queueLogger } from "../../logger.js";
import { DriveFiles, Notes, UserProfiles, Users } from "@/models/index.js";
import type { DbUserDeleteJobData } from "@/queue/types.js";
import type { Note } from "@/models/entities/note.js";
import type { DriveFile } from "@/models/entities/drive-file.js";
import { MoreThan } from "typeorm";
import { deleteFileSync } from "@/services/drive/delete-file.js";
import { sendEmail } from "@/services/send-email.js";

const logger = queueLogger.createSubLogger("delete-account");

export async function deleteAccount(
	job: Bull.Job<DbUserDeleteJobData>,
): Promise<string | void> {
	logger.info(`Deleting account ${job.data.user.id} ...`);

	const user = await Users.findOneBy({ id: job.data.user.id });
	if (!user) return;

	{
		// Delete notes
		let cursor: Note["id"] | null = null;

		while (true) {
			const notes = (await Notes.find({
				where: {
					userId: user.id,
					...(cursor ? { id: MoreThan(cursor) } : {}),
				},
				take: 10,
				order: {
					id: 1,
				},
			})) as Note[];

			if (notes.length === 0) {
				break;
			}

			cursor = notes[notes.length - 1].id;

			await Notes.delete(notes.map((note) => note.id));
		}

		logger.info(`All posts of user ${job.data.user.id} were deleted`);
	}

	{
		// Delete files
		let cursor: DriveFile["id"] | null = null;

		while (true) {
			const files = (await DriveFiles.find({
				where: {
					userId: user.id,
					...(cursor ? { id: MoreThan(cursor) } : {}),
				},
				take: 10,
				order: {
					id: 1,
				},
			})) as DriveFile[];

			if (files.length === 0) {
				break;
			}

			cursor = files[files.length - 1].id;

			for (const file of files) {
				await deleteFileSync(file);
			}
		}

		logger.info(`All files of user ${job.data.user.id} were deleted`);
	}

	{
		// Send email notification
		const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
		if (profile.email && profile.emailVerified) {
			sendEmail(
				profile.email,
				"Account deleted",
				"Your account has been deleted.",
				"Your account has been deleted.",
			);
		}
	}

	// soft指定されている場合は物理削除しない
	if (job.data.soft) {
		// nop
	} else {
		await Users.delete(job.data.user.id);
	}

	return "Account deleted";
}
