<template>
	<a
		:href="to"
		:class="active ? activeClass : null"
		@contextmenu.prevent.stop="onContextmenu"
		@click.stop="nav"
	>
		<slot></slot>
	</a>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import * as os from "@/os";
import copyToClipboard from "@/scripts/copy-to-clipboard";
import { url } from "@/config";
// import { popout as popout_ } from "@/scripts/popout";
import { i18n } from "@/i18n";
import { useRouter } from "@/router";
import icon from "@/scripts/icon";

const props = withDefaults(
	defineProps<{
		to: string;
		activeClass?: null | string;
		behavior?: null | "window" | "browser" | "modalWindow";
	}>(),
	{
		activeClass: null,
		behavior: null,
	},
);

const router = useRouter();

const active = computed(() => {
	if (props.activeClass == null) return false;
	const resolved = router.resolve(props.to);
	if (resolved == null) return false;
	if (resolved.route.path === router.currentRoute.value.path) return true;
	if (resolved.route.name == null) return false;
	if (router.currentRoute.value.name == null) return false;
	return resolved.route.name === router.currentRoute.value.name;
});

function onContextmenu(ev) {
	const selection = window.getSelection();
	if (selection && selection.toString() !== "") return;
	os.contextMenu(
		[
			{
				type: "label",
				text: props.to,
			},
			{
				icon: `${icon("ph-browser")}`,
				text: i18n.ts.openInWindow,
				action: () => {
					os.pageWindow(props.to);
				},
			},
			{
				icon: `${icon("ph-arrows-out-simple")}`,
				text: i18n.ts.showInPage,
				action: () => {
					router.push(props.to, "forcePage");
				},
			},
			null,
			{
				icon: `${icon("ph-arrow-square-out")}`,
				text: i18n.ts.openInNewTab,
				action: () => {
					window.open(props.to, "_blank");
				},
			},
			{
				icon: `${icon("ph-link-simple")}`,
				text: i18n.ts.copyLink,
				action: () => {
					copyToClipboard(`${url}${props.to}`);
					os.success();
				},
			},
		],
		ev,
	);
}

function openWindow() {
	os.pageWindow(props.to);
}

function modalWindow() {
	os.modalPageWindow(props.to);
}

// function popout() {
// 	popout_(props.to);
// }

function nav(ev: MouseEvent) {
	if (!ev.ctrlKey && props.behavior !== "browser") {
		ev.preventDefault();

		if (props.behavior) {
			if (props.behavior === "window") {
				return openWindow();
			} else if (props.behavior === "modalWindow") {
				return modalWindow();
			}
		}

		if (ev.shiftKey) {
			return openWindow();
		}

		router.push(props.to, ev.ctrlKey ? "forcePage" : null);
	}
}
</script>
