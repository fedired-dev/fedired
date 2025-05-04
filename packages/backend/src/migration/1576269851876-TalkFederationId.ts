import type { MigrationInterface, QueryRunner } from "typeorm";

export class TalkFederationId1576269851876 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "messaging_message" ADD "uri" character varying(512)`,
			undefined,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "messaging_message" DROP COLUMN "uri"`,
			undefined,
		);
	}
}
