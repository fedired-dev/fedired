import type { MigrationInterface, QueryRunner } from "typeorm";

export class v12131580543501339 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE INDEX "IDX_NOTE_TAGS" ON "note" USING gin ("tags")`,
			undefined,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_NOTE_TAGS"`, undefined);
	}
}
