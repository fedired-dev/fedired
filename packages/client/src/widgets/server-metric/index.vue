<template>
	<MkContainer
		:show-header="widgetProps.showHeader"
		:naked="widgetProps.transparent"
	>
		<template #header
			><i :class="icon('ph-hard-drives')"></i
			>{{ i18n.ts._widgets.serverMetric }}</template
		>
		<template #func
			><button class="_button" @click="toggleView()">
				<i :class="icon('ph-sort-ascending')"></i></button
		></template>

		<div v-if="!enableServerMachineStats" class="mkw-serverMetric">
			<h3 style="text-align: center; color: var(--error)">
				{{ i18n.ts.disabled }}
			</h3>
		</div>
		<div
			v-else-if="meta && enableServerMachineStats"
			class="mkw-serverMetric"
		>
			<XCpuMemory
				v-if="widgetProps.view === 0"
				:connection="connection"
				:meta="meta"
			/>
			<XCpu
				v-else-if="widgetProps.view === 1"
				:connection="connection"
				:meta="meta"
			/>
			<XMemory
				v-else-if="widgetProps.view === 2"
				:connection="connection"
				:meta="meta"
			/>
			<XDisk
				v-else-if="widgetProps.view === 3"
				:connection="connection"
				:meta="meta"
			/>
		</div>
	</MkContainer>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from "vue";
import type {
	WidgetComponentEmits,
	WidgetComponentExpose,
	WidgetComponentProps,
} from "../widget";
import { useWidgetPropsManager } from "../widget";
import XCpuMemory from "./cpu-mem.vue";
import XCpu from "./cpu.vue";
import XMemory from "./mem.vue";
import XDisk from "./disk.vue";
import MkContainer from "@/components/MkContainer.vue";
import type { GetFormResultType } from "@/scripts/form";
import * as os from "@/os";
import { useStream } from "@/stream";
import { i18n } from "@/i18n";
import { getInstanceInfo } from "@/instance";
import icon from "@/scripts/icon";

const name = "serverMetric";

const widgetPropsDef = {
	showHeader: {
		type: "boolean" as const,
		default: true,
	},
	transparent: {
		type: "boolean" as const,
		default: false,
	},
	view: {
		type: "number" as const,
		default: 0,
		hidden: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(
	name,
	widgetPropsDef,
	props,
	emit,
);

const meta = ref(null);
const { enableServerMachineStats } = getInstanceInfo();

os.apiGet("server-info", {}).then((res) => {
	meta.value = res;
});

const toggleView = () => {
	widgetProps.view = (widgetProps.view + 1) % 4;
	save();
};

const stream = useStream();
const connection = stream.useChannel("serverStats");
onUnmounted(() => {
	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
