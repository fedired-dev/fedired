import { redisClient } from "../db/redis.js";
import type { User } from "@/models/entities/user.js";
import type { Note } from "@/models/entities/note.js";
import type { UserList } from "@/models/entities/user-list.js";
import type { UserGroup } from "@/models/entities/user-group.js";
import config from "@/config/index.js";
import type { Antenna } from "@/models/entities/antenna.js";
import type { Channel } from "@/models/entities/channel.js";
import type {
	StreamChannels,
	AdminStreamTypes,
	AntennaStreamTypes,
	BroadcastTypes,
	ChannelStreamTypes,
	DriveStreamTypes,
	GroupMessagingStreamTypes,
	InternalStreamTypes,
	MainStreamTypes,
	MessagingIndexStreamTypes,
	MessagingStreamTypes,
	NoteStreamTypes,
	UserListStreamTypes,
	UserStreamTypes, NoteUpdatesStreamTypes,
} from "@/server/api/stream/types.js";

class Publisher {
	private publish = (
		channel: StreamChannels,
		type: string | null,
		value?: any,
	): void => {
		const message =
			type == null
				? value
				: value == null
				? { type: type, body: null }
				: { type: type, body: value };

		redisClient.publish(
			config.redis.prefix ?? config.host,
			JSON.stringify({
				channel: channel,
				message: message,
			}),
		);
	};

	public publishInternalEvent = <K extends keyof InternalStreamTypes>(
		type: K,
		value?: InternalStreamTypes[K],
	): void => {
		this.publish("internal", type, typeof value === "undefined" ? null : value);
	};

	public publishUserEvent = <K extends keyof UserStreamTypes>(
		userId: User["id"],
		type: K,
		value?: UserStreamTypes[K],
	): void => {
		this.publish(
			`user:${userId}`,
			type,
			typeof value === "undefined" ? null : value,
		);
	};

	public publishBroadcastStream = <K extends keyof BroadcastTypes>(
		type: K,
		value?: BroadcastTypes[K],
	): void => {
		this.publish(
			"broadcast",
			type,
			typeof value === "undefined" ? null : value,
		);
	};

	public publishMainStream = <K extends keyof MainStreamTypes>(
		userId: User["id"],
		type: K,
		value?: MainStreamTypes[K],
	): void => {
		this.publish(
			`mainStream:${userId}`,
			type,
			typeof value === "undefined" ? null : value,
		);
	};

	public publishDriveStream = <K extends keyof DriveStreamTypes>(
		userId: User["id"],
		type: K,
		value?: DriveStreamTypes[K],
	): void => {
		this.publish(
			`driveStream:${userId}`,
			type,
			typeof value === "undefined" ? null : value,
		);
	};

	public publishNoteStream = <K extends keyof NoteStreamTypes>(
		noteId: Note["id"],
		type: K,
		value?: NoteStreamTypes[K],
	): void => {
		const object = {
			id: noteId,
			body: value,
		};

		this.publish(`noteStream:${noteId}`, type, object);
	};

	public publishNoteUpdatesStream = <K extends keyof NoteUpdatesStreamTypes>(
		type: K,
		value: NoteUpdatesStreamTypes[K],
	): void => {
		this.publish('noteUpdatesStream', type, value);
	};

	public publishChannelStream = <K extends keyof ChannelStreamTypes>(
		channelId: Channel["id"],
		type: K,
		value?: ChannelStreamTypes[K],
	): void => {
		this.publish(
			`channelStream:${channelId}`,
			type,
			typeof value === "undefined" ? null : value,
		);
	};

	public publishUserListStream = <K extends keyof UserListStreamTypes>(
		listId: UserList["id"],
		type: K,
		value?: UserListStreamTypes[K],
	): void => {
		this.publish(
			`userListStream:${listId}`,
			type,
			typeof value === "undefined" ? null : value,
		);
	};

	public publishAntennaStream = <K extends keyof AntennaStreamTypes>(
		antennaId: Antenna["id"],
		type: K,
		value?: AntennaStreamTypes[K],
	): void => {
		this.publish(
			`antennaStream:${antennaId}`,
			type,
			typeof value === "undefined" ? null : value,
		);
	};

	public publishMessagingStream = <K extends keyof MessagingStreamTypes>(
		userId: User["id"],
		otherpartyId: User["id"],
		type: K,
		value?: MessagingStreamTypes[K],
	): void => {
		this.publish(
			`messagingStream:${userId}-${otherpartyId}`,
			type,
			typeof value === "undefined" ? null : value,
		);
	};

	public publishGroupMessagingStream = <
		K extends keyof GroupMessagingStreamTypes,
	>(
		groupId: UserGroup["id"],
		type: K,
		value?: GroupMessagingStreamTypes[K],
	): void => {
		this.publish(
			`messagingStream:${groupId}`,
			type,
			typeof value === "undefined" ? null : value,
		);
	};

	public publishMessagingIndexStream = <
		K extends keyof MessagingIndexStreamTypes,
	>(
		userId: User["id"],
		type: K,
		value?: MessagingIndexStreamTypes[K],
	): void => {
		this.publish(
			`messagingIndexStream:${userId}`,
			type,
			typeof value === "undefined" ? null : value,
		);
	};

	public publishNotesStream = (note: Note): void => {
		this.publish("notesStream", null, note);
	};

	public publishAdminStream = <K extends keyof AdminStreamTypes>(
		userId: User["id"],
		type: K,
		value?: AdminStreamTypes[K],
	): void => {
		this.publish(
			`adminStream:${userId}`,
			type,
			typeof value === "undefined" ? null : value,
		);
	};
}

const publisher = new Publisher();

export default publisher;

export const publishInternalEvent = publisher.publishInternalEvent;
export const publishUserEvent = publisher.publishUserEvent;
export const publishBroadcastStream = publisher.publishBroadcastStream;
export const publishMainStream = publisher.publishMainStream;
export const publishDriveStream = publisher.publishDriveStream;
export const publishNoteStream = publisher.publishNoteStream;
export const publishNotesStream = publisher.publishNotesStream;
export const publishNoteUpdatesStream = publisher.publishNoteUpdatesStream;
export const publishChannelStream = publisher.publishChannelStream;
export const publishUserListStream = publisher.publishUserListStream;
export const publishAntennaStream = publisher.publishAntennaStream;
export const publishMessagingStream = publisher.publishMessagingStream;
export const publishGroupMessagingStream =
	publisher.publishGroupMessagingStream;
export const publishMessagingIndexStream =
	publisher.publishMessagingIndexStream;
export const publishAdminStream = publisher.publishAdminStream;
