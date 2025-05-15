<!--
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Copyright (c) 2024 Fedired
 -->

<template>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
			/>
		</template>
		<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
			<FormSuspense :p="init">
				<div class="_formRoot">
					<FormSection>
						<template #label>{{ i18n.ts.firebaseSettings }}</template>
						<template #caption>{{ i18n.ts.firebaseSettingsDescription }}</template>

						<FormSwitch v-model="enableFirebase" class="_formBlock">
							<template #label>{{ i18n.ts.enableFirebase }}</template>
							<template #caption>{{ i18n.ts.enableFirebaseDescription }}</template>
						</FormSwitch>

						<FormTextarea
							v-model="firebaseConfig"
							class="_formBlock"
							:disabled="!enableFirebase"
						>
							<template #label>{{ i18n.ts.firebaseConfig }}</template>
							<template #caption>{{ i18n.ts.firebaseConfigDescription }}</template>
						</FormTextarea>

						<FormButton
							class="_formBlock"
							:disabled="!enableFirebase"
							@click="testFirebase"
						>
							<template #label>{{ i18n.ts.testFirebase }}</template>
						</FormButton>
					</FormSection>
				</div>
			</FormSuspense>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import FormSwitch from "@/components/form/switch.vue";
import FormTextarea from "@/components/form/textarea.vue";
import FormButton from "@/components/MkButton.vue";
import FormSection from "@/components/form/section.vue";
import FormSuspense from "@/components/form/suspense.vue";
import * as os from "@/os";
import { updateInstanceCache } from "@/instance";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const enableFirebase = ref(false);
const firebaseConfig = ref("");

async function init() {
	const meta = await os.api("admin/meta");
	enableFirebase.value = meta?.firebaseConfig != null;
	firebaseConfig.value = meta?.firebaseConfig ? JSON.stringify(meta.firebaseConfig, null, 2) : "";
}

async function save() {
	let parsedConfig = null;
	if (enableFirebase.value && firebaseConfig.value) {
		try {
			parsedConfig = JSON.parse(firebaseConfig.value);
		} catch (e) {
			os.alert({
				type: "error",
				text: i18n.ts.invalidFirebaseConfig,
			});
			return;
		}
	}

	os.apiWithDialog("admin/update-meta", {
		firebaseConfig: parsedConfig,
	}).then(() => {
		updateInstanceCache();
	});
}

async function testFirebase() {
	let parsedConfig;
	try {
		parsedConfig = JSON.parse(firebaseConfig.value);
	} catch (e) {
		os.alert({
			type: "error",
			text: i18n.ts.invalidFirebaseConfig,
		});
		return;
	}

	os.apiWithDialog("admin/test-firebase", {
		config: parsedConfig,
	});
}

const headerActions = computed(() => [
	{
		asFullButton: true,
		icon: `${icon("ph-check")}`,
		text: i18n.ts.save,
		handler: save,
	},
]);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.firebaseSettings,
	icon: `${icon("ph-bell-ringing")}`,
});
</script> 