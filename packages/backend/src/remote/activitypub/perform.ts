import type { IObject } from "./type.js";
import type { CacheableRemoteUser } from "@/models/entities/user.js";
import { performActivity } from "./kernel/index.js";
import { updatePerson } from "./models/person.js";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 segundo

async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function updatePersonWithRetry(uri: string, maxRetries: number = MAX_RETRIES): Promise<void> {
	let retries = 0;
	let lastError: Error | null = null;

	while (retries < maxRetries) {
		try {
			await updatePerson(uri);
			return;
		} catch (error) {
			lastError = error as Error;
			retries++;
			
			if (retries === maxRetries) {
				console.error(`Failed to update person after ${maxRetries} retries:`, lastError);
				throw lastError;
			}

			const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries - 1);
			console.warn(`Retry ${retries}/${maxRetries} after ${delay}ms:`, error);
			await sleep(delay);
		}
	}
}

export default async (
	actor: CacheableRemoteUser,
	activity: IObject,
): Promise<void> => {
	try {
		await performActivity(actor, activity);

		// Update the remote user information if it is out of date
		if (actor.uri) {
			const shouldUpdate = actor.lastFetchedAt == null || 
				Date.now() - actor.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24;

			if (shouldUpdate) {
				// Use setImmediate to not block the current operation
				setImmediate(() => {
					updatePersonWithRetry(actor.uri!).catch(error => {
						console.error('Failed to update person:', error);
					});
				});
			}
		}
	} catch (error) {
		console.error('Error performing activity:', error);
		throw error;
	}
};
