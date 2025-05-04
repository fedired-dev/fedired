import type { MigrationInterface, QueryRunner } from "typeorm";

export class v1231579282808087 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "announcement" ADD "updatedAt" TIMESTAMP WITH TIME ZONE`,
			undefined,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "announcement" DROP COLUMN "updatedAt"`,
			undefined,
		);
	}
}
