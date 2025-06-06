import { decode } from "cbor-x";
import define from "@/server/api/define.js";
import {
	UserProfiles,
	UserSecurityKeys,
	AttestationChallenges,
	Users,
} from "@/models/index.js";
import { config } from "@/config.js";
import { procedures, hash } from "@/server/api/2fa.js";
import { Event, publishToMainStream, verifyPassword } from "backend-rs";

const rpIdHashReal = hash(Buffer.from(config.hostname, "utf-8"));

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {
		clientDataJSON: { type: "string" },
		attestationObject: { type: "string" },
		password: { type: "string" },
		challengeId: { type: "string" },
		name: { type: "string", minLength: 1, maxLength: 30 },
	},
	required: [
		"clientDataJSON",
		"attestationObject",
		"password",
		"challengeId",
		"name",
	],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	// Compare passwords
	const same = verifyPassword(ps.password, profile.password!);

	if (!same) {
		throw new Error("incorrect password");
	}

	const clientData = JSON.parse(ps.clientDataJSON);

	if (clientData.type !== "webauthn.create") {
		throw new Error("not a creation attestation");
	}
	if (clientData.origin !== `${config.scheme}://${config.host}`) {
		throw new Error("origin mismatch");
	}

	const clientDataJSONHash = hash(Buffer.from(ps.clientDataJSON, "utf-8"));

	const attestation = decode(Buffer.from(ps.attestationObject, "hex"));

	const rpIdHash = attestation.authData.slice(0, 32);
	if (!rpIdHashReal.equals(rpIdHash)) {
		throw new Error("rpIdHash mismatch");
	}

	const flags = attestation.authData[32];

	if (!(flags & 1)) {
		throw new Error("user not present");
	}

	const authData = Buffer.from(attestation.authData);
	const credentialIdLength = authData.readUInt16BE(53);
	const credentialId = authData.slice(55, 55 + credentialIdLength);
	const publicKeyData = authData.slice(55 + credentialIdLength);
	const publicKey: Map<number, any> = new Map(
		Object.entries(decode(publicKeyData)).map(([key, value]) => [
			Number(key),
			value,
		]),
	);

	if (publicKey.get(3) !== -7) {
		throw new Error("alg mismatch");
	}

	if (!(procedures as any)[attestation.fmt]) {
		throw new Error("unsupported fmt");
	}

	const verificationData = (procedures as any)[attestation.fmt].verify({
		attStmt: attestation.attStmt,
		authenticatorData: authData,
		clientDataHash: clientDataJSONHash,
		credentialId,
		publicKey,
		rpIdHash,
	});
	if (!verificationData.valid) throw new Error("signature invalid");

	const attestationChallenge = await AttestationChallenges.findOneBy({
		userId: user.id,
		id: ps.challengeId,
		registrationChallenge: true,
		challenge: hash(clientData.challenge).toString("hex"),
	});

	if (!attestationChallenge) {
		throw new Error("non-existent challenge");
	}

	await AttestationChallenges.delete({
		userId: user.id,
		id: ps.challengeId,
	});

	// Expired challenge (> 5min old)
	if (Date.now() - attestationChallenge.createdAt.getTime() >= 5 * 60 * 1000) {
		throw new Error("expired challenge");
	}

	const credentialIdString = credentialId.toString("hex");

	await UserSecurityKeys.insert({
		userId: user.id,
		id: credentialIdString,
		lastUsed: new Date(),
		name: ps.name,
		publicKey: verificationData.publicKey.toString("hex"),
	});

	// Publish meUpdated event
	publishToMainStream(
		user.id,
		Event.Me,
		await Users.pack(user.id, user, {
			detail: true,
			includeSecrets: true,
		}),
	);

	UserProfiles.update(user.id, { securityKeysAvailable: true });

	return {
		id: credentialIdString,
		name: ps.name,
	};
});
