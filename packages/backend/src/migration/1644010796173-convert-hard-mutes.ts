import type { MigrationInterface, QueryRunner } from "typeorm";

export class convertHardMutes1644010796173 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		const entries = await queryRunner.query(
			`SELECT "userId", "mutedWords" FROM "user_profile" WHERE "userHost" IS NULL`,
		);
		for (let i = 0; i < entries.length; i++) {
			const words = entries[i].mutedWords
				.map((line) => {
					if (typeof line === "string") return [];
					const regexp = line.join(" ").match(/^\/(.+)\/(.*)$/);
					if (regexp) {
						// convert regexp's
						try {
							new RegExp(regexp[1], regexp[2]);
							return `/${regexp[1]}/${regexp[2]}`;
						} catch (err) {
							// invalid regex, ignore it
							return [];
						}
					} else {
						// remove empty segments
						return line.filter((x) => x !== "");
					}
				})
				// remove empty lines
				.filter((x) => !(Array.isArray(x) && x.length === 0));

			await queryRunner.connection
				.createQueryBuilder()
				.update("user_profile")
				.set({
					mutedWords: words,
				})
				.where("userId = :id", { id: entries[i].userId })
				.execute();
		}
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		const entries = await queryRunner.query(
			`SELECT "userId", "mutedWords" FROM "user_profile"`,
		);
		for (let i = 0; i < entries.length; i++) {
			const words = entries[i].mutedWords
				.map((line) => {
					if (Array.isArray(line)) {
						return line;
					} else {
						// do not split regex at spaces again
						return [line];
					}
				})
				// remove empty lines
				.filter((x) => !(Array.isArray(x) && x.length === 0));

			await queryRunner.connection
				.createQueryBuilder()
				.update("user_profile")
				.set({
					mutedWords: words,
				})
				.where("userId = :id", { id: entries[i].userId })
				.execute();
		}
	}
}
