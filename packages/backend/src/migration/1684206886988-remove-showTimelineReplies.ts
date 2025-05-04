import type { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveShowTimelineReplies1684206886988
	implements MigrationInterface
{
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "user" DROP COLUMN "showTimelineReplies"`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "user" ADD "showTimelineReplies" boolean NOT NULL DEFAULT false`,
		);
	}
}
