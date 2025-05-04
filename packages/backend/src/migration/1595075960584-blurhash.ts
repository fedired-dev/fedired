import type { MigrationInterface, QueryRunner } from "typeorm";

export class blurhash1595075960584 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "drive_file" ADD "blurhash" character varying(128)`,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "blurhash"`);
	}
}
