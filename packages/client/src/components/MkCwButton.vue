<template>
	<button
		ref="el"
		class="_button"
		:class="{ showLess: modelValue, fade: !modelValue }"
		@click.stop="toggle"
	>
		<span
			>{{ modelValue ? i18n.ts._cw.hide : i18n.ts._cw.show }}
			<span v-if="!modelValue">{{ label }}</span>
		</span>
	</button>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { length } from "stringz";
import type { entities } from "fedired-js";
import { concat } from "@/scripts/array";
import { i18n } from "@/i18n";

const props = defineProps<{
	modelValue: boolean;
	note: entities.Note;
}>();

const emit = defineEmits<{
	(ev: "update:modelValue", v: boolean): void;
}>();

const el = ref<HTMLElement>();

const label = computed(() => {
	return concat([
		props.note.text
			? [i18n.t("_cw.chars", { count: length(props.note.text) })]
			: [],
		props.note.files && props.note.files.length !== 0
			? [i18n.t("_cw.files", { count: props.note.files.length })]
			: [],
		props.note.poll != null ? [i18n.ts.poll] : [],
		props.note.renote != null ? [i18n.ts.quoteAttached] : [],
	] as string[][]).join(", ");
});

const toggle = () => {
	emit("update:modelValue", !props.modelValue);
};

function focus() {
	el.value?.focus();
}

defineExpose({
	focus,
});
</script>

<style lang="scss" scoped>
._button {
	font-weight: 700;
	z-index: 5;
	> span {
		background: var(--cwBg) !important;
		color: var(--cwFg);
		transition:
			background 0.2s,
			color 0.2s;
		> span {
			font-weight: 500;
			&::before {
				content: "(";
			}
			&::after {
				content: ")";
			}
		}
	}
	&:hover > span,
	&:focus > span {
		background: var(--cwFg) !important;
		color: var(--cwBg) !important;
	}

	&.fade {
		display: block;
		position: absolute;
		inset-block-end: 0;
		inset-inline-start: 0;
		inline-size: 100%;
		> span {
			display: inline-block;
			background: var(--panel);
			padding-block: 0.4em;
			padding-inline: 1em;
			font-size: 0.8em;
			border-radius: 999px;
			box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
		}
		&:hover {
			> span {
				background: var(--panelHighlight);
			}
		}
	}
	&.showLess {
		inline-size: 100%;
		position: sticky;
		inset-block-end: calc(var(--stickyBottom) - 1em);
		padding: 20px;

		> span {
			display: inline-block;
			background: var(--panel);
			padding-block: 6px;
			padding-inline: 10px;
			font-size: 0.8em;
			border-radius: 999px;
			box-shadow: 0 0 7px 7px var(--bg);
		}
	}
}
</style>
