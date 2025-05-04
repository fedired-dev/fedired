import type { MigrationInterface, QueryRunner } from "typeorm";

export class noteReactionLength1582875306439 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(130)`,
			undefined,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(128)`,
			undefined,
		);
	}
}
