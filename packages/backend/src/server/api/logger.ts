import Logger from "@/services/logger.js";

export const apiLogger = new Logger("api");

// Enhanced API logging with performance tracking
export class ApiLogger {
	private logger: Logger;
	private performanceThreshold: number;

	constructor(name: string, performanceThreshold = 1000) {
		this.logger = new Logger(`api:${name}`);
		this.performanceThreshold = performanceThreshold;
	}

	// Log API request with performance tracking
	logRequest(endpoint: string, method: string, duration: number, statusCode: number, user?: string) {
		const level = duration > this.performanceThreshold ? 'warn' : 'debug';
		const userInfo = user ? ` (user: ${user})` : ' (anonymous)';
		
		this.logger[level](
			`${method} ${endpoint} - ${statusCode} - ${duration}ms${userInfo}`
		);

		// Log slow requests with more details
		if (duration > this.performanceThreshold) {
			this.logger.warn(`SLOW API REQUEST: ${endpoint} took ${duration}ms`);
		}
	}

	// Log API errors with context
	logError(endpoint: string, error: any, user?: string) {
		const userInfo = user ? ` (user: ${user})` : ' (anonymous)';
		
		this.logger.error(
			`API Error in ${endpoint}${userInfo}: ${error.message}`,
			{
				endpoint,
				error: {
					message: error.message,
					code: error.code,
					stack: error.stack,
				},
				user,
			}
		);
	}

	// Log rate limit events
	logRateLimit(endpoint: string, user: string, remaining: number, resetTime: number) {
		this.logger.info(
			`Rate limit: ${endpoint} - ${user} - ${remaining} remaining - resets in ${resetTime}ms`
		);
	}

	// Log cache events
	logCache(endpoint: string, hit: boolean, ttl?: number) {
		const action = hit ? 'HIT' : 'MISS';
		const ttlInfo = ttl ? ` (TTL: ${ttl}s)` : '';
		
		this.logger.debug(`Cache ${action}: ${endpoint}${ttlInfo}`);
	}
}

// Create specialized loggers for different API areas
export const authLogger = new ApiLogger('auth');
export const rateLimitLogger = new ApiLogger('rate-limit');
export const cacheLogger = new ApiLogger('cache');
