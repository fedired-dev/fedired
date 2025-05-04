import type Bull from "bull";

import { UserProfiles } from "@/models/index.js";
import { Not } from "typeorm";
import { queueLogger } from "../../logger.js";
import { verifyLink } from "@/services/fetch-rel-me.js";
import { inspect } from "node:util";

const logger = queueLogger.createSubLogger("verify-links");

export async function verifyLinks(
	job: Bull.Job<Record<string, unknown>>,
	done: any,
): Promise<void> {
	logger.info("Verifying links...");

	const usersToVerify = await UserProfiles.findBy({
		fields: Not(null),
		userHost: "",
	});
	for (const user of usersToVerify) {
		for (const field of user.fields) {
			if (!field || field.name === "" || field.value === "") {
				continue;
			}
			if (field.value.startsWith("http") && user.user?.username) {
				field.verified = await verifyLink(field.value, user.user.username);
			}
		}
		if (user.fields.length > 0) {
			try {
				await UserProfiles.update(user.userId, {
					fields: user.fields,
				});
			} catch (e) {
				logger.error(`Failed to update user ${user.userId}`);
				logger.info(inspect(e));
				done(e);
			}
		}
	}

	logger.info("All links successfully verified.");
	done();
}
