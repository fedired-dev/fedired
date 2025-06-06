<template>
	<button
		ref="buttonRef"
		v-tooltip.noDelay.bottom="i18n.ts._gallery.like"
		v-vibrate="[30, 50, 50]"
		class="button _button"
		:class="$style.root"
		@click.stop="toggleStar($event)"
	>
		<span v-if="!reacted">
			<i
				v-if="defaultReaction === '👍'"
				:class="icon('ph-thumbs-up')"
			></i>
			<i
				v-else-if="defaultReaction === '❤️'"
				:class="icon('ph-heart')"
			></i>
			<i v-else :class="icon('ph-star')"></i>
		</span>
		<span v-else>
			<i
				v-if="defaultReaction === '👍'"
				class="ph-thumbs-up ph-lg ph-fill"
				:class="$style.yellow"
			></i>
			<i
				v-else-if="defaultReaction === '❤️'"
				class="ph-heart ph-lg ph-fill"
				:class="$style.red"
			></i>
			<i v-else class="ph-star ph-lg ph-fill" :class="$style.yellow"></i>
		</span>
		<template v-if="count > 0"
			><p class="count">{{ count }}</p></template
		>
	</button>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { entities } from "fedired-js";
import Ripple from "@/components/MkRipple.vue";
import XDetails from "@/components/MkUsersTooltip.vue";
import { pleaseLogin } from "@/scripts/please-login";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { getInstanceInfo } from "@/instance";
import { useTooltip } from "@/scripts/use-tooltip";
import icon from "@/scripts/icon";

const props = defineProps<{
	note: entities.Note;
	count: number;
	reacted: boolean;
}>();

const buttonRef = ref<HTMLElement>();

const { defaultReaction } = getInstanceInfo();

function toggleStar(ev?: MouseEvent): void {
	pleaseLogin();

	if (!props.reacted) {
		os.api("notes/reactions/create", {
			noteId: props.note.id,
			reaction: defaultReaction,
		});
		const el =
			ev && ((ev.currentTarget ?? ev.target) as HTMLElement | null | undefined);
		if (el) {
			const rect = el.getBoundingClientRect();
			const x = rect.left + el.offsetWidth / 2;
			const y = rect.top + el.offsetHeight / 2;
			os.popup(Ripple, { x, y }, {}, "end");
		}
	} else {
		os.api("notes/reactions/delete", {
			noteId: props.note.id,
		});
	}
}

useTooltip(buttonRef, async (showing) => {
	const reactions = await os.apiGet("notes/reactions", {
		noteId: props.note.id,
		limit: 11,
		_cacheKey_: props.count,
	});

	const users = reactions.map((x) => x.user);

	if (users.length < 1) return;

	os.popup(
		XDetails,
		{
			showing,
			users,
			count: props.count,
			targetElement: buttonRef.value,
		},
		{},
		"closed",
	);
});
</script>

<style lang="scss" module>
.yellow {
	color: var(--warn);
}

.red {
	color: var(--error);
}
</style>
