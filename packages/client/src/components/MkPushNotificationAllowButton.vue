<template>
	<MkButton
		v-if="supported && !pushRegistrationInServer"
		type="button"
		primary
		:gradate="gradate"
		:rounded="rounded"
		:inline="inline"
		:autofocus="autofocus"
		:wait="wait"
		:full="full"
		@click="subscribe"
	>
		{{ i18n.ts.subscribePushNotification }}
	</MkButton>
	<MkButton
		v-else-if="
			!showOnlyToRegister &&
			(isSignedIn(me) ? pushRegistrationInServer : pushSubscription)
		"
		type="button"
		:primary="false"
		:gradate="gradate"
		:rounded="rounded"
		:inline="inline"
		:autofocus="autofocus"
		:wait="wait"
		:full="full"
		@click="unsubscribe"
	>
		{{ i18n.ts.unsubscribePushNotification }}
	</MkButton>
	<MkButton
		v-else-if="isSignedIn(me) && pushRegistrationInServer"
		disabled
		:rounded="rounded"
		:inline="inline"
		:wait="wait"
		:full="full"
	>
		{{ i18n.ts.pushNotificationAlreadySubscribed }}
	</MkButton>
	<MkButton
		v-else-if="!supported"
		disabled
		:rounded="rounded"
		:inline="inline"
		:wait="wait"
		:full="full"
	>
		{{ i18n.ts.pushNotificationNotSupported }}
	</MkButton>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { getAccounts } from "@/account";
import { isSignedIn, me } from "@/me";
import MkButton from "@/components/MkButton.vue";
import { getInstanceInfo } from "@/instance";
import { api, apiWithDialog, promiseDialog } from "@/os";
import { i18n } from "@/i18n";

defineProps<{
	primary?: boolean;
	gradate?: boolean;
	rounded?: boolean;
	inline?: boolean;
	link?: boolean;
	to?: string;
	autofocus?: boolean;
	wait?: boolean;
	danger?: boolean;
	full?: boolean;
	showOnlyToRegister?: boolean;
}>();

const { swPublickey } = getInstanceInfo();
// ServiceWorker registration
const registration = ref<ServiceWorkerRegistration | undefined>();
// If this browser supports push notification
const supported = ref(false);
// If this browser has already subscribed to push notification
const pushSubscription = ref<PushSubscription | null>(null);
const pushRegistrationInServer = ref<
	| {
			state?: string;
			key?: string;
			userId: string;
			endpoint: string;
			sendReadMessage: boolean;
	  }
	| undefined
>();

function subscribe() {
	if (!registration.value || !supported.value || !swPublickey) return;

	// SEE: https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe#Parameters
	return promiseDialog(
		registration.value.pushManager
			.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(swPublickey),
			})
			.then(
				async (subscription) => {
					pushSubscription.value = subscription;

					// Register
					pushRegistrationInServer.value = await api("sw/register", {
						endpoint: subscription.endpoint,
						auth: encode(subscription.getKey("auth")),
						publickey: encode(subscription.getKey("p256dh")),
					});
				},
				async (err) => {
					// When subscribe failed
					// 通知が許可されていなかったとき
					if (err?.name === "NotAllowedError") {
						console.info("User denied the notification permission request.");
						return;
					}

					// 違うapplicationServerKey (または gcm_sender_id)のサブスクリプションが
					// 既に存在していることが原因でエラーになった可能性があるので、
					// そのサブスクリプションを解除しておく
					// （これは実行されなさそうだけど、おまじない的に古い実装から残してある）
					await unsubscribe();
				},
			),
		null,
		null,
	);
}

async function unsubscribe() {
	if (!pushSubscription.value) return;

	const endpoint = pushSubscription.value.endpoint;
	const accounts = await getAccounts();

	pushRegistrationInServer.value = undefined;

	if (isSignedIn(me) && accounts.length >= 2) {
		apiWithDialog("sw/unregister", {
			i: me.token,
			endpoint,
		});
	} else {
		pushSubscription.value.unsubscribe();
		apiWithDialog("sw/unregister", {
			endpoint,
		});
		pushSubscription.value = null;
	}
}

function encode(buffer: ArrayBuffer | null) {
	return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

/**
 * Convert the URL safe base64 string to a Uint8Array
 * @param base64String base64 string
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

if (navigator.serviceWorker == null) {
	// TODO: よしなに？
} else {
	navigator.serviceWorker.ready.then(async (swr) => {
		registration.value = swr;

		pushSubscription.value =
			await registration.value.pushManager.getSubscription();

		if (swPublickey && "PushManager" in window && isSignedIn(me) && me.token) {
			supported.value = true;

			if (pushSubscription.value) {
				const res = await api("sw/show-registration", {
					endpoint: pushSubscription.value.endpoint,
				});

				if (res) {
					pushRegistrationInServer.value = res;
				}
			}
		}
	});
}

defineExpose({
	pushRegistrationInServer,
});
</script>
