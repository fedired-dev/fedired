<template>
	<XContainer :draggable="true" @remove="() => $emit('remove')">
		<template #header
			><i :class="icon('ph-image')"></i>
			{{ i18n.ts._pages.blocks.image }}</template
		>
		<template #func>
			<button @click="choose()">
				<i :class="icon('ph-folder-notch-open')"></i>
			</button>
		</template>

		<section class="oyyftmcf">
			<MkDriveFileThumbnail
				v-if="file"
				class="preview"
				:file="file"
				fit="contain"
				@click="choose()"
			/>
		</section>
	</XContainer>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import XContainer from "../page-editor.container.vue";
import MkDriveFileThumbnail from "@/components/MkDriveFileThumbnail.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const props = withDefaults(
	defineProps<{
		value: any;
	}>(),
	{
		value: {
			fileId: null,
		},
	},
);

const file = ref<any>(null);

async function choose() {
	os.selectDriveFile(false).then((fileResponse) => {
		file.value = fileResponse;
		props.value.fileId = fileResponse?.id;
	});
}

onMounted(async () => {
	if (props.value.fileId == null) {
		await choose();
	} else {
		os.api("drive/files/show", {
			fileId: props.value.fileId,
		}).then((fileResponse) => {
			file.value = fileResponse;
		});
	}
});
</script>

<style lang="scss" scoped>
.oyyftmcf {
	> .preview {
		block-size: 150px;
	}
}
</style>
