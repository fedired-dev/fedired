import type { MigrationInterface, QueryRunner } from "typeorm";

export class PreventAiLearning1683682889948 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "user_profile" ADD "preventAiLearning" boolean NOT NULL DEFAULT true`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "user_profile" DROP COLUMN "preventAiLearning"`,
		);
	}
}
