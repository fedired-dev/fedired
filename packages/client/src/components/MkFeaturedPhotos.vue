<template>
	<div
		v-if="meta"
		class="xfbouadm"
		:style="{ backgroundImage: `url(${meta.backgroundImageUrl})` }"
	></div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { entities } from "fedired-js";
import * as os from "@/os";

const meta = ref<entities.DetailedInstanceMetadata>();

os.api("meta", { detail: true }).then((gotMeta) => {
	meta.value = gotMeta;
});
</script>

<style lang="scss" scoped>
.xfbouadm {
	background-position: center;
	background-size: cover;
}
</style>
