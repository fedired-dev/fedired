import Bull from "bull";
import { config } from "@/config.js";

export function initialize<T>(name: string, limitPerSec = -1) {
	return new Bull<T>(name, {
		redis: {
			port: config.redis.port,
			host: config.redis.host,
			family: config.redis.family == null ? 0 : config.redis.family,
			username: config.redis.user ?? "default",
			password: config.redis.pass,
			db: config.redis.db || 0,
			tls: config.redis.tls,
		},
		prefix: `${config.redisKeyPrefix}:queue`,
		limiter:
			limitPerSec > 0
				? {
						max: limitPerSec,
						duration: 1000,
					}
				: undefined,
		settings: {
			stalledInterval: 60,
			maxStalledCount: 2,
			backoffStrategies: {
				apBackoff,
			},
		},
	});
}

// ref. https://github.com/misskey-dev/misskey/pull/7635#issue-971097019
function apBackoff(attemptsMade: number, err: Error) {
	const baseDelay = 30 * 1000; // Reduced from 60s to 30s
	const maxBackoff = 4 * 60 * 60 * 1000; // Reduced from 8h to 4h
	let backoff = (2 ** attemptsMade - 1) * baseDelay;
	backoff = Math.min(backoff, maxBackoff);
	
	// Add jitter to prevent thundering herd
	backoff += Math.round(backoff * Math.random() * 0.3); // Increased jitter from 0.2 to 0.3
	
	// For network errors, use shorter delays
	if (err.message.includes('timeout') || err.message.includes('network')) {
		backoff = Math.min(backoff, 2 * 60 * 1000); // Max 2 minutes for network errors
	}
	
	return backoff;
}
