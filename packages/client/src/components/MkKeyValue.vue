<template>
	<div class="alqyeyti" :class="{ oneline }">
		<div class="key">
			<slot name="key"></slot>
		</div>
		<div class="value">
			<slot name="value"></slot>
			<button
				v-if="copy"
				v-tooltip="i18n.ts.copy"
				class="_textButton"
				style="margin-inline-start: 0.5em"
				@click="copy_"
			>
				<i :class="icon('ph-clipboard-text', false)"></i>
			</button>
		</div>
	</div>
</template>

<script lang="ts" setup>
import copyToClipboard from "@/scripts/copy-to-clipboard";
import * as os from "@/os";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const props = withDefaults(
	defineProps<{
		copy?: string | null;
		oneline?: boolean;
	}>(),
	{
		copy: null,
		oneline: false,
	},
);

const copy_ = () => {
	copyToClipboard(props.copy);
	os.success();
};
</script>

<style lang="scss" scoped>
.alqyeyti {
	> .key {
		font-size: 0.85em;
		padding-block-start: 0;
		padding-inline-end: 0;
		padding-block-end: 0.25em;
		padding-inline-start: 0;
		opacity: 0.75;
	}

	&.oneline {
		display: flex;

		> .key {
			inline-size: 30%;
			font-size: 1em;
			padding-block-start: 0;
			padding-inline-end: 8px;
			padding-block-end: 0;
			padding-inline-start: 0;
		}

		> .value {
			inline-size: 70%;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}
</style>
