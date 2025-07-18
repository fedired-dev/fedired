import {
	Entity,
	Column,
	Index,
	OneToOne,
	JoinColumn,
	PrimaryColumn,
	type Relation,
} from "typeorm";
import { id } from "../id.js";
import { DriveFile } from "./drive-file.js";

export type EmojiModPerm = "unauthorized" | "add" | "mod" | "full";

@Entity()
@Index(["usernameLower", "host"], { unique: true })
export class User {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column("timestamp with time zone", {
		comment: "The created date of the User.",
	})
	public createdAt: Date;

	@Index()
	@Column("timestamp with time zone", {
		nullable: true,
		comment: "The updated date of the User.",
	})
	public updatedAt: Date | null;

	@Column("timestamp with time zone", {
		nullable: true,
	})
	public lastFetchedAt: Date | null;

	@Index()
	@Column("timestamp with time zone", {
		nullable: true,
	})
	public lastActiveDate: Date | null;

	@Column("boolean", {
		default: false,
	})
	public hideOnlineStatus: boolean;

	@Column("varchar", {
		length: 128,
		comment: "The username of the User.",
	})
	public username: string;

	@Index()
	@Column("varchar", {
		length: 128,
		comment: "The username (lowercased) of the User.",
	})
	public usernameLower: string;

	@Index() // USING pgroonga pgroonga_varchar_full_text_search_ops_v2
	@Column("varchar", {
		length: 128,
		nullable: true,
		comment: "The name of the User.",
	})
	public name: string | null;

	@Column("integer", {
		default: 0,
		comment: "The count of followers.",
	})
	public followersCount: number;

	@Column("integer", {
		default: 0,
		comment: "The count of following.",
	})
	public followingCount: number;

	@Column("varchar", {
		length: 512,
		nullable: true,
		comment: "The URI of the new account of the User",
	})
	public movedToUri: string | null;

	@Column("varchar", {
		length: 512,
		array: true,
		nullable: true,
		comment: "URIs the user is known as too",
	})
	public alsoKnownAs: string[] | null;

	@Column("integer", {
		default: 0,
		comment: "The count of notes.",
	})
	public notesCount: number;

	@Column({
		...id(),
		nullable: true,
		comment: "The ID of avatar DriveFile.",
	})
	public avatarId: DriveFile["id"] | null;

	@Column({
		...id(),
		nullable: true,
		comment: "The ID of banner DriveFile.",
	})
	public bannerId: DriveFile["id"] | null;

	@Column("varchar", {
		length: 128,
		array: true,
		default: "{}",
	})
	public tags: string[];

	@Column("boolean", {
		default: false,
		comment: "Whether the User is suspended.",
	})
	public isSuspended: boolean;

	@Column("boolean", {
		default: false,
		comment: "Whether the User is silenced.",
	})
	public isSilenced: boolean;

	@Column("boolean", {
		default: false,
		comment: "Whether the User is locked.",
	})
	public isLocked: boolean;

	@Column("boolean", {
		default: false,
		comment: "Whether the User is a bot.",
	})
	public isBot: boolean;

	@Column("boolean", {
		default: false,
		comment: "Whether the User is a cat.",
	})
	public isCat: boolean;

	@Column("boolean", {
		default: true,
		comment: "Whether to speak as a cat if isCat.",
	})
	public speakAsCat: boolean;

	@Column("boolean", {
		default: true,
		comment: "Whether to enable the cat language conversion.",
	})
	public readCatLanguage: boolean;

	@Column("boolean", {
		default: false,
		comment: "Whether the User is the admin.",
	})
	public isAdmin: boolean;

	@Column("boolean", {
		default: false,
		comment: "Whether the User is a moderator.",
	})
	public isModerator: boolean;



	// unauthorized: no permission
	//          add: add custom emojis to the server
	//          mod: add permission + modify {category, tags, license} of existing custom emojis
	//         full: mod permission + {rename, delete} existing custom emojis
	@Column({
		type: "enum",
		enum: ["unauthorized", "add", "mod", "full"],
		default: "unauthorized",
	})
	public emojiModPerm: EmojiModPerm;

	@Index()
	@Column("boolean", {
		default: true,
		comment: "Whether the User is explorable.",
	})
	public isExplorable: boolean;

	// アカウントが削除されたかどうかのフラグだが、完全に削除される際は物理削除なので実質削除されるまでの「削除が進行しているかどうか」のフラグ
	@Column("boolean", {
		default: false,
		comment: "Whether the User is deleted.",
	})
	public isDeleted: boolean;

	@Column("varchar", {
		length: 128,
		array: true,
		default: "{}",
	})
	public emojis: string[];

	@Index()
	@Column("varchar", {
		length: 512,
		nullable: true,
		comment:
			"The host of the User. It will be null if the origin of the user is local.",
	})
	public host: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
		comment:
			"The inbox URL of the User. It will be null if the origin of the user is local.",
	})
	public inbox: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
		comment:
			"The sharedInbox URL of the User. It will be null if the origin of the user is local.",
	})
	public sharedInbox: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
		comment:
			"The featured URL of the User. It will be null if the origin of the user is local.",
	})
	public featured: string | null;

	@Index()
	@Column("varchar", {
		length: 512,
		nullable: true,
		comment:
			"The URI of the User. It will be null if the origin of the user is local.",
	})
	public uri: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
		comment:
			"The URI of the user Follower Collection. It will be null if the origin of the user is local.",
	})
	public followersUri: string | null;

	@Index({ unique: true })
	@Column("char", {
		length: 16,
		nullable: true,
		unique: true,
		comment:
			"The native access token of the User. It will be null if the origin of the user is local.",
	})
	public token: string | null;

	@Column("integer", {
		nullable: true,
		comment: "Overrides user drive capacity limit",
	})
	public driveCapacityOverrideMb: number | null;

	@Index()
	@Column("boolean", {
		default: true,
		comment: "Whether the User is indexable.",
	})
	public isIndexable: boolean;

	//#region Relations
	@OneToOne(() => DriveFile, {
		onDelete: "SET NULL",
		nullable: true,
	})
	@JoinColumn()
	public avatar: Relation<DriveFile | null>;

	@OneToOne(() => DriveFile, {
		onDelete: "SET NULL",
		nullable: true,
	})
	@JoinColumn()
	public banner: Relation<DriveFile | null>;
	//#endregion

	constructor(data: Partial<User>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

export interface ILocalUser extends User {
	host: null;
}

export interface IRemoteUser extends User {
	host: string;
}

export type CacheableLocalUser = ILocalUser;

export type CacheableRemoteUser = IRemoteUser;

export type CacheableUser = CacheableLocalUser | CacheableRemoteUser;
