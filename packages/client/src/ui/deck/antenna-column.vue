<template>
	<XColumn
		:menu="menu"
		:column="column"
		:is-stacked="isStacked"
		@parent-focus="($event) => emit('parent-focus', $event)"
	>
		<template #header>
			<i :class="icon('ph-flying-saucer')"></i
			><span style="margin-inline-start: 8px">{{ column.name }}</span>
		</template>

		<XTimeline
			v-if="column.antennaId"
			ref="timeline"
			src="antenna"
			:antenna="column.antennaId"
			@after="() => emit('loaded')"
		/>
	</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import XColumn from "./column.vue";
import type { Column } from "./deck-store";
import { updateColumn } from "./deck-store";
import XTimeline from "@/components/MkTimeline.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: "loaded"): void;
	(ev: "parent-focus", direction: "up" | "down" | "left" | "right"): void;
}>();

const timeline = ref<InstanceType<typeof XTimeline>>();

onMounted(() => {
	if (props.column.antennaId == null) {
		setAntenna();
	}
});

async function setAntenna() {
	const antennas = await os.api("antennas/list");
	const { canceled, result: antenna } = await os.select({
		title: i18n.ts.selectAntenna,
		items: antennas.map((x) => ({
			value: x,
			text: x.name,
		})),
		default: props.column.antennaId,
	});
	if (canceled) return;
	updateColumn(props.column.id, {
		name: antenna.name,
		antennaId: antenna.id,
	});
}

const menu = [
	{
		icon: `${icon("ph-pencil")}`,
		text: i18n.ts.selectAntenna,
		action: setAntenna,
	},
];

/*
function focus() {
	timeline.focus();
}

defineExpose({
	focus,
});
*/
</script>

<style lang="scss" scoped></style>
