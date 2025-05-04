<template>
	<MkModal
		ref="modal"
		:z-priority="'middle'"
		@click="modal!.close()"
		@closed="emit('closed')"
	>
		<div :class="$style.root">
			<div :class="$style.title">
				<MkSparkle>{{ i18n.ts.fediredUpdated }}</MkSparkle>
			</div>
			<div :class="$style.version"> {{ version }} </div>
			<MkButton
				:class="$style.gotIt"
				primary
				full
				@click="modal!.close()"
				>{{ i18n.ts.gotIt }}</MkButton
			>
			<a :href="releaseUrl" target="_blank" rel="noopener noreferrer">
				<MkButton :class="$style.releaseButton" secondary full>
					{{ i18n.ts.viewRelease }}
				</MkButton>
			</a>
		</div>
	</MkModal>
</template>

<script lang="ts" setup>
import { shallowRef } from "vue";
import MkModal from "@/components/MkModal.vue";
import MkSparkle from "@/components/MkSparkle.vue";
import MkButton from "@/components/MkButton.vue";
import { version } from "@/config";
import { i18n } from "@/i18n";

const modal = shallowRef<InstanceType<typeof MkModal>>();
const releaseUrl = 'https://github.com/fedired-dev/fedired/releases/latest'; 
</script>

<style lang="scss" module>
.root {
	margin: auto;
	position: relative;
	padding: 32px;
	min-inline-size: 320px;
	max-inline-size: 480px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);
}

.title {
	font-weight: bold;
}

.version {
	margin-block: 1em;
	margin-inline: 0;
}

.gotIt {
	margin-block-start: 8px;
	margin-inline-end: 0;
	margin-block-end: 0;
	margin-inline-start: 0;
}

.releaseButton {
	margin-top: 8px;
}
</style>
