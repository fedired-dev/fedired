<template>
	<component
		:is="self ? 'MkA' : 'a'"
		ref="el"
		class="xlcxczvw _link"
		:[attr]="self ? url.substring(local.length) : url"
		:rel="rel"
		:target="target"
		:title="url"
		@click.stop
	>
		<slot></slot>
		<i
			v-if="target === '_blank'"
			:class="icon('ph-arrow-square-out icon')"
		></i>
	</component>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from "vue";
import { url as local } from "@/config";
import { useTooltip } from "@/scripts/use-tooltip";
import * as os from "@/os";
import icon from "@/scripts/icon";

const props = withDefaults(
	defineProps<{
		url: string;
		rel?: null | string;
	}>(),
	{},
);

const self = props.url.startsWith(local);
const attr = self ? "to" : "href";
const target = self ? null : "_blank";

const el = ref();

useTooltip(el, (showing) => {
	os.popup(
		defineAsyncComponent(() => import("@/components/MkUrlPreviewPopup.vue")),
		{
			showing,
			url: props.url,
			source: el.value,
		},
		{},
		"closed",
	);
});
</script>

<style lang="scss" scoped>
.xlcxczvw {
	word-break: break-all;

	> .icon {
		padding-inline-start: 2px;
		font-size: 0.9em;
	}
}
</style>
