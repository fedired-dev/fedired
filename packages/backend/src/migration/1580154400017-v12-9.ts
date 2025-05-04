import type { MigrationInterface, QueryRunner } from "typeorm";

export class v1291580154400017 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "antenna" ADD "withReplies" boolean NOT NULL DEFAULT false`,
			undefined,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "antenna" DROP COLUMN "withReplies"`,
			undefined,
		);
	}
}
