<template>
	<MkContainer
		:show-header="widgetProps.showHeader"
		class="mkw-rss"
		:scrollable="true"
		:style="`block-size: ${widgetProps.height}px;`"
	>
		<template #header><i :class="icon('ph-rss')"></i>RSS</template>
		<template #func
			><button class="_button" @click="configure">
				<i :class="icon('ph-gear-six')"></i></button
		></template>

		<div class="ekmkgxbj">
			<MkLoading v-if="fetching" />
			<div v-else class="feed">
				<a
					v-for="item in items"
					class="item"
					:href="item.link"
					rel="nofollow noopener"
					target="_blank"
					:title="item.title"
					>{{ item.title }}</a
				>
			</div>
		</div>
	</MkContainer>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import type {
	WidgetComponentExpose,
	WidgetComponentProps,
	WidgetComponentEmits,
} from "./widget";
import { useWidgetPropsManager } from "./widget";
import type { GetFormResultType } from "@/scripts/form";
import MkContainer from "@/components/MkContainer.vue";
import { useInterval } from "@/scripts/use-interval";
import icon from "@/scripts/icon";

const name = "rss";

const widgetPropsDef = {
	url: {
		type: "string" as const,
		default: "https://fedired.com/@fedired.rss?noteintitle",
	},
	height: {
		type: "number" as const,
		default: 300,
	},
	showHeader: {
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

const items = ref([]);
const fetching = ref(true);

const tick = () => {
	fetch(`/api/fetch-rss?url=${widgetProps.url}`, {}).then((res) => {
		res.json().then((feed) => {
			items.value = feed.items;
			fetching.value = false;
		});
	});
};

watch(() => widgetProps.url, tick);

useInterval(tick, 60000, {
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
.ekmkgxbj {
	> .feed {
		padding: 0;
		font-size: 0.9em;

		> .item {
			display: block;
			padding-block: 8px;
			padding-inline: 16px;
			color: var(--fg);
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;

			&:nth-child(even) {
				background: rgba(#000, 0.05);
			}
		}
	}
}
</style>
