/**
 * Copyright (C) 2024 Fedired
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Users } from "@/models/index.js";
import { verifiedUsers, isVerified } from "../../../.fedired/verified-users.js";
import { sponsorUsers, isSponsor } from "../../../.fedired/sponsor.js";
import Logger from "@/services/logger.js";

const logger = new Logger("verified-sponsor-sync");

/**
 * Sync verified and sponsor users from .fedired files to database
 */
export async function syncVerifiedSponsorUsers(): Promise<void> {
	logger.info("Starting verified and sponsor users sync...");

	try {
		// Get all local users
		const allUsers = await Users.findBy({ host: null });

		// Update verified users
		for (const user of allUsers) {
			const shouldBeVerified = isVerified(user.username);
			const shouldBeSponsor = isSponsor(user.username);

			// Only update if there's a change
			if (user.isVerified !== shouldBeVerified || user.isSponsor !== shouldBeSponsor) {
				await Users.update(user.id, {
					isVerified: shouldBeVerified,
					isSponsor: shouldBeSponsor,
				});

				logger.info(
					`Updated user ${user.username}: verified=${shouldBeVerified}, sponsor=${shouldBeSponsor}`,
				);
			}
		}

		logger.info("Verified and sponsor users sync completed successfully");
	} catch (error) {
		logger.error("Failed to sync verified and sponsor users", error);
		throw error;
	}
}

/**
 * Get all verified users
 */
export async function getVerifiedUsers(): Promise<string[]> {
	return verifiedUsers;
}

/**
 * Get all sponsor users
 */
export async function getSponsorUsers(): Promise<string[]> {
	return sponsorUsers;
}

/**
 * Check if a user is verified
 */
export function checkIsVerified(username: string): boolean {
	return isVerified(username);
}

/**
 * Check if a user is a sponsor
 */
export function checkIsSponsor(username: string): boolean {
	return isSponsor(username);
} 