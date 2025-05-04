import type { MigrationInterface, QueryRunner } from "typeorm";

export class hCaptcha1588044505511 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "meta" ADD "enableHcaptcha" boolean NOT NULL DEFAULT false`,
			undefined,
		);
		await queryRunner.query(
			`ALTER TABLE "meta" ADD "hcaptchaSiteKey" character varying(64)`,
			undefined,
		);
		await queryRunner.query(
			`ALTER TABLE "meta" ADD "hcaptchaSecretKey" character varying(64)`,
			undefined,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "meta" DROP COLUMN "hcaptchaSecretKey"`,
			undefined,
		);
		await queryRunner.query(
			`ALTER TABLE "meta" DROP COLUMN "hcaptchaSiteKey"`,
			undefined,
		);
		await queryRunner.query(
			`ALTER TABLE "meta" DROP COLUMN "enableHcaptcha"`,
			undefined,
		);
	}
}
