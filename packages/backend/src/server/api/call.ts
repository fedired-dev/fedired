import { performance } from "perf_hooks";
import type Koa from "koa";
import type { CacheableLocalUser } from "@/models/entities/user.js";
import type { AccessToken } from "@/models/entities/access-token.js";
import { v4 as uuid } from "uuid";
import { getIpHash } from "@/misc/get-ip-hash.js";
import { limiter } from "./limiter.js";
import type { IEndpointMeta } from "./endpoints.js";
import endpoints from "./endpoints.js";
import compatibility from "./compatibility.js";
import { ApiError } from "./error.js";
import { apiLogger } from "./logger.js";
import { fetchMeta } from "backend-rs";

const accessDenied = {
	message: "Access denied.",
	code: "ACCESS_DENIED",
	id: "56f35758-7dd5-468b-8439-5d6fb8ec9b8e",
};

export default async (
	endpoint: string,
	user: CacheableLocalUser | null | undefined,
	token: AccessToken | null | undefined,
	data: any,
	ctx?: Koa.Context,
) => {
	const isSecure = user != null && token == null;
	const isModerator = user != null && (user.isModerator || user.isAdmin);

	const ep =
		endpoints.find((e) => e.name === endpoint) ||
		compatibility.find((e) => e.name === endpoint);

	if (ep == null) {
		throw new ApiError({
			message: "No such endpoint.",
			code: "NO_SUCH_ENDPOINT",
			id: "f8080b67-5f9c-4eb7-8c18-7f1eeae8f709",
			httpStatusCode: 404,
		});
	}

	if (ep.meta.secure && !isSecure) {
		throw new ApiError(accessDenied);
	}

	if (ep.meta.limit) {
		// koa will automatically load the `X-Forwarded-For` header if `proxy: true` is configured in the app.
		let limitActor: string;
		let userType: 'authenticated' | 'moderator' | 'admin' | 'anonymous' = 'anonymous';
		
		if (user) {
			limitActor = user.id;
			if (user.isAdmin) {
				userType = 'admin';
			} else if (user.isModerator) {
				userType = 'moderator';
			} else {
				userType = 'authenticated';
			}
		} else {
			limitActor = getIpHash(ctx!.ip);
			userType = 'anonymous';
		}

		const limit = Object.assign({}, ep.meta.limit);

		if (!limit.key) {
			limit.key = ep.name;
		}

		// Enhanced rate limit with user type differentiation
		await limiter(
			limit as IEndpointMeta["limit"] & { key: NonNullable<string> },
			limitActor,
			userType,
		).catch((e) => {
			const remainingTime = e.remainingTime
				? `Please try again in ${e.remainingTime}.`
				: "Please try again later.";
			throw new ApiError({
				message: `Rate limit exceeded. ${remainingTime}`,
				code: "RATE_LIMIT_EXCEEDED",
				id: "d5826d14-3982-4d2e-8011-b9e9f02499ef",
				httpStatusCode: 429,
			});
		});
	}

	if (ep.meta.requireCredential && user == null) {
		throw new ApiError({
			message: "Credential required.",
			code: "CREDENTIAL_REQUIRED",
			id: "1384574d-a912-4b81-8601-c7b1c4085df1",
			httpStatusCode: 401,
		});
	}

	if (ep.meta.requireCredential && user!.isSuspended) {
		throw new ApiError({
			message: "Your account has been suspended.",
			code: "YOUR_ACCOUNT_SUSPENDED",
			id: "a8c724b3-6e9c-4b46-b1a8-bc3ed6258370",
			httpStatusCode: 403,
		});
	}

	if (ep.meta.requireAdmin && !user!.isAdmin) {
		throw new ApiError(accessDenied, { reason: "You are not an admin." });
	}

	if (ep.meta.requireModerator && !isModerator) {
		throw new ApiError(accessDenied, { reason: "You are not a moderator." });
	}

	if (
		token &&
		ep.meta.kind &&
		!token.permission.some((p) => p === ep.meta.kind)
	) {
		throw new ApiError({
			message:
				"Your app does not have the necessary permissions to use this endpoint.",
			code: "PERMISSION_DENIED",
			id: "1370e5b7-d4eb-4566-bb1d-7748ee6a1838",
		});
	}

	// private mode
	const instanceMeta = await fetchMeta();
	if (
		instanceMeta.privateMode &&
		ep.meta.requireCredentialPrivateMode &&
		user == null
	) {
		throw new ApiError({
			message: "Credential required.",
			code: "CREDENTIAL_REQUIRED",
			id: "1384574d-a912-4b81-8601-c7b1c4085df1",
			httpStatusCode: 401,
		});
	}

	if (token && ep.meta.requireAdmin) {
		throw new ApiError(accessDenied, {
			reason: "Apps cannot use admin privileges.",
		});
	}

	if (token && ep.meta.requireModerator) {
		throw new ApiError(accessDenied, {
			reason: "Apps cannot use moderator privileges.",
		});
	}

	// Cast non JSON input
	if ((ep.meta.requireFile || ctx?.method === "GET") && ep.params.properties) {
		for (const k of Object.keys(ep.params.properties)) {
			const param = ep.params.properties![k];
			if (
				["boolean", "number", "integer"].includes(param.type ?? "") &&
				typeof data[k] === "string"
			) {
				try {
					data[k] = JSON.parse(data[k]);
				} catch (e) {
					throw new ApiError(
						{
							message: "Invalid param.",
							code: "INVALID_PARAM",
							id: "0b5f1631-7c1a-41a6-b399-cce335f34d85",
						},
						{
							param: k,
							reason: `cannot cast to ${param.type}`,
						},
					);
				}
			}
		}
	}

	// API invoking
	const before = performance.now();
	return await ep
		.exec(data, user, token, ctx?.file, ctx?.ip, ctx?.headers)
		.catch((e: Error) => {
			if (e instanceof ApiError) {
				throw e;
			} else {
				const errorId = uuid();
				apiLogger.error(
					`Internal error occurred in ${ep.name}: ${e.message} (Event ID: ${errorId})`,
					{
						ep: ep.name,
						ps: data,
						e: {
							message: e.message,
							code: e.name,
							stack: e.stack,
						},
					},
				);
				throw new ApiError(null, {
					e: {
						message: `Internal error (Event ID: ${errorId})`,
						code: e.name,
					},
				});
			}
		})
		.finally(() => {
			const after = performance.now();
			const time = after - before;
			if (time > 2000) {
				apiLogger.warn(`SLOW API CALL DETECTED: ${ep.name} (${time}ms)`);
			}
		});
};
