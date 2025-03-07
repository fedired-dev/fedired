<template>
	<div ref="root" :class="$style.root" :style="{ padding: margin + 'px' }">
		<div ref="content" :class="$style.content">
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { inject, onMounted, onUnmounted, ref } from "vue";
import { deviceKind } from "@/scripts/device-kind";
import { ui } from "@/config";

const props = withDefaults(
	defineProps<{
		contentMax?: number | null;
		marginMin?: number;
		marginMax?: number;
	}>(),
	{
		contentMax: null,
		marginMin: 12,
		marginMax: 24,
	},
);

let ro: ResizeObserver;
const root = ref<HTMLElement>();
const content = ref<HTMLElement>();
const margin = ref(0);
const shouldSpacerMin = inject("shouldSpacerMin", false);

const adjust = (rect: { width: number; height: number }) => {
	if (shouldSpacerMin || deviceKind === "smartphone") {
		margin.value = props.marginMin;
		return;
	}
	if (ui === "classic") {
		margin.value = 12;
		return;
	}

	if (
		rect.width > (props.contentMax ?? 0) ||
		(rect.width > 360 && window.innerWidth > 400)
	) {
		margin.value = props.marginMax;
	} else {
		margin.value = props.marginMin;
	}
};

onMounted(() => {
	ro = new ResizeObserver((entries) => {
		/* iOSが対応していない
		adjust({
			width: entries[0].borderBoxSize[0].inlineSize,
			height: entries[0].borderBoxSize[0].blockSize,
		});
		*/
		adjust({
			width: root.value!.offsetWidth,
			height: root.value!.offsetHeight,
		});
	});
	ro.observe(root.value!);

	if (props.contentMax) {
		content.value!.style.maxInlineSize = `${props.contentMax}px`;
	}
});

onUnmounted(() => {
	ro.disconnect();
});
</script>

<style lang="scss" module>
.root {
	box-sizing: border-box;
	inline-size: 100%;
}

.content {
	margin-block: 0;
	margin-inline: auto;
	padding-block-end: 80px;
}
</style>
