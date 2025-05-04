import type { MigrationInterface, QueryRunner } from "typeorm";

/* "FediredRepoMove1671388343000" is a class that updates the "useStarForReactionFallback" column in
the "meta" table to TRUE */
export class FediredRepoMove1671388343000 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`UPDATE meta SET "repositoryUrl" = 'https://github.com/fedired-dev/fedired'`,
		);
		await queryRunner.query(
			`UPDATE meta SET "feedbackUrl" = 'https://github.com/fedired-dev/fedired/issues'`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`UPDATE meta SET "repositoryUrl" = 'https://github.com/fedired-dev/fedired'`,
		);
		await queryRunner.query(
			`UPDATE meta SET "feedbackUrl" = 'https://github.com/fedired-dev/fedired/issues'`,
		);
	}
}
