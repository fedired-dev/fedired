<template>
	<div v-if="visible" class="info" :class="{ warn, card }">
		<i v-if="warn" :class="iconify('ph-warning')"></i>
		<i v-else :class="iconify(icon ? `ph-${icon}` : 'ph-info')"></i>
		<slot></slot>
		<button
			v-if="closeable"
			v-tooltip="i18n.ts.close"
			class="_buttonIcon close"
			:aria-label="i18n.ts.close"
			@click.stop="close"
		>
			<i :class="iconify('ph-x')"></i>
		</button>
	</div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { i18n } from "@/i18n";
import iconify from "@/scripts/icon";

const visible = ref(true);

defineProps<{
	icon?: string;
	warn?: boolean;
	card?: boolean;
	closeable?: boolean;
}>();

const emit = defineEmits<{
	(ev: "close"): void;
}>();

function close() {
	visible.value = false;
	emit("close");
}
</script>

<style lang="scss" scoped>
.info {
	padding: 16px;
	font-size: 90%;
	background: var(--infoBg);
	color: var(--infoFg);
	border-radius: var(--radius);
	display: flex;
	align-items: center;
	gap: 0.4em;
	white-space: pre-line;

	&.warn {
		background: var(--infoWarnBg);
		color: var(--infoWarnFg);
	}

	&.card {
		display: block;
		background: var(--panel);
		color: var(--fg);
		padding: 48px;
		font-size: 1em;
		text-align: center;
		> i {
			display: block;
			font-size: 4em;
			margin: 0;
		}
		> :deep(*) {
			margin-inline: auto;
		}
		> :deep(:not(:last-child)) {
			margin-block-end: 20px;
		}
		> :deep(p) {
			max-inline-size: 30em;
		}
	}

	> i {
		margin-inline-end: 4px;
	}
	> .close {
		margin-inline-start: auto;
		float: inline-end;
	}
}
</style>
