<template>
	<button
		v-if="!hideMenu"
		v-tooltip="i18n.ts.menu"
		class="menu _button"
		@click.stop="menu"
	>
		<i :class="icon('ph-dots-three-outline ph-dir')"></i>
	</button>
	<button
		v-if="!hideFollowButton && isSignedIn(me) && me.id != user.id"
		v-tooltip="full ? null : `${state} ${user.name || user.username}`"
		class="kpoogebi _button follow-button"
		:class="{
			wait,
			active: isFollowing || hasPendingFollowRequestFromYou,
			full,
			large,
			blocking: isBlocking,
		}"
		:disabled="wait"
		:aria-label="`${state} ${user.name || user.username}`"
		@click.stop="onClick"
	>
		<template v-if="!wait">
			<template v-if="isBlocking">
				<span>{{ (state = i18n.ts.blocked) }}</span
				><i :class="icon('ph-prohibit')"></i>
			</template>
			<template
				v-else-if="hasPendingFollowRequestFromYou && user.isLocked"
			>
				<span>{{ (state = i18n.ts.followRequestPending) }}</span
				><i :class="icon('ph-hourglass-medium')"></i>
			</template>
			<template
				v-else-if="hasPendingFollowRequestFromYou && !user.isLocked"
			>
				<!-- つまりリモートフォローの場合。 -->
				<span>{{ (state = i18n.ts.processing) }}</span
				><i :class="icon('ph-circle-notch fa-pulse')"></i>
			</template>
			<template v-else-if="isFollowing">
				<span>{{ (state = i18n.ts.unfollow) }}</span
				><i :class="icon('ph-minus')"></i>
			</template>
			<template v-else-if="!isFollowing && user.isLocked">
				<span>{{ (state = i18n.ts.followRequest) }}</span
				><i :class="icon('ph-lock-open')"></i>
			</template>
			<template v-else-if="!isFollowing && !user.isLocked">
				<span>{{ (state = i18n.ts.follow) }}</span
				><i :class="icon('ph-plus')"></i>
			</template>
		</template>
		<template v-else>
			<span>{{ (state = i18n.ts.processing) }}</span
			><i :class="icon('ph-circle-notch fa-pulse ph-fw')"></i>
		</template>
	</button>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { entities } from "fedired-js";
import * as os from "@/os";
import { useStream } from "@/stream";
import { i18n } from "@/i18n";
import { isSignedIn, me } from "@/me";
import { getUserMenu } from "@/scripts/get-user-menu";
import { useRouter } from "@/router";
import { vibrate } from "@/scripts/vibrate";
import icon from "@/scripts/icon";

const stream = useStream();
const router = useRouter();

const emit = defineEmits(["refresh"]);
const props = withDefaults(
	defineProps<{
		user: entities.UserDetailed;
		full?: boolean;
		large?: boolean;
		hideMenu?: boolean;
		hideFollowButton?: boolean;
	}>(),
	{
		full: false,
		large: false,
	},
);

const isBlocking = computed(() => props.user.isBlocking);

const state = ref(i18n.ts.processing);

const isFollowing = ref(props.user.isFollowing);
const hasPendingFollowRequestFromYou = ref(
	props.user.hasPendingFollowRequestFromYou,
);
const wait = ref(false);
const connection = stream.useChannel("main");

const hideFollowButton = props.hideFollowButton ?? false;

if (props.user.isFollowing == null) {
	os.api("users/show", {
		userId: props.user.id,
	}).then(onFollowChange);
}

function onFollowChange(user: entities.UserDetailed) {
	if (user.id === props.user.id) {
		isFollowing.value = user.isFollowing;
		hasPendingFollowRequestFromYou.value = user.hasPendingFollowRequestFromYou;
	}
}

async function onClick() {
	wait.value = true;

	try {
		if (isBlocking.value) {
			const { canceled } = await os.confirm({
				type: "warning",
				text: i18n.ts.unblockConfirm,
			});
			if (canceled) return;

			await os.api("blocking/delete", {
				userId: props.user.id,
			});
			if (props.user.isMuted) {
				await os.api("mute/delete", {
					userId: props.user.id,
				});
			}
			emit("refresh");
		} else if (isFollowing.value) {
			const { canceled } = await os.confirm({
				type: "warning",
				text: i18n.t("unfollowConfirm", {
					name: props.user.name || props.user.username,
				}),
			});

			if (canceled) return;

			await os.api("following/delete", {
				userId: props.user.id,
			});
		} else {
			if (hasPendingFollowRequestFromYou.value) {
				await os.api("following/requests/cancel", {
					userId: props.user.id,
				});
				hasPendingFollowRequestFromYou.value = false;
			} else {
				await os.api("following/create", {
					userId: props.user.id,
				});
				vibrate([30, 40, 100]);
				hasPendingFollowRequestFromYou.value = true;
			}
		}
	} catch (err) {
		console.error(err);
	} finally {
		wait.value = false;
	}
}

function menu(ev) {
	os.popupMenu(getUserMenu(props.user, router), ev.currentTarget ?? ev.target);
}

onMounted(() => {
	connection.on("follow", onFollowChange);
	connection.on("unfollow", onFollowChange);
});

onBeforeUnmount(() => {
	connection.dispose();
});
</script>

<style lang="scss" scoped>
.menu {
	inline-size: 3em;
	block-size: 2em;
	vertical-align: middle;
}
.follow-button {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	color: var(--accent);
	border: solid 1px var(--accent);
	padding: 0;
	font-size: 16px;
	inline-size: 2em;
	block-size: 2em;
	border-radius: 100px;
	background: var(--bg);
	vertical-align: middle;

	&.full {
		padding-block: 0.2em;
		padding-inline: 0.7em;
		inline-size: auto;
		font-size: 14px;
	}

	&.large {
		font-size: 16px;
		block-size: 38px;
		padding-block-start: 0;
		padding-inline-end: 12px;
		padding-block-end: 0;
		padding-inline-start: 16px;
	}

	&:not(.full) {
		inline-size: 31px;
		span {
			display: none;
		}
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

	// &:hover {
	// 	background: mix($primary, #fff, 20);
	// }

	// &:active {
	// 	background: mix($primary, #fff, 40);
	// }

	&.active {
		color: var(--fgOnAccent);
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

.blocking {
	background-color: var(--bg) !important;
	border: none;
}
</style>
