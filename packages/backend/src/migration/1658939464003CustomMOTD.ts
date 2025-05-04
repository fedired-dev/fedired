import type { MigrationInterface, QueryRunner } from "typeorm";

export class CustomMOTD1658939464003 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "meta" ADD "customMOTD" character varying(256) array NOT NULL DEFAULT '{}'::varchar[]`,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "customMOTD"`);
	}
}
