<template>
	<MkContainer id="photos-container" :max-height="300" :foldable="true">
		<template #header
			><i :class="icon('ph-image')" style="margin-inline-end: 0.5em"></i
			>{{ i18n.ts.images }}</template
		>
		<div class="ujigsodd">
			<MkLoading v-if="fetching" />
			<div v-if="!fetching && images.length > 0" class="stream">
				<MkA
					v-for="image in images"
					:key="image.note.id + image.file.id"
					class="img"
					:to="notePage(image.note)"
				>
					<ImgWithBlurhash
						:hash="image.file.blurhash"
						:src="thumbnail(image.file)"
						:title="image.file.name"
					/>
				</MkA>
			</div>
			<p v-if="!fetching && images.length == 0" class="empty">
				{{ i18n.ts.nothing }}
			</p>
		</div>
	</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import type { entities } from "fedired-js";
import { getStaticImageUrl } from "@/scripts/get-static-image-url";
import { notePage } from "@/filters/note";
import * as os from "@/os";
import MkContainer from "@/components/MkContainer.vue";
import ImgWithBlurhash from "@/components/MkImgWithBlurhash.vue";
import { defaultStore } from "@/store";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const props = defineProps<{
	user: entities.UserDetailed;
}>();

const fetching = ref(true);
const images = ref<
	{
		note: entities.Note;
		file: entities.DriveFile;
	}[]
>([]);

function thumbnail(image: entities.DriveFile): string {
	return defaultStore.state.disableShowingAnimatedImages
		? getStaticImageUrl(image.thumbnailUrl)
		: image.thumbnailUrl;
}

onMounted(() => {
	const image = [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/apng",
		"image/vnd.mozilla.apng",
		"image/avif",
	];
	os.api("users/notes", {
		userId: props.user.id,
		fileType: image,
		excludeNsfw: defaultStore.state.nsfw !== "ignore",
		limit: 10,
	}).then((notes) => {
		for (const note of notes) {
			for (const file of note.files) {
				images.value.push({
					note,
					file,
				});
			}
		}
		fetching.value = false;
	});
});
</script>

<style lang="scss" scoped>
#photos-container {
	--stickyTop: 0;
}

.ujigsodd {
	padding: 8px;

	> .stream {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		grid-gap: 6px;

		> .img {
			display: flex;
			justify-content: center;
			align-items: center;
			position: relative;
			block-size: 128px;
			border-radius: 6px;
			overflow: clip;
		}
	}

	> .empty {
		margin: 0;
		padding: 16px;
		text-align: center;

		> i {
			margin-inline-end: 4px;
		}
	}
}
</style>
