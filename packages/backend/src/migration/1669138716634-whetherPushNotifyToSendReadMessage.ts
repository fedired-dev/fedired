import type { MigrationInterface, QueryRunner } from "typeorm";

export class whetherPushNotifyToSendReadMessage1669138716634
	implements MigrationInterface
{
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "sw_subscription" ADD "sendReadMessage" boolean NOT NULL DEFAULT false`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "sw_subscription" DROP COLUMN "sendReadMessage"`,
		);
	}
}
