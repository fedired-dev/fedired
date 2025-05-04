<template>
	<Mfm
		:class="$style.root"
		:text="user.name || user.username"
		:plain="true"
		:nowrap="nowrap"
		:custom-emojis="user.emojis"
	/>
</template>

<script lang="ts" setup>
import type { entities } from "fedired-js";

withDefaults(
	defineProps<{
		user: entities.User;
		nowrap?: boolean;
	}>(),
	{
		nowrap: true,
	},
);
</script>

<style lang="scss" module>
.root {
	unicode-bidi: isolate;
}
</style>
