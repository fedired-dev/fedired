<template>
	<div class="_formRoot">
		<FormButton class="_formBlock" @click="configure"
			><template #icon><i :class="icon('ph-gear-six')"></i></template
			>{{ i18n.ts.notificationSetting }}</FormButton
		>
		<FormSection>
			<ForFormButtonmLink
				class="_formBlock"
				@click="readAllNotifications"
				>{{ i18n.ts.markAsReadAllNotifications }}</ForFormButtonmLink
			>
			<FormButton class="_formBlock" @click="readAllUnreadNotes">{{
				i18n.ts.markAsReadAllUnreadNotes
			}}</FormButton>
			<FormButton class="_formBlock" @click="readAllMessagingMessages">{{
				i18n.ts.markAsReadAllTalkMessages
			}}</FormButton>
		</FormSection>
		<FormSection>
			<template #label>{{ i18n.ts.pushNotification }}</template>

			<div class="_gaps_m">
				<MkPushNotificationAllowButton ref="allowButton" />
				<MkSwitch
					:disabled="!pushRegistrationInServer"
					:model-value="sendReadMessage"
					@update:model-value="onChangeSendReadMessage"
				>
					<template #label>{{
						i18n.ts.sendPushNotificationReadMessage
					}}</template>
					<template #caption>
						<I18n
							:src="
								i18n.ts.sendPushNotificationReadMessageCaption
							"
						>
							<template #emptyPushNotificationMessage>{{
								i18n.ts._notification
									.emptyPushNotificationMessage
							}}</template>
						</I18n>
					</template>
				</MkSwitch>
			</div>
		</FormSection>
	</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, shallowRef } from "vue";
import { notificationTypes } from "fedired-js";
import FormButton from "@/components/MkButton.vue";
import FormSection from "@/components/form/section.vue";
import * as os from "@/os";
import { me } from "@/me";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import MkPushNotificationAllowButton from "@/components/MkPushNotificationAllowButton.vue";
import icon from "@/scripts/icon";

const allowButton =
	shallowRef<InstanceType<typeof MkPushNotificationAllowButton>>();
const pushRegistrationInServer = computed(
	() => allowButton.value?.pushRegistrationInServer,
);
const sendReadMessage = computed(
	() => pushRegistrationInServer.value?.sendReadMessage || false,
);

async function readAllUnreadNotes() {
	await os.api("i/read-all-unread-notes");
}

async function readAllMessagingMessages() {
	await os.api("i/read-all-messaging-messages");
}

async function readAllNotifications() {
	await os.api("notifications/mark-all-as-read");
}

function configure() {
	const includingTypes = notificationTypes.filter(
		(x) => !me!.mutingNotificationTypes.includes(x),
	);
	os.popup(
		defineAsyncComponent(
			() => import("@/components/MkNotificationSettingWindow.vue"),
		),
		{
			includingTypes,
			showGlobalToggle: false,
		},
		{
			done: async (res) => {
				const { includingTypes: value } = res;
				await os
					.apiWithDialog("i/update", {
						mutingNotificationTypes: notificationTypes.filter(
							(x) => !value.includes(x),
						),
					})
					.then((i) => {
						me!.mutingNotificationTypes = i.mutingNotificationTypes;
					});
			},
		},
		"closed",
	);
}

function onChangeSendReadMessage(v: boolean) {
	if (!pushRegistrationInServer.value) return;

	os.apiWithDialog("sw/update-registration", {
		endpoint: pushRegistrationInServer.value.endpoint,
		sendReadMessage: v,
	}).then((res) => {
		if (!allowButton.value) return;
		allowButton.value.pushRegistrationInServer = res;
	});
}

definePageMetadata({
	title: i18n.ts.notifications,
	icon: `${icon("ph-bell")}`,
});
</script>
