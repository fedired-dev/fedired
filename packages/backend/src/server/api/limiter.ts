import Limiter from "ratelimiter";
import Logger from "@/services/logger.js";
import { redisClient } from "@/db/redis.js";
import type { IEndpointMeta } from "./endpoints.js";
import { formatMilliseconds } from "backend-rs";

const logger = new Logger("limiter");

// Enhanced rate limiting with user type differentiation
export const limiter = (
	limitation: IEndpointMeta["limit"] & { key: NonNullable<string> },
	actor: string,
	userType: 'authenticated' | 'moderator' | 'admin' | 'anonymous' = 'anonymous',
) =>
	new Promise<void>((ok, reject) => {
		if (process.env.NODE_ENV === "test") ok();

		// Apply rate limit multipliers based on user type
		const multiplier = getRateLimitMultiplier(userType);
		const adjustedLimitation = adjustLimits(limitation, multiplier);

		const hasShortTermLimit = typeof adjustedLimitation.minInterval === "number";
		const hasLongTermLimit =
			typeof adjustedLimitation.duration === "number" &&
			typeof adjustedLimitation.max === "number";

		if (hasShortTermLimit) {
			min();
		} else if (hasLongTermLimit) {
			max();
		} else {
			ok();
		}

		// Short-term limit
		function min(): void {
			const minIntervalLimiter = new Limiter({
				id: `${actor}:${adjustedLimitation.key}:min`,
				duration: adjustedLimitation.minInterval,
				max: 1,
				db: redisClient,
			});

			minIntervalLimiter.get((err, info) => {
				if (err) {
					logger.error(`Rate limiter error: ${err}`);
					return reject("ERR");
				}

				logger.debug(
					`${actor} (${userType}) ${adjustedLimitation.key} min remaining: ${info.remaining}`,
				);

				if (info.remaining === 0) {
					reject("BRIEF_REQUEST_INTERVAL");
				} else {
					if (hasLongTermLimit) {
						max();
					} else {
						ok();
					}
				}
			});
		}

		// Long term limit
		function max(): void {
			const limiter = new Limiter({
				id: `${actor}:${adjustedLimitation.key}`,
				duration: adjustedLimitation.duration,
				max: adjustedLimitation.max,
				db: redisClient,
			});

			limiter.get((err, info) => {
				if (err) {
					logger.error(`Rate limiter error: ${err}`);
					return reject("ERR");
				}

				logger.debug(
					`${actor} (${userType}) ${adjustedLimitation.key} max remaining: ${info.remaining}/${adjustedLimitation.max}`,
				);

				if (info.remaining === 0) {
					reject({
						message: "RATE_LIMIT_EXCEEDED",
						remainingTime: formatMilliseconds(info.resetMs - Date.now()),
					});
				} else {
					ok();
				}
			});
		}
	});

// Get rate limit multiplier based on user type
function getRateLimitMultiplier(userType: string): number {
	switch (userType) {
		case 'admin':
			return 5.0; // 5x more requests for admins
		case 'moderator':
			return 3.0; // 3x more requests for moderators
		case 'authenticated':
			return 2.0; // 2x more requests for authenticated users
		case 'anonymous':
		default:
			return 1.0; // Base rate for anonymous users
	}
}

// Adjust limits based on user type
function adjustLimits(limitation: any, multiplier: number) {
	const adjusted = { ...limitation };
	
	if (adjusted.max) {
		adjusted.max = Math.floor(adjusted.max * multiplier);
	}
	
	if (adjusted.minInterval) {
		adjusted.minInterval = Math.floor(adjusted.minInterval / multiplier);
	}
	
	return adjusted;
}
