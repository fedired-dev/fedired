<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
			<MkTab v-model="tab" class="_formBlock">
				<option value="block">{{ i18n.ts.blockedInstances }}</option>
				<option value="silence">{{ i18n.ts.silencedInstances }}</option>
			</MkTab>
			<FormSuspense :p="init">
				<FormTextarea
					v-if="tab === 'block'"
					v-model="blockedHosts"
					class="_formBlock"
				>
					<span>{{ i18n.ts.blockedInstances }}</span>
					<template #caption>{{
						i18n.ts.blockedInstancesDescription
					}}</template>
				</FormTextarea>
				<FormTextarea
					v-else-if="tab === 'silence'"
					v-model="silencedHosts"
					class="_formBlock"
				>
					<span>{{ i18n.ts.silencedInstances }}</span>
					<template #caption>{{
						i18n.ts.silencedInstancesDescription
					}}</template>
				</FormTextarea>

				<FormButton primary class="_formBlock" @click="save"
					><i :class="icon('ph-floppy-disk-back')"></i>
					{{ i18n.ts.save }}</FormButton
				>
			</FormSuspense>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";

import FormButton from "@/components/MkButton.vue";
import FormTextarea from "@/components/form/textarea.vue";
import FormSuspense from "@/components/form/suspense.vue";
import MkTab from "@/components/MkTab.vue";
import * as os from "@/os";
import { updateInstanceCache } from "@/instance";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const blockedHosts = ref("");
const silencedHosts = ref("");
const tab = ref("block");

async function init() {
	const meta = await os.api("admin/meta");
	if (meta) {
		blockedHosts.value = meta.blockedHosts.join("\n");
		silencedHosts.value = meta.silencedHosts.join("\n");
	}
}

function save() {
	os.apiWithDialog("admin/update-meta", {
		blockedHosts: blockedHosts.value.split("\n").map((h) => h.trim()) || [],
		silencedHosts: silencedHosts.value.split("\n").map((h) => h.trim()) || [],
	}).then(() => {
		updateInstanceCache();
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.instanceBlocking,
	icon: `${icon("ph-prohibit")}`,
});
</script>
