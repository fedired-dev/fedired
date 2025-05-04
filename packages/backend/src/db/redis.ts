import Redis from "ioredis";
import { config } from "@/config.js";

export function createConnection() {
	let source = config.redis;
	if (config.cacheServer) {
		source = config.cacheServer;
	}
	return new Redis({
		port: source.port,
		host: source.host,
		family: source.family ?? 0,
		password: source.pass,
		username: source.user ?? "default",
		keyPrefix: `${config.redisKeyPrefix}:`,
		db: source.db || 0,
		tls: source.tls,
	});
}

export const subscriber = createConnection();
subscriber.subscribe(config.redis.prefix ?? config.host);
export const redisClient = createConnection();
