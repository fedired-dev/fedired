import type { MigrationInterface, QueryRunner } from "typeorm";

export class registry31610283021566 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "registry_item" ALTER COLUMN "value" DROP NOT NULL`,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "registry_item" ALTER COLUMN "value" SET NOT NULL`,
		);
	}
}
