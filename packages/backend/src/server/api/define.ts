import * as fs from "node:fs";
import Ajv from "ajv";
import type { CacheableLocalUser } from "@/models/entities/user.js";
import type { Schema, SchemaType } from "@/misc/schema.js";
import type { AccessToken } from "@/models/entities/access-token.js";
import type { IEndpointMeta } from "./endpoints.js";
import { ApiError } from "./error.js";

export type Response = Record<string, any> | void;

// TODO: paramsの型をT['params']のスキーマ定義から推論する
type executor<T extends IEndpointMeta, Ps extends Schema> = (
	params: SchemaType<Ps>,
	user: T["requireCredential"] extends true
		? CacheableLocalUser
		: CacheableLocalUser | null,
	token: AccessToken | null,
	file?: any,
	cleanup?: () => any,
	ip?: string | null,
	headers?: Record<string, string> | null,
) => Promise<
	T["res"] extends undefined ? Response : SchemaType<NonNullable<T["res"]>>
>;

const ajv = new Ajv({
	useDefaults: true,
	allErrors: true, // Show all validation errors
	verbose: true, // More detailed error messages
});

ajv.addFormat("misskey:id", /^[a-zA-Z0-9]+$/);

// Enhanced parameter validation with better error handling
export default function <T extends IEndpointMeta, Ps extends Schema>(
	meta: T,
	paramDef: Ps,
	cb: executor<T, Ps>,
): (
	params: any,
	user: T["requireCredential"] extends true
		? CacheableLocalUser
		: CacheableLocalUser | null,
	token: AccessToken | null,
	file?: any,
	ip?: string | null,
	headers?: Record<string, string> | null,
) => Promise<any> {
	const validate = ajv.compile(paramDef);

	return (
		params: any,
		user: T["requireCredential"] extends true
			? CacheableLocalUser
			: CacheableLocalUser | null,
		token: AccessToken | null,
		file?: any,
		ip?: string | null,
		headers?: Record<string, string> | null,
	) => {
		let cleanup: undefined | (() => void) = undefined;

		if (meta.requireFile) {
			cleanup = () => {
				fs.unlink(file.path, () => {});
			};

			if (file == null)
				return Promise.reject(
					new ApiError({
						message: "File required.",
						code: "FILE_REQUIRED",
						id: "4267801e-70d1-416a-b011-4ee502885d8b",
					}),
				);
		}

		// Enhanced parameter validation with better error messages
		const valid = validate(params);
		if (!valid) {
			if (file) cleanup!();

			const errors = validate.errors!;
			
			// Create more detailed error message
			const errorDetails = errors.map(err => ({
				field: err.instancePath || err.schemaPath,
				message: err.message,
				value: err.data
			}));

			const err = new ApiError(
				{
					message: `Invalid parameters: ${errors.length} validation error(s)`,
					code: "INVALID_PARAM",
					id: "3d81ceae-475f-4600-b2a8-2bc116157532",
				},
				{
					param: errors[0].schemaPath,
					reason: errors[0].message,
					details: errorDetails,
				},
			);
			return Promise.reject(err);
		}

		return cb(
			params as SchemaType<Ps>,
			user,
			token,
			file,
			cleanup,
			ip,
			headers,
		);
	};
}
