import { renderActivity } from "@/remote/activitypub/renderer/index.js";
import { IdentifiableError } from "@/misc/identifiable-error.js";
import type { User } from "@/models/entities/user.js";
import type { Note } from "@/models/entities/note.js";
import { Notes, UserNotePinings, Users } from "@/models/index.js";
import type { UserNotePining } from "@/models/entities/user-note-pining.js";
import { genIdAt, renderAdd, renderRemove } from "backend-rs";
import { deliverToFollowers } from "@/remote/activitypub/deliver-manager.js";
import { deliverToRelays } from "@/services/relay.js";

/**
 * 指定した投稿をピン留めします
 * @param user
 * @param noteId
 */
export async function addPinned(
	user: { id: User["id"]; host: User["host"] },
	noteId: Note["id"],
) {
	// Fetch pinee
	const note = await Notes.findOneBy({
		id: noteId,
		userId: user.id,
	});

	if (note == null) {
		throw new IdentifiableError(
			"70c4e51f-5bea-449c-a030-53bee3cce202",
			"No such note.",
		);
	}

	const pinings = await UserNotePinings.findBy({ userId: user.id });

	if (pinings.length >= 15) {
		throw new IdentifiableError(
			"15a018eb-58e5-4da1-93be-330fcc5e4e1a",
			"You cannot pin notes any more.",
		);
	}

	if (pinings.some((pining) => pining.noteId === note.id)) {
		throw new IdentifiableError(
			"23f0cf4e-59a3-4276-a91d-61a5891c1514",
			"That note has already been pinned.",
		);
	}

	const now = new Date();

	await UserNotePinings.insert({
		id: genIdAt(now),
		createdAt: now,
		userId: user.id,
		noteId: note.id,
	} as UserNotePining);

	// Deliver to remote followers
	if (
		Users.isLocalUser(user) &&
		!note.localOnly &&
		["public", "home"].includes(note.visibility)
	) {
		deliverPinnedChange(user.id, note.id, true);
	}
}

/**
 * 指定した投稿のピン留めを解除します
 * @param user
 * @param noteId
 */
export async function removePinned(
	user: { id: User["id"]; host: User["host"] },
	noteId: Note["id"],
) {
	// Fetch unpinee
	const note = await Notes.findOneBy({
		id: noteId,
		userId: user.id,
	});

	if (note == null) {
		throw new IdentifiableError(
			"b302d4cf-c050-400a-bbb3-be208681f40c",
			"No such note.",
		);
	}

	UserNotePinings.delete({
		userId: user.id,
		noteId: note.id,
	});

	// Deliver to remote followers
	if (
		Users.isLocalUser(user) &&
		!note.localOnly &&
		["public", "home"].includes(note.visibility)
	) {
		deliverPinnedChange(user.id, noteId, false);
	}
}

export async function deliverPinnedChange(
	userId: User["id"],
	noteId: Note["id"],
	isAddition: boolean,
) {
	const user = await Users.findOneBy({ id: userId });
	if (user == null) throw new Error("user not found");

	if (!Users.isLocalUser(user)) return;

	const content = renderActivity(
		isAddition ? renderAdd(user.id, noteId) : renderRemove(user.id, noteId),
	);

	deliverToFollowers(user, content);
	deliverToRelays(user, content);
}
