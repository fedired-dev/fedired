<template>
	<div
		class="mkw-onlineUsers"
		:class="{
			_panel: !widgetProps.transparent,
			pad: !widgetProps.transparent,
		}"
	>
		<I18n
			v-if="onlineUsersCount"
			:src="i18n.ts.onlineUsersCount"
			text-tag="span"
			class="text"
		>
			<template #n
				><b>{{ onlineUsersCount }}</b></template
			>
		</I18n>
	</div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type {
	WidgetComponentExpose,
	WidgetComponentProps,
	WidgetComponentEmits,
} from "./widget";
import { useWidgetPropsManager } from "./widget";
import type { GetFormResultType } from "@/scripts/form";
import * as os from "@/os";
import { useInterval } from "@/scripts/use-interval";
import { i18n } from "@/i18n";

const name = "onlineUsers";

const widgetPropsDef = {
	transparent: {
		type: "boolean" as const,
		default: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(
	name,
	widgetPropsDef,
	props,
	emit,
);

const onlineUsersCount = ref(0);

const tick = () => {
	os.api("get-online-users-count").then((res) => {
		onlineUsersCount.value = res.count;
	});
};

useInterval(tick, 1000 * 15, {
	immediate: true,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.mkw-onlineUsers {
	text-align: center;

	&.pad {
		padding-block: 16px;
		padding-inline: 0;
	}

	> .text {
		::v-deep(b) {
			color: var(--badge);
		}

		::v-deep(span) {
			opacity: 0.7;
		}
	}
}
</style>
