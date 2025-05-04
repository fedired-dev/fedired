import type { MigrationInterface, QueryRunner } from "typeorm";

export class emailNotificationTypes1613155914446 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "user_profile" ADD "emailNotificationTypes" jsonb NOT NULL DEFAULT '["follow","receiveFollowRequest","groupInvited"]'`,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "user_profile" DROP COLUMN "emailNotificationTypes"`,
		);
	}
}
