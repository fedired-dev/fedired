import type { MigrationInterface, QueryRunner } from "typeorm";

export class v12101580276619901 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`TRUNCATE TABLE "notification"`, undefined);
		await queryRunner.query(
			`ALTER TABLE "notification" DROP COLUMN "type"`,
			undefined,
		);
		await queryRunner.query(
			`CREATE TYPE "notification_type_enum" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted')`,
			undefined,
		);
		await queryRunner.query(
			`ALTER TABLE "notification" ADD "type" "notification_type_enum" NOT NULL`,
			undefined,
		);
	}
	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "notification" DROP COLUMN "type"`,
			undefined,
		);
		await queryRunner.query(`DROP TYPE "notification_type_enum"`, undefined);
		await queryRunner.query(
			`ALTER TABLE "notification" ADD "type" character varying(32) NOT NULL`,
			undefined,
		);
	}
}
