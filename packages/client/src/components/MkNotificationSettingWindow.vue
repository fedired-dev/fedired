<template>
	<XModalWindow
		ref="dialog"
		:width="400"
		:height="450"
		:with-ok-button="true"
		:ok-button-disabled="false"
		@ok="ok()"
		@close="dialog!.close()"
		@closed="emit('closed')"
	>
		<template #header>{{ i18n.ts.notificationSetting }}</template>
		<div class="_monolithic_">
			<div v-if="showGlobalToggle" class="_section">
				<MkSwitch v-model="useGlobalSetting">
					{{ i18n.ts.useGlobalSetting }}
					<template #caption>{{
						i18n.ts.useGlobalSettingDesc
					}}</template>
				</MkSwitch>
			</div>
			<div v-if="!useGlobalSetting" class="_section">
				<MkInfo>{{ i18n.ts.notificationSettingDesc }}</MkInfo>
				<MkButton inline @click="disableAll">{{
					i18n.ts.disableAll
				}}</MkButton>
				<MkButton inline @click="enableAll">{{
					i18n.ts.enableAll
				}}</MkButton>
				<MkSwitch
					v-for="ntype in notificationTypes"
					:key="ntype"
					v-model="typesMap[ntype]"
					>{{ i18n.t(`_notification._types.${ntype}`) }}</MkSwitch
				>
			</div>
		</div>
	</XModalWindow>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";

import { notificationTypes } from "fedired-js";
import MkSwitch from "./form/switch.vue";
import MkInfo from "./MkInfo.vue";
import MkButton from "./MkButton.vue";
import XModalWindow from "@/components/MkModalWindow.vue";
import { i18n } from "@/i18n";

const emit = defineEmits<{
	(ev: "done", v: { includingTypes: string[] | null }): void;
	(ev: "closed"): void;
}>();

const props = withDefaults(
	defineProps<{
		includingTypes?: (typeof notificationTypes)[number][] | null;
		showGlobalToggle?: boolean;
	}>(),
	{
		includingTypes: () => [],
		showGlobalToggle: true,
	},
);

const includingTypes = computed(() => props.includingTypes || []);

const dialog = ref<InstanceType<typeof XModalWindow>>();

const typesMap = ref({} as Record<(typeof notificationTypes)[number], boolean>);
const useGlobalSetting = ref(
	(includingTypes.value === null || includingTypes.value.length === 0) &&
		props.showGlobalToggle,
);

for (const ntype of notificationTypes) {
	typesMap.value[ntype] = includingTypes.value.includes(ntype);
}

function ok() {
	if (useGlobalSetting.value) {
		emit("done", { includingTypes: null });
	} else {
		emit("done", {
			includingTypes: (
				Object.keys(typesMap.value) as (typeof notificationTypes)[number][]
			).filter((type) => typesMap.value[type]),
		});
	}

	dialog.value!.close();
}

function disableAll() {
	for (const type in typesMap.value) {
		typesMap.value[type as (typeof notificationTypes)[number]] = false;
	}
}

function enableAll() {
	for (const type in typesMap.value) {
		typesMap.value[type as (typeof notificationTypes)[number]] = true;
	}
}
</script>
