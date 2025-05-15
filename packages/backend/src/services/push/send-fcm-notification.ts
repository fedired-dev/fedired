/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Copyright (c) 2024 Fedired
 */

import { Users } from "@/models/index.js";
import { sendFcmNotification } from "./firebase-config.js";
import { getNoteSummary } from "backend-rs";
import type { User } from "@/models/entities/user.js";
import type { Note } from "@/models/entities/note.js";
import { I18n } from "@/misc/i18n.js";
import locales from "../../../../../locales/index.mjs";

export async function sendPushNotificationViaFcm(
    userId: User["id"],
    type: string,
    data: {
        notifierId?: string;
        note?: Note;
        body?: string;
        header?: string;
        icon?: string;
    }
) {
    const user = await Users.findOneBy({ id: userId });
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return;

    const i18n = new I18n(locales);
    const lang = user.lang || "en-US";
    i18n.locale = lang;

    let title = "";
    let body = "";
    let icon = "";

    const notifier = data.notifierId ? await Users.findOneBy({ id: data.notifierId }) : null;
    const notifierName = notifier ? notifier.name || notifier.username : null;

    switch (type) {
        case "mention":
            title = i18n.t("_notification.youGotMention", { name: notifierName });
            body = data.note ? getNoteSummary(data.note.fileIds, data.note.text, data.note.cw, data.note.hasPoll) : "";
            icon = notifier?.avatarUrl || "";
            break;
        case "reply":
            title = i18n.t("_notification.youGotReply", { name: notifierName });
            body = data.note ? getNoteSummary(data.note.fileIds, data.note.text, data.note.cw, data.note.hasPoll) : "";
            icon = notifier?.avatarUrl || "";
            break;
        case "renote":
            title = i18n.t("_notification.youRenoted", { name: notifierName });
            body = data.note ? getNoteSummary(data.note.fileIds, data.note.text, data.note.cw, data.note.hasPoll) : "";
            icon = notifier?.avatarUrl || "";
            break;
        case "app":
            title = data.header || "Fedired";
            body = data.body || "";
            icon = data.icon || "";
            break;
        // Añadir más casos según sea necesario
    }

    // Enviar a todos los tokens FCM registrados del usuario
    const sendPromises = user.fcmTokens.map(token =>
        sendFcmNotification(token, {
            title,
            body,
            icon,
            data: {
                type,
                userId: user.id,
                ...(data.note && { noteId: data.note.id }),
                ...(notifier && { notifierId: notifier.id })
            }
        }).catch(err => {
            // Si el token es inválido, lo removemos
            if (err.code === 'messaging/invalid-registration-token' ||
                err.code === 'messaging/registration-token-not-registered') {
                user.fcmTokens = user.fcmTokens.filter(t => t !== token);
                Users.update(user.id, {
                    fcmTokens: user.fcmTokens
                });
            }
        })
    );

    await Promise.all(sendPromises);
} 