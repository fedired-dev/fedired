<template>
	<MkModal
		ref="dialogEl"
		:prefer-type="'dialog'"
		:z-priority="'low'"
		@click="cancel"
		@close="cancel"
		@closed="emit('closed')"
	>
		<div :class="$style.root" class="_gaps_m">
			<I18n :src="i18n.ts._2fa.step1" tag="div">
				<template #a>
					<a
						href="https://authpass.app/"
						rel="noopener"
						target="_blank"
						class="_link"
						>AuthPass</a
					>
				</template>
				<template #b>
					<a
						href="https://support.google.com/accounts/answer/1066447"
						rel="noopener"
						target="_blank"
						class="_link"
						>Google Authenticator</a
					>
				</template>
			</I18n>
			<div>
				{{ i18n.ts._2fa.step2 }}<br />
				{{ i18n.ts._2fa.step2Click }}
			</div>
			<a :href="twoFactorData.url"
				><img :class="$style.qr" :src="twoFactorData.qr"
			/></a>
			<div style="max-inline-size: 610px">
				<MkKeyValue :copy="twoFactorData.url">
					<template #key>{{ i18n.ts._2fa.step2Url }}</template>
					<template #value>{{ twoFactorData.url }}</template>
				</MkKeyValue>
			</div>
			<div class="_flexList">
				<MkButton primary @click="ok">{{ i18n.ts.next }}</MkButton>
				<MkButton @click="cancel">{{ i18n.ts.cancel }}</MkButton>
			</div>
		</div>
	</MkModal>
</template>

<script lang="ts" setup>
import MkButton from "@/components/MkButton.vue";
import MkModal from "@/components/MkModal.vue";
import MkKeyValue from "@/components/MkKeyValue.vue";
import { i18n } from "@/i18n";

defineProps<{
	twoFactorData: {
		qr: string;
		url: string;
	};
}>();

const emit = defineEmits<{
	(ev: "ok"): void;
	(ev: "cancel"): void;
	(ev: "closed"): void;
}>();

const cancel = () => {
	emit("cancel");
	emit("closed");
};

const ok = () => {
	emit("ok");
	emit("closed");
};
</script>

<style lang="scss" module>
.root {
	position: relative;
	margin: auto;
	padding: 32px;
	min-inline-size: 320px;
	max-inline-size: calc(100svw - 64px);
	box-sizing: border-box;
	background: var(--panel);
	border-radius: var(--radius);
}

.qr {
	inline-size: 20em;
	max-inline-size: 100%;
	border-radius: 10px;
	border: 3px solid var(--accent);
}
</style>
