<template>
	<XContainer :draggable="true" @remove="() => $emit('remove')">
		<template #header
			><i :class="icon('ph-align-left')"></i>
			{{ i18n.ts._pages.blocks.textarea }}</template
		>

		<section class="ihymsbbe">
			<textarea v-model="value.text"></textarea>
		</section>
	</XContainer>
</template>

<script lang="ts" setup>
import XContainer from "../page-editor.container.vue";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

withDefaults(
	defineProps<{
		value: any;
	}>(),
	{
		value: {
			text: "",
		},
	},
);
</script>

<style lang="scss" scoped>
.ihymsbbe {
	> textarea {
		display: block;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		inline-size: 100%;
		min-inline-size: 100%;
		min-block-size: 150px;
		border: none;
		box-shadow: none;
		padding: 16px;
		background: transparent;
		color: var(--fg);
		font-size: 14px;
		box-sizing: border-box;
	}
}
</style>
