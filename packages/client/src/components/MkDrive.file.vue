<template>
	<div
		class="ncvczrfv"
		:class="{ isSelected }"
		draggable="true"
		:title="title"
		@click="onClick"
		@contextmenu.stop="onContextmenu"
		@dragstart="onDragstart"
		@dragend="onDragend"
	>
		<div v-if="me?.avatarId == file.id" class="label">
			<img src="/client-assets/label.svg" />
			<p>{{ i18n.ts.avatar }}</p>
		</div>
		<div v-if="me?.bannerId == file.id" class="label">
			<img src="/client-assets/label.svg" />
			<p>{{ i18n.ts.banner }}</p>
		</div>
		<div v-if="file.isSensitive" class="label red">
			<img src="/client-assets/label-red.svg" />
			<p>{{ i18n.ts.nsfw }}</p>
		</div>

		<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain" />

		<p class="name">
			<span>{{
				file.name.lastIndexOf(".") != -1
					? file.name.substring(0, file.name.lastIndexOf("."))
					: file.name
			}}</span>
			<span v-if="file.name.lastIndexOf('.') != -1" class="ext">{{
				file.name.substring(file.name.lastIndexOf("."))
			}}</span>
		</p>
	</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from "vue";
import type { entities } from "fedired-js";
import copyToClipboard from "@/scripts/copy-to-clipboard";
import MkDriveFileThumbnail from "@/components/MkDriveFileThumbnail.vue";
import bytes from "@/filters/bytes";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { me } from "@/me";
import icon from "@/scripts/icon";
import type { MenuItem } from "@/types/menu";
import { useRouter } from "@/router";

const props = withDefaults(
	defineProps<{
		file: entities.DriveFile;
		isSelected?: boolean;
		selectMode?: boolean;
	}>(),
	{
		isSelected: false,
		selectMode: false,
	},
);

const emit = defineEmits<{
	(ev: "chosen", r: entities.DriveFile): void;
	(ev: "dragstart"): void;
	(ev: "dragend"): void;
}>();

const router = useRouter();

const isDragging = ref(false);

const title = computed(
	() => `${props.file.name}\n${props.file.type} ${bytes(props.file.size)}`,
);

function getMenu(): MenuItem[] {
	return [
		{
			text: i18n.ts.rename,
			icon: `${icon("ph-cursor-text")}`,
			action: rename,
		},
		{
			text: props.file.isSensitive
				? i18n.ts.unmarkAsSensitive
				: i18n.ts.markAsSensitive,
			icon: props.file.isSensitive ? "ph-eye ph-lg" : "ph-eye-slash ph-lg",
			action: toggleSensitive,
		},
		{
			text: i18n.ts.describeFile,
			icon: `${icon("ph-subtitles")}`,
			action: describe,
		},
		null,
		{
			text: i18n.ts.copyUrl,
			icon: `${icon("ph-link-simple")}`,
			action: copyUrl,
		},
		{
			type: "a",
			href: props.file.url,
			target: "_blank",
			text: i18n.ts.download,
			icon: `${icon("ph-download-simple")}`,
			download: props.file.name,
		},
		{
			text: i18n.ts.showAttachedNotes,
			icon: `${icon("ph-paperclip")}`,
			action: () => {
				router.push(`/my/drive/file/${props.file.id}/attached`);
			},
		},
		null,
		{
			text: i18n.ts.delete,
			icon: `${icon("ph-trash")}`,
			danger: true,
			action: deleteFile,
		},
	];
}

function onClick(ev: MouseEvent) {
	if (props.selectMode) {
		emit("chosen", props.file);
	} else {
		os.popupMenu(
			getMenu(),
			(ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined,
		);
	}
}

function onContextmenu(ev: MouseEvent) {
	os.contextMenu(getMenu(), ev);
}

function onDragstart(ev: DragEvent) {
	if (ev.dataTransfer) {
		ev.dataTransfer.effectAllowed = "move";
		ev.dataTransfer.setData(
			_DATA_TRANSFER_DRIVE_FILE_,
			JSON.stringify(props.file),
		);
	}
	isDragging.value = true;

	emit("dragstart");
}

function onDragend() {
	isDragging.value = false;
	emit("dragend");
}

function rename() {
	os.inputText({
		title: i18n.ts.renameFile,
		placeholder: i18n.ts.inputNewFileName,
		default: props.file.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		os.api("drive/files/update", {
			fileId: props.file.id,
			name,
		});
	});
}

function describe() {
	os.popup(
		defineAsyncComponent(() => import("@/components/MkMediaCaption.vue")),
		{
			title: i18n.ts.describeFile,
			input: {
				placeholder: i18n.ts.inputNewDescription,
				default: props.file.comment != null ? props.file.comment : "",
			},
			image: props.file,
		},
		{
			done: (result: {
				canceled: boolean;
				result?: string | null;
			}) => {
				if (!result || result.canceled) return;
				const comment = result.result;
				os.api("drive/files/update", {
					fileId: props.file.id,
					comment: comment || null,
				});
			},
		},
		"closed",
	);
}

function toggleSensitive() {
	os.api("drive/files/update", {
		fileId: props.file.id,
		isSensitive: !props.file.isSensitive,
	});
}

function copyUrl() {
	copyToClipboard(props.file.url);
	os.success();
}
/*
function addApp() {
	alert('not implemented yet');
}
*/
async function deleteFile() {
	const { canceled } = await os.confirm({
		type: "warning",
		text: i18n.t("driveFileDeleteConfirm", { name: props.file.name }),
	});

	if (canceled) return;
	os.api("drive/files/delete", {
		fileId: props.file.id,
	});
}
</script>

<style lang="scss" scoped>
.ncvczrfv {
	position: relative;
	padding-block-start: 8px;
	padding-inline-end: 0;
	padding-block-end: 0;
	padding-inline-start: 0;
	min-block-size: 180px;
	border-radius: 8px;

	&,
	* {
		cursor: pointer;
	}

	> * {
		pointer-events: none;
	}

	&:hover {
		background: rgba(#000, 0.05);

		> .label {
			&:before,
			&:after {
				background: #0b65a5;
			}

			&.red {
				&:before,
				&:after {
					background: #c12113;
				}
			}
		}
	}

	&:active {
		background: rgba(#000, 0.1);

		> .label {
			&:before,
			&:after {
				background: #0b588c;
			}

			&.red {
				&:before,
				&:after {
					background: #ce2212;
				}
			}
		}
	}

	&.isSelected {
		background: var(--accent);

		&:hover {
			background: var(--accentLighten);
		}

		&:active {
			background: var(--accentDarken);
		}

		> .label {
			&:before,
			&:after {
				display: none;
			}
		}

		> .name {
			color: #fff;
		}

		> .thumbnail {
			color: #fff;
		}
	}

	> .label {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		pointer-events: none;

		&:before,
		&:after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1;
			background: #0c7ac9;
		}

		&:before {
			inset-block-start: 0;
			inset-inline-start: 57px;
			inline-size: 28px;
			block-size: 8px;
		}

		&:after {
			inset-block-start: 57px;
			inset-inline-start: 0;
			inline-size: 8px;
			block-size: 28px;
		}

		&.red {
			&:before,
			&:after {
				background: #c12113;
			}
		}

		> img {
			position: absolute;
			z-index: 2;
			inset-block-start: 0;
			inset-inline-start: 0;
		}

		> p {
			position: absolute;
			z-index: 3;
			inset-block-start: 19px;
			inset-inline-start: -28px;
			inline-size: 120px;
			margin: 0;
			text-align: center;
			line-height: 28px;
			color: #fff;
			transform: rotate(-45deg);
		}
	}

	> .thumbnail {
		inline-size: 110px;
		block-size: 110px;
		margin: auto;
	}

	> .name {
		display: block;
		margin-block-start: 4px;
		margin-inline-end: 0;
		margin-block-end: 0;
		margin-inline-start: 0;
		font-size: 0.8em;
		text-align: center;
		word-break: break-all;
		color: var(--fg);
		overflow: hidden;

		> .ext {
			opacity: 0.5;
		}
	}
}
</style>
