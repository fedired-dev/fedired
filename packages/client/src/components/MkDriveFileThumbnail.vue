<template>
	<button ref="thumbnail" class="zdjebgpv">
		<ImgWithBlurhash
			v-if="isThumbnailAvailable"
			:hash="file.blurhash"
			:src="file.thumbnailUrl"
			:alt="file.comment"
			:title="file.name"
			:cover="fit !== 'contain'"
			:show-alt-indicator="showAltIndicator"
		/>
		<i v-else-if="is === 'image'" :class="icon('ph-file-image icon')"></i>
		<i v-else-if="is === 'video'" :class="icon('ph-file-video icon')"></i>
		<i
			v-else-if="is === 'audio' || is === 'midi'"
			:class="icon('ph-file-audio icon')"
		></i>
		<i v-else-if="is === 'csv'" :class="icon('ph-file-csv icon')"></i>
		<i v-else-if="is === 'pdf'" :class="icon('ph-file-pdf icon')"></i>
		<i v-else-if="is === 'textfile'" :class="icon('ph-file-text icon')"></i>
		<i v-else-if="is === 'archive'" :class="icon('ph-file-zip icon')"></i>
		<i v-else :class="icon('ph-file icon')"></i>

		<i
			v-if="isThumbnailAvailable && is === 'video'"
			:class="icon('ph-file-video icon-sub')"
		></i>
	</button>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { entities } from "fedired-js";
import ImgWithBlurhash from "@/components/MkImgWithBlurhash.vue";
import icon from "@/scripts/icon";

const props = withDefaults(
	defineProps<{
		file: entities.DriveFile;
		fit: string;
		showAltIndicator?: boolean;
	}>(),
	{
		showAltIndicator: false,
	},
);

const is = computed(() => {
	if (props.file.type.startsWith("image/")) return "image";
	if (props.file.type.startsWith("video/")) return "video";
	if (props.file.type === "audio/midi") return "midi";
	if (props.file.type.startsWith("audio/")) return "audio";
	if (props.file.type.endsWith("/csv")) return "csv";
	if (props.file.type.endsWith("/pdf")) return "pdf";
	if (props.file.type.startsWith("text/")) return "textfile";
	if (
		[
			"application/zip",
			"application/x-cpio",
			"application/x-bzip",
			"application/x-bzip2",
			"application/java-archive",
			"application/x-rar-compressed",
			"application/x-tar",
			"application/gzip",
			"application/x-7z-compressed",
		].includes(props.file.type)
	)
		return "archive";
	return "unknown";
});

const isThumbnailAvailable = computed(() => {
	return props.file.thumbnailUrl
		? is.value === ("image" as const) || is.value === "video"
		: false;
});
</script>

<style lang="scss" scoped>
.zdjebgpv {
	position: relative;
	display: flex;
	background: var(--panel);
	border-radius: 8px;
	overflow: clip;
	border: 0;
	padding: 0;
	cursor: pointer;
	align-items: center;
	justify-content: center;

	> .icon-sub {
		position: absolute;
		inline-size: 30%;
		block-size: auto;
		margin: 0;
		inset-inline-end: 4%;
		inset-block-end: 4%;
	}

	> .icon {
		pointer-events: none;
		margin: auto;
		font-size: 32px;
		color: #777;
	}
}
</style>
