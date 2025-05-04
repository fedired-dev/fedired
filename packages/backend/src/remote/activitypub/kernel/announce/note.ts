import type Resolver from "../../resolver.js";
import post from "@/services/note/create.js";
import type { CacheableRemoteUser } from "@/models/entities/user.js";
import type { IAnnounce } from "../../type.js";
import { getApId } from "../../type.js";
import { fetchNote, resolveNote } from "../../models/note.js";
import { apLogger } from "../../logger.js";
import { extractHost, isBlockedServer } from "backend-rs";
import { getApLock } from "@/misc/app-lock.js";
import { parseAudience } from "../../audience.js";
import { StatusError } from "@/misc/fetch.js";
import { Notes } from "@/models/index.js";
import { inspect } from "node:util";

/**
 * Handle announcement activities
 */
export default async function (
	resolver: Resolver,
	actor: CacheableRemoteUser,
	activity: IAnnounce,
	targetUri: string,
): Promise<void> {
	const uri = getApId(activity);

	if (actor.isSuspended) {
		return;
	}

	// Interrupt if you block the announcement destination
	if (await isBlockedServer(extractHost(uri))) return;

	const lock = await getApLock(uri);

	try {
		// Check if something with the same URI is already registered
		const exist = await fetchNote(uri);
		if (exist) {
			return;
		}

		// Resolve Announce target
		let renote;
		try {
			renote = await resolveNote(targetUri);
		} catch (e) {
			// Skip if target is 4xx
			if (e instanceof StatusError) {
				if (!e.isRetryable) {
					apLogger.info(
						`Ignored announce target ${targetUri} - ${e.statusCode}`,
					);
					return;
				}

				apLogger.warn(`Error in announce target ${targetUri}`);
				apLogger.debug(inspect(e));
			}
			throw e;
		}

		if (renote != null && !(await Notes.isVisibleForMe(renote, actor.id))) {
			console.log("skip: invalid actor for this activity");
			return;
		}
		apLogger.info(`Creating (re)note: ${uri}`);

		const activityAudience = await parseAudience(
			actor,
			activity.to,
			activity.cc,
		);

		await post(actor, {
			createdAt: activity.published ? new Date(activity.published) : null,
			renote,
			visibility: activityAudience.visibility,
			visibleUsers: activityAudience.visibleUsers,
			uri,
		});
	} finally {
		await lock.release();
	}
}
