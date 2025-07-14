/**
 * Copyright (C) 2024 Fedired
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import define from "@/server/api/define.js";
import { syncVerifiedSponsorUsers } from "@/services/verified-sponsor-sync.js";

export const meta = {
	requireCredential: true,
	requireAdmin: true,
	tags: ["admin"],
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	await syncVerifiedSponsorUsers();

	return {
		success: true,
		message: "Verified and sponsor users synchronized successfully",
	};
}); 