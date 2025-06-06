<template>
	<!-- sectionを利用しているのは、deck.vue側でcolumnに対してfirst-of-typeを効かせるため -->
	<section
		v-hotkey="keymap"
		class="dnpfarvg _narrow_"
		:class="{
			paged: isMainColumn,
			naked,
			active,
			isStacked,
			draghover,
			dragging,
			dropready,
		}"
		@dragover.prevent.stop="onDragover"
		@dragleave="onDragleave"
		@drop.prevent.stop="onDrop"
	>
		<header
			:class="{ indicated }"
			draggable="true"
			@click="goTop"
			@dragstart="onDragstart"
			@dragend="onDragend"
			@contextmenu.prevent.stop="onContextmenu"
			@wheel="emit('headerWheel', $event)"
		>
			<button
				v-if="isStacked && !isMainColumn"
				class="toggleActive _button"
				@click="toggleActive"
			>
				<template v-if="active"
					><i :class="icon('ph-caret-up ph-dir')"></i
				></template>
				<template v-else
					><i :class="icon('ph-caret-down ph-dir')"></i
				></template>
			</button>
			<div class="action">
				<slot name="action"></slot>
			</div>
			<span class="header"><slot name="header"></slot></span>
			<button
				v-tooltip="i18n.ts.settings"
				class="menu _button"
				@click.stop="showSettingsMenu"
			>
				<i :class="icon('ph-dots-three-outline ph-dir-vertical')"></i>
			</button>
		</header>
		<div v-show="active" ref="body">
			<slot></slot>
		</div>
	</section>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import type { Column } from "./deck-store";
import {
	popRightColumn,
	removeColumn,
	stackLeftColumn,
	swapColumn,
	swapDownColumn,
	swapLeftColumn,
	swapRightColumn,
	swapUpColumn,
	updateColumn,
} from "./deck-store";
import * as os from "@/os";
import { i18n } from "@/i18n";
import type { MenuItem } from "@/types/menu";
import icon from "@/scripts/icon";

provide("shouldHeaderThin", true);
provide("shouldOmitHeaderTitle", true);
provide("shouldSpacerMin", true);

const props = withDefaults(
	defineProps<{
		column: Column;
		isStacked?: boolean;
		naked?: boolean;
		indicated?: boolean;
		menu?: MenuItem[];
	}>(),
	{
		isStacked: false,
		naked: false,
		indicated: false,
	},
);

const emit = defineEmits<{
	(ev: "parent-focus", direction: "up" | "down" | "left" | "right"): void;
	(ev: "change-active-state", v: boolean): void;
	(ev: "headerWheel", ctx: WheelEvent): void;
}>();

const body = ref<HTMLDivElement>();

const dragging = ref(false);
watch(dragging, (v) =>
	os.deckGlobalEvents.emit(v ? "column.dragStart" : "column.dragEnd"),
);

const draghover = ref(false);
const dropready = ref(false);

const isMainColumn = computed(() => props.column.type === "main");
const active = computed(() => props.column.active !== false);
watch(active, (v) => emit("change-active-state", v));

const keymap = computed(() => ({
	"shift+up": () => emit("parent-focus", "up"),
	"shift+down": () => emit("parent-focus", "down"),
	"shift+left": () => emit("parent-focus", "left"),
	"shift+right": () => emit("parent-focus", "right"),
}));

onMounted(() => {
	os.deckGlobalEvents.on("column.dragStart", onOtherDragStart);
	os.deckGlobalEvents.on("column.dragEnd", onOtherDragEnd);
});

onBeforeUnmount(() => {
	os.deckGlobalEvents.off("column.dragStart", onOtherDragStart);
	os.deckGlobalEvents.off("column.dragEnd", onOtherDragEnd);
});

function onOtherDragStart() {
	dropready.value = true;
}

function onOtherDragEnd() {
	dropready.value = false;
}

function toggleActive() {
	if (!props.isStacked) return;
	updateColumn(props.column.id, {
		active: !props.column.active,
	});
}

function getMenu() {
	let items = [
		{
			icon: `${icon("ph-gear-six")}`,
			text: i18n.ts._deck.configureColumn,
			action: async () => {
				const { canceled, result } = await os.form(props.column.name, {
					name: {
						type: "string",
						label: i18n.ts.name,
						default: props.column.name,
					},
					width: {
						type: "number",
						label: i18n.ts.width,
						default: props.column.width,
					},
					flexible: {
						type: "boolean",
						label: i18n.ts.flexible,
						default: props.column.flexible,
					},
				});
				if (canceled) return;
				updateColumn(props.column.id, result);
			},
		},
		{
			type: "parent",
			text: i18n.ts.move + "...",
			icon: `${icon("ph-arrows-out-cardinal")}`,
			children: [
				{
					icon: `${icon("ph-caret-left")}`,
					text: i18n.ts._deck.swapLeft,
					action: () => {
						swapLeftColumn(props.column.id);
					},
				},
				{
					icon: `${icon("ph-caret-right")}`,
					text: i18n.ts._deck.swapRight,
					action: () => {
						swapRightColumn(props.column.id);
					},
				},
				props.isStacked
					? {
							icon: `${icon("ph-caret-up")}`,
							text: i18n.ts._deck.swapUp,
							action: () => {
								swapUpColumn(props.column.id);
							},
						}
					: undefined,
				props.isStacked
					? {
							icon: `${icon("ph-caret-down")}`,
							text: i18n.ts._deck.swapDown,
							action: () => {
								swapDownColumn(props.column.id);
							},
						}
					: undefined,
			],
		},
		{
			icon: `${icon("ph-copy")}`,
			text: i18n.ts._deck.stackLeft,
			action: () => {
				stackLeftColumn(props.column.id);
			},
		},
		props.isStacked
			? {
					icon: `${icon("ph-browser")}`,
					text: i18n.ts._deck.popRight,
					action: () => {
						popRightColumn(props.column.id);
					},
				}
			: undefined,
		null,
		{
			icon: `${icon("ph-trash")}`,
			text: i18n.ts.remove,
			danger: true,
			action: () => {
				removeColumn(props.column.id);
			},
		},
	];

	if (props.menu) {
		items.unshift(null);
		items = props.menu.concat(items);
	}

	return items;
}

function showSettingsMenu(ev: MouseEvent) {
	os.popupMenu(getMenu(), ev.currentTarget ?? ev.target);
}

function onContextmenu(ev: MouseEvent) {
	os.contextMenu(getMenu(), ev);
}

function goTop() {
	body.value.scrollTo({
		top: 0,
		behavior: "smooth",
	});
}

function onDragstart(ev) {
	ev.dataTransfer.effectAllowed = "move";
	ev.dataTransfer.setData(_DATA_TRANSFER_DECK_COLUMN_, props.column.id);

	// Chromeのバグで、Dragstartハンドラ内ですぐにDOMを変更する(=リアクティブなプロパティを変更する)とDragが終了してしまう
	// SEE: https://stackoverflow.com/questions/19639969/html5-dragend-event-firing-immediately
	window.setTimeout(() => {
		dragging.value = true;
	}, 10);
}

function onDragend(ev) {
	dragging.value = false;
}

function onDragover(ev) {
	// 自分自身がドラッグされている場合
	if (dragging.value) {
		// 自分自身にはドロップさせない
		ev.dataTransfer.dropEffect = "none";
	} else {
		const isDeckColumn =
			ev.dataTransfer.types[0] === _DATA_TRANSFER_DECK_COLUMN_;

		ev.dataTransfer.dropEffect = isDeckColumn ? "move" : "none";

		if (isDeckColumn) draghover.value = true;
	}
}

function onDragleave() {
	draghover.value = false;
}

function onDrop(ev) {
	draghover.value = false;
	os.deckGlobalEvents.emit("column.dragEnd");

	const id = ev.dataTransfer.getData(_DATA_TRANSFER_DECK_COLUMN_);
	if (id != null && id !== "") {
		swapColumn(props.column.id, id);
	}
}
</script>

<style lang="scss">
.dnpfarvg {
	header {
		.ph-lg {
			vertical-align: -0.24em;
		}
	}
}
</style>

<style lang="scss" scoped>
.dnpfarvg {
	--root-margin: 10px;
	--deckColumnHeaderHeight: 42px;

	block-size: 100%;
	overflow: hidden;
	contain: strict;

	background: var(--bg);

	&.draghover {
		&:after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			inset-block-start: 0;
			inset-inline-start: 0;
			inline-size: 100%;
			block-size: 100%;
			background: var(--focus);
		}
	}

	&.dragging {
		&:after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			inset-block-start: 0;
			inset-inline-start: 0;
			inline-size: 100%;
			block-size: 100%;
			background: var(--focus);
			opacity: 0.5;
		}
	}

	&.dropready {
		* {
			pointer-events: none;
		}
	}

	&:not(.active) {
		flex-basis: var(--deckColumnHeaderHeight);
		min-block-size: var(--deckColumnHeaderHeight);

		> header.indicated {
			box-shadow: 4px 0px var(--accent) inset;
		}
	}

	&.naked {
		background: var(--acrylicBg) !important;
		-webkit-backdrop-filter: var(--blur, blur(10px));
		backdrop-filter: var(--blur, blur(10px));

		> header {
			background: transparent;
			box-shadow: none;

			> button {
				color: var(--fg);
			}
		}
	}

	&.paged {
		background: var(--bg) !important;
	}

	> header {
		position: relative;
		display: flex;
		z-index: 2;
		line-height: var(--deckColumnHeaderHeight);
		block-size: var(--deckColumnHeaderHeight);
		padding-block: 0;
		padding-inline: 16px;
		font-size: 0.9em;
		color: var(--panelHeaderFg);
		background: var(--panelHeaderBg);
		box-shadow: 0 1px 0 0 var(--panelHeaderDivider);
		cursor: pointer;

		&,
		* {
			user-select: none;
		}

		&.indicated {
			box-shadow: 0 3px 0 0 var(--accent);
		}

		> .header {
			display: inline-block;
			align-items: center;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		> span:only-of-type {
			inline-size: 100%;
		}

		> .toggleActive,
		> .action > ::v-deep(*),
		> .menu {
			z-index: 1;
			inline-size: var(--deckColumnHeaderHeight);
			line-height: var(--deckColumnHeaderHeight);
			color: var(--faceTextButton);

			&:hover {
				color: var(--faceTextButtonHover);
			}

			&:active {
				color: var(--faceTextButtonActive);
			}
		}

		> .toggleActive,
		> .action {
			margin-inline-start: -16px;
		}

		> .action {
			z-index: 1;
		}

		> .action:empty {
			display: none;
		}

		> .menu {
			margin-inline-start: auto;
			margin-inline-end: -16px;
		}
	}

	> div {
		block-size: calc(100% - var(--deckColumnHeaderHeight));
		overflow-y: auto;
		overflow-block: auto;
		overflow-x: hidden;
		overflow-inline: hidden; // Safari does not supports clip
		overflow-x: clip;
		overflow-inline: clip;
		-webkit-overflow-scrolling: touch;
		box-sizing: border-box;
		
		@supports not (overflow-block: auto) {
			.vertical-lr &, .vertical-rl & {
				overflow-y: hidden;
				overflow-y: clip;
				overflow-x: auto;
			}
		}
	}
}
</style>
