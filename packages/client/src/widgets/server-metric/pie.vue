<template>
	<svg class="hsalcinq" viewBox="0 0 1 1" preserveAspectRatio="none">
		<circle
			:r="r"
			cx="50%"
			cy="50%"
			fill="none"
			stroke-width="0.1"
			stroke="rgba(0, 0, 0, 0.05)"
		/>
		<circle
			:r="r"
			cx="50%"
			cy="50%"
			:stroke-dasharray="Math.PI * (r * 2)"
			:stroke-dashoffset="strokeDashoffset"
			fill="none"
			stroke-width="0.1"
			:stroke="color"
		/>
		<text x="50%" y="50%" dy="0.05" text-anchor="middle">
			{{ (value * 100).toFixed(1) }}%
		</text>
	</svg>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{
	value: number;
	reverse?: boolean;
}>();

const r = 0.45;

const color = computed(
	() =>
		`hsl(${
			props.reverse ? props.value * 180 : 180 - props.value * 180
		}, 80%, 70%)`,
);
const strokeDashoffset = computed(
	() => (1 - props.value) * (Math.PI * (r * 2)),
);
</script>

<style lang="scss" scoped>
.hsalcinq {
	display: block;
	block-size: 100%;

	> circle {
		transform-origin: center;
		transform: rotate(-90deg);
		transition: stroke-dashoffset 0.5s ease;
	}

	> text {
		font-size: 0.15px;
		fill: currentColor;
	}
}
</style>
