import {
	PrimaryColumn,
	Entity,
	Index,
	JoinColumn,
	Column,
	ManyToOne,
	type Relation,
} from "typeorm";
import { User } from "./user.js";
import { id } from "../id.js";

@Entity()
@Index(["followerId", "followeeId"], { unique: true })
export class FollowRequest {
	@PrimaryColumn(id())
	public id: string;

	@Column("timestamp with time zone", {
		comment: "The created date of the FollowRequest.",
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: "The followee user ID.",
	})
	public followeeId: User["id"];

	@Index()
	@Column({
		...id(),
		comment: "The follower user ID.",
	})
	public followerId: User["id"];

	@Column("varchar", {
		length: 128,
		nullable: true,
		comment: "id of Follow Activity.",
	})
	public requestId: string | null;

	//#region Denormalized fields
	@Column("varchar", {
		length: 128,
		nullable: true,
		comment: "[Denormalized]",
	})
	public followerHost: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
		comment: "[Denormalized]",
	})
	public followerInbox: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
		comment: "[Denormalized]",
	})
	public followerSharedInbox: string | null;

	@Column("varchar", {
		length: 128,
		nullable: true,
		comment: "[Denormalized]",
	})
	public followeeHost: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
		comment: "[Denormalized]",
	})
	public followeeInbox: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
		comment: "[Denormalized]",
	})
	public followeeSharedInbox: string | null;
	//#endregion

	//#region Relations
	@ManyToOne(() => User, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public followee: Relation<User>;

	@ManyToOne(() => User, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public follower: Relation<User>;
	//#endregion
}
