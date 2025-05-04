import { DataSource } from "typeorm";
import { config } from "@/config.js";
import { entities } from "@/db/postgre.js";

export default new DataSource({
	type: "postgres",
	host: config.db.host,
	port: config.db.port,
	username: config.db.user,
	password: config.db.pass,
	database: config.db.db,
	extra: config.db.extra,
	entities: entities,
	migrations: ["built/migration/*.js"],
});
