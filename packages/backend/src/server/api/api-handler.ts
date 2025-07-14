import type Koa from "koa";

import type { User } from "@/models/entities/user.js";
import { UserIps } from "@/models/index.js";
import { fetchMeta } from "backend-rs";
import type { IEndpoint } from "./endpoints.js";
import authenticate, { AuthenticationError } from "./authenticate.js";
import call from "./call.js";
import { ApiError } from "./error.js";
import { createHash } from "node:crypto";

// Generate ETag for cache validation
function generateETag(content: string): string {
	const hash = createHash('md5').update(content).digest('hex');
	return `"${hash}"`;
}

const userIpHistories = new Map<User["id"], Set<string>>();

setInterval(
	() => {
		userIpHistories.clear();
	},
	1000 * 60 * 60,
);

export default (endpoint: IEndpoint, ctx: Koa.Context) =>
	new Promise<void>((res) => {
		const body = ctx.is("multipart/form-data")
			? (ctx.request as any).body
			: ctx.method === "GET"
				? ctx.query
				: ctx.request.body;

		const reply = (x?: any, y?: ApiError) => {
			if (x == null) {
				ctx.status = 204;
			} else if (typeof x === "number" && y) {
				ctx.status = x;
				ctx.body = {
					error: {
						message: y!.message,
						code: y!.code,
						id: y!.id,
						kind: y!.kind,
						...(y!.info && process.env.NODE_ENV !== "production"
							? { info: y!.info }
							: {}),
					},
				};
			} else {
				// 文字列を返す場合は、JSON.stringify通さないとJSONと認識されない
				ctx.body = typeof x === "string" ? JSON.stringify(x) : x;
			}
			res();
		};

		// Authentication
		// for GET requests, do not even pass on the body parameter as it is considered unsafe
		authenticate(
			ctx.headers.authorization,
			ctx.method === "GET" ? null : body["i"],
		)
			.then(([user, app]) => {
				// API invoking
				call(endpoint.name, user, app, body, ctx)
					.then((res: any) => {
						// Enhanced caching for public endpoints
						if (
							ctx.method === "GET" &&
							endpoint.meta.cacheSec &&
							!body["i"] &&
							!user
						) {
							// Set cache headers with better optimization
							ctx.set(
								"Cache-Control",
								`public, max-age=${endpoint.meta.cacheSec}, s-maxage=${endpoint.meta.cacheSec * 2}, stale-while-revalidate=${endpoint.meta.cacheSec * 3}`,
							);
							// Add ETag for better cache validation
							if (res && typeof res === 'object') {
								const etag = generateETag(JSON.stringify(res));
								ctx.set("ETag", etag);
							}
						} else if (ctx.method === "GET" && user) {
							// Private cache for authenticated users
							ctx.set("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
						}
						reply(res);
					})
					.catch((e: ApiError) => {
						reply(
							e.httpStatusCode
								? e.httpStatusCode
								: e.kind === "client"
									? 400
									: 500,
							e,
						);
					});

				// Log IP
				if (user) {
					fetchMeta().then((meta) => {
						if (!meta.enableIpLogging) return;
						const ip = ctx.ip;
						const ips = userIpHistories.get(user.id);
						if (ips == null || !ips.has(ip)) {
							if (ips == null) {
								userIpHistories.set(user.id, new Set([ip]));
							} else {
								ips.add(ip);
							}

							try {
								UserIps.createQueryBuilder()
									.insert()
									.values({
										createdAt: new Date(),
										userId: user.id,
										ip: ip,
									})
									.orIgnore(true)
									.execute();
							} catch {}
						}
					});
				}
			})
			.catch((e) => {
				if (e instanceof AuthenticationError) {
					ctx.response.status = 403;
					ctx.response.set("WWW-Authenticate", "Bearer");
					ctx.response.body = {
						message: `Authentication failed: ${e.message}`,
						code: "AUTHENTICATION_FAILED",
						id: "b0a7f5f8-dc2f-4171-b91f-de88ad238e14",
						kind: "client",
					};
					res();
				} else {
					reply(500, new ApiError());
				}
			});
	});
