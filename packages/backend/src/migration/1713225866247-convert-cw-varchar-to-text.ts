import type { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertCwVarcharToText1713225866247 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		queryRunner.query(`DROP INDEX "IDX_8e3bbbeb3df04d1a8105da4c8f"`);
		queryRunner.query(`ALTER TABLE "note" ALTER COLUMN "cw" TYPE text`);
		queryRunner.query(
			`CREATE INDEX "IDX_8e3bbbeb3df04d1a8105da4c8f" ON "note" USING "pgroonga" ("cw")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		queryRunner.query(`DROP INDEX "IDX_8e3bbbeb3df04d1a8105da4c8f"`);
		queryRunner.query(
			`ALTER TABLE "note" ALTER COLUMN "cw" TYPE character varying(512)`,
		);
		queryRunner.query(
			`CREATE INDEX "IDX_8e3bbbeb3df04d1a8105da4c8f" ON "note" USING "pgroonga" ("cw" pgroonga_varchar_full_text_search_ops_v2)`,
		);
	}
}
