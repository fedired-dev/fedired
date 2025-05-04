import type { MigrationInterface, QueryRunner } from "typeorm";

export class addFkAbuseUserReportTargetUserIdToUserId1671199573000
	implements MigrationInterface
{
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DELETE FROM abuse_user_report WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE "user"."id" = "abuse_user_report"."targetUserId")`,
		);
		await queryRunner.query(
			`ALTER TABLE abuse_user_report ADD CONSTRAINT fk_7f4e851a35d81b64dda28eee0 FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE abuse_user_report DROP CONSTRAINT fk_7f4e851a35d81b64dda28eee0`,
		);
	}
}
