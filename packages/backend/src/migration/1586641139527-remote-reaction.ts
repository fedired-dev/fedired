import type { MigrationInterface, QueryRunner } from "typeorm";

export class remoteReaction1586641139527 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(260)`,
			undefined,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(130)`,
			undefined,
		);
	}
}
