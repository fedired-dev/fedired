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

// TODO: 同じdomain、同じscope、同じkeyのレコードは二つ以上存在しないように制約付けたい
@Entity()
export class RegistryItem {
	@PrimaryColumn(id())
	public id: string;

	@Column("timestamp with time zone", {
		comment: "The created date of the RegistryItem.",
	})
	public createdAt: Date;

	@Column("timestamp with time zone", {
		comment: "The updated date of the RegistryItem.",
	})
	public updatedAt: Date;

	@Index()
	@Column({
		...id(),
		comment: "The owner ID.",
	})
	public userId: User["id"];

	@Column("varchar", {
		length: 1024,
		comment: "The key of the RegistryItem.",
	})
	public key: string;

	@Column("jsonb", {
		default: {},
		nullable: true,
		comment: "The value of the RegistryItem.",
	})
	public value: any | null;

	@Index()
	@Column("varchar", {
		length: 1024,
		array: true,
		default: "{}",
	})
	public scope: string[];

	// サードパーティアプリに開放するときのためのカラム
	@Index()
	@Column("varchar", {
		length: 512,
		nullable: true,
	})
	public domain: string | null;

	//#region Relations
	@ManyToOne(() => User, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public user: Relation<User>;
	//#endregion
}
