<template>
	<div class="ysrxegms">
		<canvas ref="canvas" :width="block.width" :height="block.height" />
	</div>
</template>

<script lang="ts">
import type { PropType, Ref } from "vue";
import { defineComponent, onMounted, ref } from "vue";
import type { CanvasBlock } from "@/scripts/hpml/block";
import type { Hpml } from "@/scripts/hpml/evaluator";

export default defineComponent({
	props: {
		block: {
			type: Object as PropType<CanvasBlock>,
			required: true,
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true,
		},
	},
	setup(props, ctx) {
		const canvas: Ref<any> = ref(null);

		onMounted(() => {
			props.hpml.registerCanvas(props.block.name, canvas.value);
		});

		return {
			canvas,
		};
	},
});
</script>

<style lang="scss" scoped>
.ysrxegms {
	display: inline-block;
	vertical-align: bottom;
	overflow: auto;
	max-inline-size: 100%;

	> canvas {
		display: block;
	}
}
</style>
