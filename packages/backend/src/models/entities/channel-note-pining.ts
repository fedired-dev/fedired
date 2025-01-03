import {
	PrimaryColumn,
	Entity,
	Index,
	JoinColumn,
	Column,
	ManyToOne,
	type Relation,
} from "typeorm";
import { Note } from "./note.js";
import { Channel } from "./channel.js";
import { id } from "../id.js";

@Entity()
@Index(["channelId", "noteId"], { unique: true })
export class ChannelNotePining {
	@PrimaryColumn(id())
	public id: string;

	@Column("timestamp with time zone", {
		comment: "The created date of the ChannelNotePining.",
	})
	public createdAt: Date;

	@Index()
	@Column(id())
	public channelId: Channel["id"];

	@Column(id())
	public noteId: Note["id"];

	//#region Relations
	@ManyToOne(() => Channel, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public channel: Relation<Channel>;

	@ManyToOne(() => Note, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public note: Relation<Note>;
	//#endregion
}
