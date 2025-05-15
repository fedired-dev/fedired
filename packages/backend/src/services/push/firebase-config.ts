/*
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Copyright (c) 2024 Fedired
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { fetchMeta } from 'backend-rs';

let firebaseApp: any = null;

export async function initializeFirebase() {
    const meta = await fetchMeta();
    
    if (!meta.firebaseConfig) {
        console.warn('Firebase configuration not found. Push notifications via FCM will be disabled.');
        return null;
    }

    try {
        firebaseApp = initializeApp({
            credential: cert(meta.firebaseConfig)
        }, 'fedired-fcm');
        
        return getMessaging(firebaseApp);
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return null;
    }
}

export async function sendFcmNotification(token: string, notification: {
    title: string;
    body?: string;
    icon?: string;
    data?: Record<string, string>;
}) {
    if (!firebaseApp) {
        console.warn('Firebase not initialized. Skipping FCM notification.');
        return;
    }

    const messaging = getMessaging(firebaseApp);

    try {
        const message = {
            token,
            notification: {
                title: notification.title,
                body: notification.body,
                imageUrl: notification.icon
            },
            data: notification.data,
            webpush: {
                fcmOptions: {
                    link: '/'
                },
                notification: {
                    icon: notification.icon,
                    badge: '/static/icons/badge.png',
                    vibrate: [200, 100, 200]
                }
            }
        };

        const response = await messaging.send(message);
        return response;
    } catch (error) {
        console.error('Error sending FCM notification:', error);
        throw error;
    }
} 