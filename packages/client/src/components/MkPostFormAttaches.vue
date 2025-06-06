<template>
	<div v-show="files.length != 0" class="skeikyzd">
		<VueDraggable
			v-model="_files"
			class="files"
			:animation="150"
			:delay="100"
			:delay-on-touch-only="true"
		>
			<div
				v-for="element in _files"
				:key="element.id"
				class="file"
				@click="showFileMenu(element, $event)"
				@contextmenu.prevent="showFileMenu(element, $event)"
			>
				<MkDriveFileThumbnail
					:data-id="element.id"
					class="thumbnail"
					:file="element"
					fit="cover"
					:show-alt-indicator="true"
				/>
				<div v-if="element.isSensitive" class="sensitive">
					<i :class="icon('ph-warning icon')"></i>
				</div>
			</div>
		</VueDraggable>
		<p class="remain">{{ 16 - files.length }}/16</p>
	</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import MkDriveFileThumbnail from "@/components/MkDriveFileThumbnail.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const props = defineProps({
	files: {
		type: Array,
		required: true,
	},
	detachMediaFn: {
		type: Function,
		required: false,
	},
});

const emits = defineEmits([
	"updated",
	"detach",
	"changeSensitive",
	"changeName",
]);

const _files = computed({
	get: () => props.files,
	set: (value) => emits("updated", value),
});

const detachMedia = (id) => {
	if (props.detachMediaFn) {
		props.detachMediaFn(id);
	} else {
		emits("detach", id);
	}
};

function toggleSensitive(file) {
	os.api("drive/files/update", {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	}).then(() => {
		emits("changeSensitive", file, !file.isSensitive);
	});
}

async function rename(file) {
	const { canceled, result } = await os.inputText({
		title: i18n.ts.enterFileName,
		default: file.name,
	});
	if (canceled) return;
	os.api("drive/files/update", {
		fileId: file.id,
		name: result,
	}).then(() => {
		emits("changeName", file, result);
		file.name = result;
	});
}

async function describe(file) {
	os.popup(
		defineAsyncComponent(() => import("@/components/MkMediaCaption.vue")),
		{
			title: i18n.ts.describeFile,
			input: {
				placeholder: i18n.ts.inputNewDescription,
				default: file.comment !== null ? file.comment : "",
			},
			image: file,
		},
		{
			done: (result) => {
				if (!result || result.canceled) return;
				const comment = result.result.length === 0 ? null : result.result;
				os.api("drive/files/update", {
					fileId: file.id,
					comment,
				}).then(() => {
					file.comment = comment;
				});
			},
		},
		"closed",
	);
}

function showFileMenu(file, ev: MouseEvent) {
	os.popupMenu(
		[
			{
				text: i18n.ts.renameFile,
				icon: `${icon("ph-cursor-text")}`,
				action: () => {
					rename(file);
				},
			},
			{
				text: file.isSensitive
					? i18n.ts.unmarkAsSensitive
					: i18n.ts.markAsSensitive,
				icon: file.isSensitive ? "ph-eye ph-lg" : "ph-eye-slash ph-lg",
				action: () => {
					toggleSensitive(file);
				},
			},
			{
				text: i18n.ts.describeFile,
				icon: `${icon("ph-subtitles")}`,
				action: () => {
					describe(file);
				},
			},
			{
				text: i18n.ts.attachCancel,
				icon: `${icon("ph-x")}`,
				action: () => {
					detachMedia(file.id);
				},
			},
		],
		(ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined,
	);
}
</script>

<style lang="scss" scoped>
.skeikyzd {
	padding-block: 8px;
	padding-inline: 16px;
	position: relative;

	> .files {
		display: flex;
		flex-wrap: wrap;

		> .file {
			position: relative;
			inline-size: 64px;
			block-size: 64px;
			margin-inline-end: 4px;
			border-radius: 4px;
			cursor: move;

			&:hover > .remove {
				display: block;
			}

			> .thumbnail {
				inline-size: 100%;
				block-size: 100%;
				z-index: 1;
				color: var(--fg);
			}

			> .sensitive {
				display: flex;
				position: absolute;
				inline-size: 64px;
				block-size: 64px;
				inset-block-start: 0;
				inset-inline-start: 0;
				z-index: 2;
				background: var(--header);
				color: var(--fg);

				> .icon {
					margin: auto;
				}
			}
		}
	}

	> .remain {
		display: block;
		position: absolute;
		inset-block-start: 8px;
		inset-inline-end: 8px;
		margin: 0;
		padding: 0;
	}
}
</style>
