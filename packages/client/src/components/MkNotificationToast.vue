<template>
	<div class="mk-notification-toast" :style="{ zIndex }">
		<transition
			:name="defaultStore.state.animation ? 'notification-toast' : ''"
			appear
			@after-leave="$emit('closed')"
		>
			<XNotification
				v-if="showing"
				:notification="notification"
				class="notification _acrylic"
			/>
		</transition>
	</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import type { entities } from "fedired-js";
import XNotification from "@/components/MkNotification.vue";
import * as os from "@/os";
import { defaultStore } from "@/store";

defineProps<{
	notification: entities.Notification;
}>();

const emit = defineEmits<{
	(ev: "closed"): void;
}>();

const zIndex = os.claimZIndex("high");
const showing = ref(true);

onMounted(() => {
	window.setTimeout(() => {
		showing.value = false;
	}, 6000);
});
</script>

<style lang="scss" scoped>
.notification-toast-enter-active,
.notification-toast-leave-active {
	transition:
		opacity 0.3s,
		transform 0.3s !important;
}
.notification-toast-enter-from,
.notification-toast-leave-to {
	opacity: 0;
	transform: translateX(-250px);
}

.mk-notification-toast {
	position: fixed;
	inset-inline-start: 0;
	inline-size: 250px;
	inset-block-start: 32px;
	padding-block: 0;
	padding-inline: 32px;
	pointer-events: none;

	@media (max-inline-size: 700px) {
		inset-block-start: initial;
		inset-block-end: 112px;
		padding-block: 0;
		padding-inline: 16px;
	}

	@media (max-inline-size: 500px) {
		inset-block-end: calc(env(safe-area-inset-bottom, 0px) + 92px);
		padding-block: 0;
		padding-inline: 8px;
	}

	> .notification {
		block-size: 100%;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		overflow: hidden;
	}
}
</style>
