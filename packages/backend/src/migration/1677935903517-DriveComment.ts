import type { MigrationInterface, QueryRunner } from "typeorm";

export class DriveComment1677935903517 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "drive_file" ALTER "comment" TYPE character varying(8192)`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "drive_file" ALTER "comment" TYPE character varying(512)`,
		);
	}
}
