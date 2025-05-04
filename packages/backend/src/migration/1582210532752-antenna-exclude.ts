import type { MigrationInterface, QueryRunner } from "typeorm";

export class antennaExclude1582210532752 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "antenna" ADD "excludeKeywords" jsonb NOT NULL DEFAULT '[]'`,
			undefined,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "antenna" DROP COLUMN "excludeKeywords"`,
			undefined,
		);
	}
}
