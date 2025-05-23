<template>
	<MkContainer
		:style="`block-size: ${widgetProps.height}px;`"
		:show-header="widgetProps.showHeader"
		:scrollable="true"
		class="mkw-notifications"
	>
		<template #header
			><i :class="icon('ph-bell')"></i
			>{{ i18n.ts.notifications }}</template
		>
		<template #func
			><button
				class="_button"
				:aria-label="i18n.ts.markAllAsRead"
				@click="os.apiWithDialog('notifications/mark-all-as-read')"
			>
				<i :class="icon('ph-check')"></i></button
			><button
				class="_button"
				:aria-label="i18n.ts.notificationSetting"
				@click="configureNotification()"
			>
				<i :class="icon('ph-gear-six')"></i></button
		></template>
		<div>
			<XNotifications :include-types="widgetProps.includingTypes" />
		</div>
	</MkContainer>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from "vue";
import type {
	WidgetComponentExpose,
	WidgetComponentProps,
	WidgetComponentEmits,
} from "./widget";
import { useWidgetPropsManager } from "./widget";
import type { GetFormResultType } from "@/scripts/form";
import MkContainer from "@/components/MkContainer.vue";
import XNotifications from "@/components/MkNotifications.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const name = "notifications";

const widgetPropsDef = {
	showHeader: {
		type: "boolean" as const,
		default: true,
	},
	height: {
		type: "number" as const,
		default: 300,
	},
	includingTypes: {
		type: "array" as const,
		hidden: true,
		default: null,
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

const configureNotification = () => {
	os.popup(
		defineAsyncComponent(
			() => import("@/components/MkNotificationSettingWindow.vue"),
		),
		{
			includingTypes: widgetProps.includingTypes,
		},
		{
			done: async (res) => {
				const { includingTypes } = res;
				widgetProps.includingTypes = includingTypes;
				save();
			},
		},
		"closed",
	);
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
