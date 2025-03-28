<template>
	<MkContainer :show-header="widgetProps.showHeader" class="mkw-userList">
		<template #header
			><i :class="icon('ph-user-list')"></i>
			{{ list ? list.name : i18n.ts._widgets.userList }}</template
		>
		<template #func="{ buttonStyleClass }"
			><button
				class="_button"
				:class="buttonStyleClass"
				@click="configure()"
			>
				<i :class="icon('ph-gear-six')"></i></button
		></template>

		<div class="wsdlkfj">
			<div v-if="widgetProps.listId == null" class="init">
				<MkButton primary @click="chooseList">{{
					i18n.ts._widgets._userList.chooseList
				}}</MkButton>
			</div>
			<MkLoading v-else-if="fetching" />
			<div v-else class="users">
				<MkAvatars :user-ids="users" class="userAvatars" />
			</div>
		</div>
	</MkContainer>
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
import MkContainer from "@/components/MkContainer.vue";
import MkAvatars from "@/components/MkAvatars.vue";
import * as os from "@/os";
import { useInterval } from "@/scripts/use-interval";
import { i18n } from "@/i18n";
import MkButton from "@/components/MkButton.vue";
import icon from "@/scripts/icon";

const name = "userList";
const widgetPropsDef = {
	showHeader: {
		type: "boolean" as const,
		default: true,
	},
	listId: {
		type: "string" as const,
		default: null,
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
const list = ref();
const users = ref([]);
const fetching = ref(true);
async function chooseList() {
	const lists = await os.api("users/lists/list");
	const { canceled, result: list } = await os.select({
		title: i18n.ts.selectList,
		items: lists.map((x) => ({
			value: x,
			text: x.name,
		})),
		default: widgetProps.listId,
	});
	if (canceled) return;
	widgetProps.listId = list.id;
	save();
	fetch();
}
const fetch = () => {
	if (widgetProps.listId == null) {
		fetching.value = false;
		return;
	}
	os.api("users/lists/show", {
		listId: widgetProps.listId,
	}).then((_list) => {
		list.value = _list;
		os.api("users/show", {
			userIds: list.value.userIds,
		}).then((_users) => {
			users.value = list.value.userIds;
			fetching.value = false;
		});
	});
};
useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});
defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.wsdlkfj {
	> .init {
		padding: 16px;
	}
}
</style>
