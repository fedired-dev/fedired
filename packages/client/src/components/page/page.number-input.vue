<template>
	<div>
		<MkInput
			class="kudkigyw"
			:model-value="value"
			type="number"
			@update:modelValue="updateValue($event)"
		>
			<template #label>{{ hpml.interpolate(block.text) }}</template>
		</MkInput>
	</div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { computed, defineComponent } from "vue";
import MkInput from "../form/input.vue";
import type { Hpml } from "@/scripts/hpml/evaluator";
import type { NumberInputVarBlock } from "@/scripts/hpml/block";

export default defineComponent({
	components: {
		MkInput,
	},
	props: {
		block: {
			type: Object as PropType<NumberInputVarBlock>,
			required: true,
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true,
		},
	},
	setup(props, ctx) {
		const value = computed(() => {
			return props.hpml.vars.value[props.block.name];
		});

		function updateValue(newValue) {
			props.hpml.updatePageVar(props.block.name, newValue);
			props.hpml.eval();
		}

		return {
			value,
			updateValue,
		};
	},
});
</script>

<style lang="scss" scoped>
.kudkigyw {
	display: inline-block;
	min-inline-size: 300px;
	max-inline-size: 450px;
	margin-block: 8px;
	margin-inline: 0;
}
</style>
