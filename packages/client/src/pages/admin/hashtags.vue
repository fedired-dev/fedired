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
				<FormTextarea v-model="hiddenTags" class="_formBlock">
					<span>{{ i18n.ts.hiddenTags }}</span>
					<template #caption>{{
						i18n.ts.hiddenTagsDescription
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
import * as os from "@/os";
import { updateInstanceCache } from "@/instance";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const hiddenTags = ref("");

async function init() {
	const meta = await os.api("admin/meta");
	hiddenTags.value = meta?.hiddenTags.join("\n");
}

function save() {
	os.apiWithDialog("admin/update-meta", {
		hiddenTags: hiddenTags.value.split("\n").map((h: string) => h.trim()) || [],
	}).then(() => {
		updateInstanceCache();
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.hiddenTags,
	icon: `${icon("ph-hash")}`,
});
</script>
