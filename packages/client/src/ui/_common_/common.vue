<template>
	<component
		:is="popup.component"
		v-for="popup in popups"
		:key="popup.id"
		v-bind="popup.props"
		v-on="popup.events"
	/>

	<XUpload v-if="uploads.length > 0" />

	<XStreamIndicator />

	<!-- <div v-if="pendingApiRequestsCount > 0" id="wait"></div> -->

	<div v-if="dev" id="devTicker"><span>DEV BUILD</span></div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from "vue";
import { swInject } from "./sw-inject";
import { popup, popups } from "@/os";
import { uploads } from "@/scripts/upload";
import * as sound from "@/scripts/sound";
import { isSignedIn, me } from "@/me";
import { useStream } from "@/stream";

const stream = useStream();

const XStreamIndicator = defineAsyncComponent(
	() => import("./stream-indicator.vue"),
);
const XUpload = defineAsyncComponent(() => import("./upload.vue"));

const dev = _DEV_;

const onNotification = (notification) => {
	if (me.mutingNotificationTypes.includes(notification.type)) return;

	if (document.visibilityState === "visible") {
		stream.send("readNotification", {
			id: notification.id,
		});

		popup(
			defineAsyncComponent(
				() => import("@/components/MkNotificationToast.vue"),
			),
			{
				notification,
			},
			{},
			"closed",
		);
	}

	sound.play("notification");
};

if (isSignedIn(me)) {
	const connection = stream.useChannel("main", null, "UI");
	connection.on("notification", onNotification);

	// #region Listen message from SW
	if ("serviceWorker" in navigator) {
		swInject();
	}
}
</script>

<style lang="scss">
@keyframes dev-ticker-blink {
	0% {
		opacity: 1;
	}
	50% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
}

@keyframes progress-spinner {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

#wait {
	display: block;
	position: fixed;
	z-index: 4000000;
	inset-block-start: 15px;
	inset-inline-end: 15px;

	&:before {
		content: "";
		display: block;
		inline-size: 18px;
		block-size: 18px;
		box-sizing: border-box;
		border: solid 2px transparent;
		border-block-start-color: var(--accent);
		border-inline-start-color: var(--accent);
		border-radius: 50%;
		animation: progress-spinner 400ms linear infinite;
	}
}

#devTicker {
	position: fixed;
	inset-block-start: 0;
	inset-inline-start: 0;
	z-index: 2147483647;
	color: #f6c177;
	background: #6e6a86;
	padding-block: 4px;
	padding-inline: 5px;
	font-size: 14px;
	pointer-events: none;
	user-select: none;

	> span {
		animation: dev-ticker-blink 2s infinite;
	}
}
</style>
