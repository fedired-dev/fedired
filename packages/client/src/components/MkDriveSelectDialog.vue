<template>
	<XModalWindow
		ref="dialog"
		:width="800"
		:height="500"
		:with-ok-button="true"
		:ok-button-disabled="type === 'file' && selected.length === 0"
		@click="cancel()"
		@close="cancel()"
		@ok="ok()"
		@closed="emit('closed')"
	>
		<template #header>
			{{
				multiple
					? type === "file"
						? i18n.ts.selectFiles
						: i18n.ts.selectFolders
					: type === "file"
						? i18n.ts.selectFile
						: i18n.ts.selectFolder
			}}
			<span
				v-if="selected.length > 0"
				style="margin-inline-start: 8px; opacity: 0.5"
				>({{ number(selected.length) }})</span
			>
		</template>
		<XDrive
			:multiple="multiple"
			:select="type"
			@changeSelection="onChangeSelection"
			@selected="ok()"
		/>
	</XModalWindow>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { entities } from "fedired-js";
import XDrive from "@/components/MkDrive.vue";
import XModalWindow from "@/components/MkModalWindow.vue";
import number from "@/filters/number";
import { i18n } from "@/i18n";

withDefaults(
	defineProps<{
		type?: "file" | "folder";
		multiple: boolean;
	}>(),
	{
		type: "file",
	},
);

const emit = defineEmits<{
	(ev: "done", r?: entities.DriveFile[]): void;
	(ev: "closed"): void;
}>();

const dialog = ref<InstanceType<typeof XModalWindow>>();

const selected = ref<entities.DriveFile[]>([]);

function ok() {
	emit("done", selected.value);
	dialog.value?.close();
}

function cancel() {
	emit("done");
	dialog.value?.close();
}

function onChangeSelection(files: entities.DriveFile[]) {
	selected.value = files;
}
</script>
