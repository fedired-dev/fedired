import { Event, publishToMainStream, verifyPassword } from "backend-rs";
import define from "@/server/api/define.js";
import { UserProfiles, UserSecurityKeys, Users } from "@/models/index.js";

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {
		password: { type: "string" },
		credentialId: { type: "string" },
	},
	required: ["password", "credentialId"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	// Compare passwords
	const same = verifyPassword(ps.password, profile.password!);

	if (!same) {
		throw new Error("incorrect password");
	}

	// Make sure we only delete the user's own creds
	await UserSecurityKeys.delete({
		userId: user.id,
		id: ps.credentialId,
	});

	// 使われているキーがなくなったらパスワードレスログインをやめる
	const keyCount = await UserSecurityKeys.count({
		where: {
			userId: user.id,
		},
		select: {
			id: true,
			name: true,
			lastUsed: true,
		},
	});

	if (keyCount === 0) {
		await UserProfiles.update(user.id, {
			usePasswordLessLogin: false,
			securityKeysAvailable: false,
		});
	}

	// Publish meUpdated event
	publishToMainStream(
		user.id,
		Event.Me,
		await Users.pack(user.id, user, {
			detail: true,
			includeSecrets: true,
		}),
	);

	return {};
});
