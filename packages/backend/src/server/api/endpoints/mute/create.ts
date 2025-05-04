import define from "@/server/api/define.js";
import { ApiError } from "@/server/api/error.js";
import { getUser } from "@/server/api/common/getters.js";
import { genIdAt, publishToUserStream, UserEvent } from "backend-rs";
import { Mutings, NoteWatchings } from "@/models/index.js";
import type { Muting } from "@/models/entities/muting.js";

export const meta = {
	tags: ["account"],

	requireCredential: true,

	kind: "write:mutes",

	errors: {
		noSuchUser: {
			message: "No such user.",
			code: "NO_SUCH_USER",
			id: "6fef56f3-e765-4957-88e5-c6f65329b8a5",
		},

		muteeIsYourself: {
			message: "Mutee is yourself.",
			code: "MUTEE_IS_YOURSELF",
			id: "a4619cb2-5f23-484b-9301-94c903074e10",
		},

		alreadyMuting: {
			message: "You are already muting that user.",
			code: "ALREADY_MUTING",
			id: "7e7359cb-160c-4956-b08f-4d1c653cd007",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		userId: { type: "string", format: "misskey:id" },
		expiresAt: {
			type: "integer",
			nullable: true,
			description:
				"A Unix Epoch timestamp that must lie in the future. `null` means an indefinite mute.",
		},
	},
	required: ["userId"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const muter = user;

	// 自分自身
	if (user.id === ps.userId) {
		throw new ApiError(meta.errors.muteeIsYourself);
	}

	// Get mutee
	const mutee = await getUser(ps.userId).catch((e) => {
		if (e.id === "15348ddd-432d-49c2-8a5a-8069753becff")
			throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	// Check if already muting
	const exists = await Mutings.existsBy({
		muterId: muter.id,
		muteeId: mutee.id,
	});

	if (exists) {
		throw new ApiError(meta.errors.alreadyMuting);
	}

	if (ps.expiresAt && ps.expiresAt <= Date.now()) {
		return;
	}

	const now = new Date();

	// Create mute
	await Mutings.insert({
		id: genIdAt(now),
		createdAt: now,
		expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : null,
		muterId: muter.id,
		muteeId: mutee.id,
	} as Muting);

	await publishToUserStream(user.id, UserEvent.Mute, mutee);

	NoteWatchings.delete({
		userId: muter.id,
		noteUserId: mutee.id,
	});
});
