import Resolver from "../../resolver.js";
import type { CacheableRemoteUser } from "@/models/entities/user.js";
import announceNote from "./note.js";
import type { IAnnounce } from "../../type.js";
import { getApId } from "../../type.js";
import { apLogger } from "../../logger.js";

export default async (
	actor: CacheableRemoteUser,
	activity: IAnnounce,
): Promise<void> => {
	const uri = getApId(activity);

	apLogger.info(`Announce: ${uri}`);

	const resolver = new Resolver();

	const targetUri = getApId(activity.object);

	announceNote(resolver, actor, activity, targetUri);
};
