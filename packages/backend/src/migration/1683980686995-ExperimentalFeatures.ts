import type { MigrationInterface, QueryRunner } from "typeorm";

export class ExperimentalFeatures1683980686995 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
				ALTER TABLE "meta"
				ADD "experimentalFeatures" jsonb NOT NULL DEFAULT '{}'
		`);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
				ALTER TABLE "meta" DROP COLUMN "experimentalFeatures"
		`);
	}
}
