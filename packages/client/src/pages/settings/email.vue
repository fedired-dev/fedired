<template>
	<div class="_formRoot">
		<FormSection>
			<template #label>{{ i18n.ts.emailAddress }}</template>
			<FormInput v-model="emailAddress" type="email" manual-save>
				<template #prefix
					><i :class="icon('ph-envelope-simple-open')"></i
				></template>
				<template v-if="me.email && !me.emailVerified" #caption>{{
					i18n.ts.verificationEmailSent
				}}</template>
				<template
					v-else-if="emailAddress === me.email && me.emailVerified"
					#caption
					><i
						:class="icon('ph-check')"
						style="color: var(--success)"
					></i>
					{{ i18n.ts.emailVerified }}</template
				>
			</FormInput>
		</FormSection>

		<FormSection>
			<FormSwitch
				:model-value="me.receiveAnnouncementEmail"
				@update:modelValue="onChangeReceiveAnnouncementEmail"
			>
				{{ i18n.ts.receiveAnnouncementFromInstance }}
			</FormSwitch>
		</FormSection>

		<FormSection>
			<template #label>{{ i18n.ts.emailNotification }}</template>
			<FormSwitch v-model="emailNotification_mention" class="_formBlock">
				{{ i18n.ts._notification._types.mention }}
			</FormSwitch>
			<FormSwitch v-model="emailNotification_reply" class="_formBlock">
				{{ i18n.ts._notification._types.reply }}
			</FormSwitch>
			<FormSwitch v-model="emailNotification_quote" class="_formBlock">
				{{ i18n.ts._notification._types.quote }}
			</FormSwitch>
			<FormSwitch v-model="emailNotification_follow" class="_formBlock">
				{{ i18n.ts._notification._types.follow }}
			</FormSwitch>
			<FormSwitch
				v-model="emailNotification_receiveFollowRequest"
				class="_formBlock"
			>
				{{ i18n.ts._notification._types.receiveFollowRequest }}
			</FormSwitch>
			<FormSwitch
				v-model="emailNotification_groupInvited"
				class="_formBlock"
			>
				{{ i18n.ts._notification._types.groupInvited }}
			</FormSwitch>
		</FormSection>
	</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import FormSection from "@/components/form/section.vue";
import FormInput from "@/components/form/input.vue";
import FormSwitch from "@/components/form/switch.vue";
import * as os from "@/os";
import { me } from "@/me";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const emailAddress = ref(me!.email);

const onChangeReceiveAnnouncementEmail = (v) => {
	os.api("i/update", {
		receiveAnnouncementEmail: v,
	});
};

const saveEmailAddress = () => {
	os.inputText({
		title: i18n.ts.password,
		type: "password",
	}).then(({ canceled, result: password }) => {
		if (canceled) return;
		os.apiWithDialog("i/update-email", {
			password,
			email: emailAddress.value,
		});
	});
};

const emailNotification_mention = ref(
	me!.emailNotificationTypes.includes("mention"),
);
const emailNotification_reply = ref(
	me!.emailNotificationTypes.includes("reply"),
);
const emailNotification_quote = ref(
	me!.emailNotificationTypes.includes("quote"),
);
const emailNotification_follow = ref(
	me!.emailNotificationTypes.includes("follow"),
);
const emailNotification_receiveFollowRequest = ref(
	me!.emailNotificationTypes.includes("receiveFollowRequest"),
);
const emailNotification_groupInvited = ref(
	me!.emailNotificationTypes.includes("groupInvited"),
);

const saveNotificationSettings = () => {
	os.api("i/update", {
		emailNotificationTypes: [
			...[emailNotification_mention.value ? "mention" : null],
			...[emailNotification_reply.value ? "reply" : null],
			...[emailNotification_quote.value ? "quote" : null],
			...[emailNotification_follow.value ? "follow" : null],
			...[
				emailNotification_receiveFollowRequest.value
					? "receiveFollowRequest"
					: null,
			],
			...[emailNotification_groupInvited.value ? "groupInvited" : null],
		].filter((x) => x != null),
	});
};

watch(
	[
		emailNotification_mention,
		emailNotification_reply,
		emailNotification_quote,
		emailNotification_follow,
		emailNotification_receiveFollowRequest,
		emailNotification_groupInvited,
	],
	() => {
		saveNotificationSettings();
	},
);

onMounted(() => {
	watch(emailAddress, () => {
		saveEmailAddress();
	});
});

definePageMetadata({
	title: i18n.ts.email,
	icon: `${icon("ph-envelope-simple-open")}`,
});
</script>
