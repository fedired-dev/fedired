/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Copyright (c) 2024 Fedired
 */

import define from "@/server/api/define.js";
import { Users } from "@/models/index.js";

export const meta = {
    tags: ["account"],
    requireCredential: true,
    kind: "write:account",
    description: "Register a Firebase Cloud Messaging token for push notifications.",
    errors: {
        invalidToken: {
            message: "Invalid FCM token format.",
            code: "INVALID_TOKEN",
            id: "f9c0d7d0-d492-4c3c-9a8d-a70f61e2d5d2",
        },
    },
} as const;

export const paramDef = {
    type: "object",
    properties: {
        token: { type: "string" },
    },
    required: ["token"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
    // Validar formato del token
    if (!/^[A-Za-z0-9_-]+:[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(ps.token)) {
        throw new Error("invalidToken");
    }

    // Obtener tokens actuales
    const currentUser = await Users.findOneBy({ id: user.id });
    if (!currentUser) throw new Error("User not found");

    const currentTokens = currentUser.fcmTokens || [];

    // Añadir nuevo token si no existe
    if (!currentTokens.includes(ps.token)) {
        currentTokens.push(ps.token);
        await Users.update(user.id, {
            fcmTokens: currentTokens
        });
    }

    return {
        success: true
    };
}); 