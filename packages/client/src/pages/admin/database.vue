<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="800" :margin-min="16" :margin-max="32">
			<FormSuspense
				v-slot="{ result: database }"
				:p="databasePromiseFactory"
			>
				<MkKeyValue
					v-for="table in database"
					:key="table[0]"
					oneline
					style="margin: 1em 0"
				>
					<template #key>{{ table[0] }}</template>
					<template #value
						>{{ bytes(table[1].size) }} ({{
							number(table[1].count)
						}}
						recs)</template
					>
				</MkKeyValue>
			</FormSuspense>
		</MkSpacer></MkStickyContainer
	>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import FormSuspense from "@/components/form/suspense.vue";
import FormButton from "@/components/MkButton.vue";
import MkKeyValue from "@/components/MkKeyValue.vue";
import * as os from "@/os";
import bytes from "@/filters/bytes";
import number from "@/filters/number";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const databasePromiseFactory = () =>
	os
		.api("admin/get-table-stats")
		.then((res) => Object.entries(res).sort((a, b) => b[1].size - a[1].size));

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.database,
	icon: `${icon("ph-database")}`,
});
</script>
