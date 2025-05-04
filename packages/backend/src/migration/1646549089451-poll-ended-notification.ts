import type { MigrationInterface, QueryRunner } from "typeorm";

export class pollEndedNotification1646549089451 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_type_enum" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum" USING "type"::"text"::"public"."notification_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."notification_type_enum_old" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum_old" USING "type"::"text"::"public"."notification_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notification_type_enum_old" RENAME TO "notification_type_enum"`,
		);
	}
}
