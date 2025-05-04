import type { MigrationInterface, QueryRunner } from "typeorm";

export class calckey1658203170545 implements MigrationInterface {
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
