<template>
	<button
		class="hdcaacmi _button"
		:class="{ wait, active: isFollowing, full }"
		:disabled="wait"
		@click="onClick"
	>
		<template v-if="!wait">
			<template v-if="isFollowing">
				<span v-if="full">{{ i18n.ts.unfollow }}</span
				><i :class="icon('ph-minus')"></i>
			</template>
			<template v-else>
				<span v-if="full">{{ i18n.ts.follow }}</span
				><i :class="icon('ph-plus')"></i>
			</template>
		</template>
		<template v-else>
			<span v-if="full">{{ i18n.ts.processing }}</span
			><i :class="icon('ph-circle-notch fa-pulse ph-fw')"></i>
		</template>
	</button>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { entities } from "fedired-js";
import * as os from "@/os";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const props = withDefaults(
	defineProps<{
		channel: entities.Channel;
		full?: boolean;
	}>(),
	{
		full: false,
	},
);

const isFollowing = ref<boolean>(props.channel.isFollowing ?? false);
const wait = ref(false);

async function onClick() {
	wait.value = true;

	try {
		if (isFollowing.value) {
			await os.api("channels/unfollow", {
				channelId: props.channel.id,
			});
			isFollowing.value = false;
		} else {
			await os.api("channels/follow", {
				channelId: props.channel.id,
			});
			isFollowing.value = true;
		}
	} catch (err) {
		console.error(err);
	} finally {
		wait.value = false;
	}
}
</script>

<style lang="scss" scoped>
.hdcaacmi {
	position: relative;
	display: inline-block;
	font-weight: bold;
	color: var(--accent);
	background: transparent;
	border: solid 1px var(--accent);
	padding: 0;
	block-size: 31px;
	font-size: 16px;
	border-radius: 32px;
	background: #fff;

	&.full {
		padding-block-start: 0;
		padding-inline-end: 8px;
		padding-block-end: 0;
		padding-inline-start: 12px;
		font-size: 14px;
	}

	&:not(.full) {
		inline-size: 31px;
	}

	&:focus-visible {
		&:after {
			content: "";
			pointer-events: none;
			position: absolute;
			inset: -5px;
			border: 2px solid var(--focus);
			border-radius: 32px;
		}
	}

	&:hover {
		//background: mix($primary, #fff, 20);
	}

	&:active {
		//background: mix($primary, #fff, 40);
	}

	&.active {
		color: #fff;
		background: var(--accent);

		&:hover {
			background: var(--accentLighten);
			border-color: var(--accentLighten);
		}

		&:active {
			background: var(--accentDarken);
			border-color: var(--accentDarken);
		}
	}

	&.wait {
		cursor: wait !important;
		opacity: 0.7;
	}

	> span {
		margin-inline-end: 6px;
	}
}
</style>
