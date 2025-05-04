import type { MigrationInterface, QueryRunner } from "typeorm";

export class LibreTranslate1682777547198 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
				ALTER TABLE "meta"
				ADD "libreTranslateApiUrl" character varying(512)
		`);
		await queryRunner.query(`
				ALTER TABLE "meta"
				ADD "libreTranslateApiKey" character varying(128)
		`);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
				ALTER TABLE "meta" DROP COLUMN "libreTranslateApiKey"
		`);
		await queryRunner.query(`
				ALTER TABLE "meta" DROP COLUMN "libreTranslateApiUrl"
		`);
	}
}
