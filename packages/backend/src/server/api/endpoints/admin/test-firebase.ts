/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Copyright (c) 2024 Fedired
 */

import define from "@/server/api/define.js";
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export const meta = {
    tags: ["admin"],
    requireCredential: true,
    requireAdmin: true,
} as const;

export const paramDef = {
    type: "object",
    properties: {
        config: {
            type: "object",
            properties: {
                type: { type: "string" },
                project_id: { type: "string" },
                private_key_id: { type: "string" },
                private_key: { type: "string" },
                client_email: { type: "string" },
                client_id: { type: "string" },
                auth_uri: { type: "string" },
                token_uri: { type: "string" },
                auth_provider_x509_cert_url: { type: "string" },
                client_x509_cert_url: { type: "string" }
            },
            required: [
                "type",
                "project_id",
                "private_key_id",
                "private_key",
                "client_email",
                "client_id",
                "auth_uri",
                "token_uri",
                "auth_provider_x509_cert_url",
                "client_x509_cert_url"
            ]
        }
    },
    required: ["config"]
} as const;

export default define(meta, paramDef, async (ps) => {
    try {
        // Intentar inicializar Firebase con la configuración proporcionada
        const app = initializeApp({
            credential: cert(ps.config)
        }, 'fedired-fcm-test');

        // Obtener una instancia de Firebase Cloud Messaging
        const messaging = getMessaging(app);

        // Intentar enviar un mensaje de prueba (a un token inválido, solo para probar la configuración)
        await messaging.send({
            token: 'invalid-token',
            notification: {
                title: 'Test Notification',
                body: 'This is a test notification'
            }
        }).catch(error => {
            // Ignoramos el error de token inválido ya que es esperado
            if (error.code !== 'messaging/invalid-registration-token' &&
                error.code !== 'messaging/registration-token-not-registered') {
                throw error;
            }
        });

        // Si llegamos aquí, la configuración es válida
        return {
            success: true,
            message: "Firebase configuration is valid"
        };
    } catch (error) {
        throw new Error(`Firebase configuration test failed: ${error.message}`);
    }
}); 