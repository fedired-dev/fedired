/**
 * Copyright (C) 2024 Fedired
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveVerifiedSponsorFields1752456000001 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		// Remove isSponsor field
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isSponsor"`);

		// Remove isVerified field
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isVerified"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Add isVerified field back
		await queryRunner.query(
			`ALTER TABLE "user" ADD "isVerified" boolean NOT NULL DEFAULT false`,
		);

		// Add isSponsor field back
		await queryRunner.query(
			`ALTER TABLE "user" ADD "isSponsor" boolean NOT NULL DEFAULT false`,
		);

		// Add comments to the columns
		await queryRunner.query(
			`COMMENT ON COLUMN "user"."isVerified" IS 'Whether the User is verified.'`,
		);

		await queryRunner.query(
			`COMMENT ON COLUMN "user"."isSponsor" IS 'Whether the User is a sponsor.'`,
		);
	}
} 