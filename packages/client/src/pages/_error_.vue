<template>
	<MkLoading v-if="!loaded" />
	<transition :name="defaultStore.state.animation ? 'zoom' : ''" appear>
		<div v-show="loaded" class="mjndxjch">
			<img
				src="/static-assets/badges/error.webp"
				class="_ghost"
				alt="Error"
			/>
			<p>
				<b
					><i :class="icon('ph-warning')"></i>
					{{ i18n.ts.pageLoadError }}</b
				>
			</p>
			<p v-if="meta && version === meta.version">
				{{ i18n.ts.pageLoadErrorDescription }}
			</p>
			<p v-else-if="serverIsDead">{{ i18n.ts.serverIsDead }}</p>
			<template v-else>
				<p>{{ i18n.ts.newVersionOfClientAvailable }}</p>
				<p>{{ i18n.ts.youShouldUpgradeClient }}</p>
				<MkButton class="button primary" @click="reload">{{
					i18n.ts.reload
				}}</MkButton>
			</template>
			<p>
				<MkA to="/docs/general/troubleshooting" class="_link">{{
					i18n.ts.troubleshooting
				}}</MkA>
			</p>
			<p v-if="error" class="error">ERROR: {{ error }}</p>
		</div>
	</transition>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import type { entities } from "fedired-js";
import MkButton from "@/components/MkButton.vue";
import { version } from "@/config";
import * as os from "@/os";
import { unisonReload } from "@/scripts/unison-reload";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { defaultStore } from "@/store";
import icon from "@/scripts/icon";

withDefaults(
	defineProps<{
		error?: Error;
	}>(),
	{},
);

const loaded = ref(false);
const serverIsDead = ref(false);
const meta = ref<entities.LiteInstanceMetadata | null>(null);

os.api("meta", {
	detail: false,
}).then(
	(res) => {
		loaded.value = true;
		serverIsDead.value = false;
		meta.value = res;
		localStorage.setItem("v", res.version);
	},
	() => {
		loaded.value = true;
		serverIsDead.value = true;
	},
);

function reload() {
	unisonReload();
}

definePageMetadata({
	title: i18n.ts.error,
	icon: `${icon("ph-warning")}`,
});
</script>

<style lang="scss" scoped>
.mjndxjch {
	padding: 32px;
	text-align: center;

	> p {
		margin-block-start: 0;
		margin-inline-end: 0;
		margin-block-end: 12px;
		margin-inline-start: 0;
	}

	> .button {
		margin-block: 8px;
		margin-inline: auto;
	}

	> img {
		vertical-align: bottom;
		block-size: 128px;
		margin-block-end: 24px;
		border-radius: 16px;
	}

	> .error {
		opacity: 0.7;
	}
}
</style>
