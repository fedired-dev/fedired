import type { MigrationInterface, QueryRunner } from "typeorm";

export class FixFedired1658981842728 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`UPDATE "meta" SET "useStarForReactionFallback" = TRUE;`,
		);
		await queryRunner.query(
			`UPDATE "meta" SET "repositoryUrl" = 'https://github.com/fedired-dev/fedired'`,
		);
		await queryRunner.query(
			`UPDATE "meta" SET "feedbackUrl" = 'https://github.com/fedired-dev/fedired/issues'`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`UPDATE "meta" SET "useStarForReactionFallback" = FALSE;`,
		);
		await queryRunner.query(
			`UPDATE "meta" SET "repositoryUrl" = 'https://github.com/fedired-dev/fedired'`,
		);
		await queryRunner.query(
			`UPDATE "meta" SET "feedbackUrl" = 'https://github.com/fedired-dev/fedired/issues'`,
		);
	}
}
