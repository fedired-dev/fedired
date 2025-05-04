import { URL } from "node:url";
import httpSignature, { type IParsedSignature } from "@peertube/http-signature";
import { config } from "@/config.js";
import {
	fetchMeta,
	isAllowedServer,
	isBlockedServer,
	toPuny,
} from "backend-rs";
import DbResolver from "@/remote/activitypub/db-resolver.js";
import { getApId } from "@/remote/activitypub/type.js";
import type { IncomingMessage } from "node:http";
import type { CacheableRemoteUser } from "@/models/entities/user.js";
import type { UserPublickey } from "@/models/entities/user-publickey.js";
import { verify } from "node:crypto";

export async function hasSignature(req: IncomingMessage): Promise<string> {
	const instanceMeta = await fetchMeta();
	const required = instanceMeta.secureMode || instanceMeta.privateMode;

	try {
		httpSignature.parseRequest(req, { headers: [] });
	} catch (e) {
		if (e instanceof Error && e.name === "MissingHeaderError") {
			return required ? "missing" : "optional";
		}
		return "invalid";
	}
	return required ? "supplied" : "unneeded";
}

export async function checkFetch(req: IncomingMessage): Promise<number> {
	const instanceMeta = await fetchMeta();
	if (instanceMeta.secureMode || instanceMeta.privateMode) {
		if (req.headers.host !== config.host) return 400;

		let signature;

		try {
			signature = httpSignature.parseRequest(req, {
				headers: ["(request-target)", "host", "date"],
			});
		} catch (e) {
			return 401;
		}

		const keyId = new URL(signature.keyId);
		const host = toPuny(keyId.hostname);

		if (await isBlockedServer(host)) {
			return 403;
		}

		if (host !== config.host && !isAllowedServer(host)) {
			return 403;
		}

		const keyIdLower = signature.keyId.toLowerCase();
		if (keyIdLower.startsWith("acct:")) {
			// Old keyId is no longer supported.
			return 401;
		}

		const dbResolver = new DbResolver();

		// HTTP-Signature keyIdを元にDBから取得
		let authUser = await dbResolver.getAuthUserFromKeyId(signature.keyId);

		// keyIdでわからなければ、resolveしてみる
		if (authUser == null) {
			try {
				keyId.hash = "";
				authUser = await dbResolver.getAuthUserFromApId(
					getApId(keyId.toString()),
				);
			} catch (e) {
				// できなければ駄目
				return 403;
			}
		}

		// publicKey がなくても終了
		if (authUser?.key == null) {
			return 403;
		}

		// もう一回チェック
		if (authUser.user.host !== host) {
			return 403;
		}

		// HTTP-Signatureの検証
		let httpSignatureValidated = httpSignature.verifySignature(
			signature,
			authUser.key.keyPem,
		);

		// If signature validation failed, try refetching the actor
		if (!httpSignatureValidated) {
			authUser.key = await dbResolver.refetchPublicKeyForApId(authUser.user);

			if (authUser.key == null) {
				return 403;
			}

			httpSignatureValidated = httpSignature.verifySignature(
				signature,
				authUser.key.keyPem,
			);
		}

		if (!httpSignatureValidated) {
			return 403;
		}

		return verifySignature(signature, authUser.key) ? 200 : 401;
	}
	return 200;
}

export async function getSignatureUser(req: IncomingMessage): Promise<{
	user: CacheableRemoteUser;
	key: UserPublickey | null;
} | null> {
	const signature = httpSignature.parseRequest(req, { headers: [] });
	const keyId = new URL(signature.keyId);
	const dbResolver = new DbResolver();

	// Retrieve from DB by HTTP-Signature keyId
	const authUser = await dbResolver.getAuthUserFromKeyId(signature.keyId);
	if (authUser) {
		return authUser;
	}

	// Resolve if failed to retrieve by keyId
	keyId.hash = "";
	return await dbResolver.getAuthUserFromApId(getApId(keyId.toString()));
}

export function verifySignature(
	sig: IParsedSignature,
	key: UserPublickey,
): boolean {
	if (!["hs2019", "rsa-sha256"].includes(sig.algorithm.toLowerCase()))
		return false;
	try {
		return verify(
			"rsa-sha256",
			Buffer.from(sig.signingString, "utf8"),
			key.keyPem,
			Buffer.from(sig.params.signature, "base64"),
		);
	} catch {
		// Algo not supported
		return false;
	}
}
