import type Bull from "bull";
import type { DbJobData } from "@/queue/types.js";
import { deleteDriveFiles } from "./delete-drive-files.js";
import { exportCustomEmojis } from "./export-custom-emojis.js";
import { exportNotes } from "./export-notes.js";
import { exportFollowers } from "./export-followers.js";
import { exportFollowing } from "./export-following.js";
import { exportMute } from "./export-mute.js";
import { exportBlocking } from "./export-blocking.js";
import { exportUserLists } from "./export-user-lists.js";
import { importFollowing } from "./import-following.js";
import { importUserLists } from "./import-user-lists.js";
import { deleteAccount } from "./delete-account.js";
import { importMuting } from "./import-muting.js";
import { importPosts } from "./import-posts.js";
import { importMastoPost } from "./import-masto-post.js";
import { importCkPost } from "./import-fedired-post.js";
import { importBlocking } from "./import-blocking.js";
import { importCustomEmojis } from "./import-custom-emojis.js";
import { scheduledNote } from "./scheduled-note.js";

const jobs = {
	deleteDriveFiles,
	exportCustomEmojis,
	exportNotes,
	exportFollowers,
	exportFollowing,
	exportMute,
	exportBlocking,
	exportUserLists,
	importFollowing,
	importMuting,
	importBlocking,
	importUserLists,
	importPosts,
	importMastoPost,
	importCkPost,
	importCustomEmojis,
	deleteAccount,
	scheduledNote,
} as Record<
	string,
	| Bull.ProcessCallbackFunction<DbJobData>
	| Bull.ProcessPromiseFunction<DbJobData>
>;

export default function (dbQueue: Bull.Queue<DbJobData>) {
	for (const [k, v] of Object.entries(jobs)) {
		dbQueue.process(k, v);
	}
}
