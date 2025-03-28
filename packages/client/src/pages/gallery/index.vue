<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				v-model:tab="tab"
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="1200">
			<swiper
				:round-lengths="true"
				:touch-angle="25"
				:threshold="10"
				:centered-slides="true"
				:modules="[Virtual]"
				:space-between="20"
				:virtual="true"
				:allow-touch-move="
					defaultStore.state.swipeOnMobile &&
					(deviceKind !== 'desktop' ||
						defaultStore.state.swipeOnDesktop)
				"
				@swiper="setSwiperRef"
				@slide-change="onSlideChange"
			>
				<swiper-slide v-if="true">
					<MkFolder class="_gap">
						<template #header
							><i :class="icon('ph-clock')"></i>
							{{ i18n.ts.recentPosts }}</template
						>
						<MkPagination
							v-slot="{ items }"
							:pagination="recentPostsPagination"
							:disable-auto-load="true"
						>
							<div class="vfpdbgtk">
								<MkGalleryPostPreview
									v-for="post in items"
									:key="post.id"
									:post="post"
									class="post"
								/>
							</div>
						</MkPagination>
					</MkFolder>
					<MkFolder class="_gap">
						<template #header
							><i :class="icon('ph-fire-simple')"></i>
							{{ i18n.ts.popularPosts }}</template
						>
						<MkPagination
							v-slot="{ items }"
							:pagination="popularPostsPagination"
							:disable-auto-load="true"
						>
							<div class="vfpdbgtk">
								<MkGalleryPostPreview
									v-for="post in items"
									:key="post.id"
									:post="post"
									class="post"
								/>
							</div>
						</MkPagination>
					</MkFolder>
				</swiper-slide>
				<swiper-slide v-if="true">
					<MkPagination
						v-slot="{ items }"
						:pagination="likedPostsPagination"
					>
						<div class="vfpdbgtk">
							<MkGalleryPostPreview
								v-for="like in items"
								:key="like.id"
								:post="like.post"
								class="post"
							/>
						</div>
					</MkPagination>
				</swiper-slide>
				<swiper-slide v-if="true">
					<MkA to="/gallery/new" class="_link" style="margin: 16px"
						><i :class="icon('ph-plus')"></i>
						{{ i18n.ts.postToGallery }}</MkA
					>
					<MkPagination
						v-slot="{ items }"
						:pagination="myPostsPagination"
					>
						<div class="vfpdbgtk">
							<MkGalleryPostPreview
								v-for="mypost in items"
								:key="mypost.id"
								:post="mypost"
								class="post"
							/>
						</div>
					</MkPagination>
				</swiper-slide>
			</swiper>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import MkFolder from "@/components/MkFolder.vue";
import MkPagination from "@/components/MkPagination.vue";
import MkGalleryPostPreview from "@/components/MkGalleryPostPreview.vue";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deviceKind } from "@/scripts/device-kind";
import { i18n } from "@/i18n";
import { useRouter } from "@/router";
import { defaultStore } from "@/store";
import icon from "@/scripts/icon";
import "swiper/scss";
import "swiper/scss/virtual";

const router = useRouter();

const props = defineProps<{
	tag?: string;
}>();

const tabs = ["explore", "liked", "my"];
const tab = ref(tabs[0]);
watch(tab, () => syncSlide(tabs.indexOf(tab.value)));

const tagsRef = ref();

const recentPostsPagination = {
	endpoint: "gallery/posts" as const,
	limit: 6,
};
const popularPostsPagination = {
	endpoint: "gallery/featured" as const,
	limit: 5,
};
const myPostsPagination = {
	endpoint: "i/gallery/posts" as const,
	limit: 5,
};
const likedPostsPagination = {
	endpoint: "i/gallery/likes" as const,
	limit: 5,
};

watch(
	() => props.tag,
	() => {
		if (tagsRef.value) tagsRef.value.tags.toggleContent(props.tag == null);
	},
);

const headerActions = computed(() => [
	{
		icon: `${icon("ph-plus")}`,
		text: i18n.ts.create,
		handler: () => {
			router.push("/gallery/new");
		},
	},
]);

const headerTabs = computed(() => [
	{
		key: "explore",
		title: i18n.ts.gallery,
		icon: `${icon("ph-image-square")}`,
	},
	{
		key: "liked",
		title: i18n.ts._gallery.liked,
		icon: `${icon("ph-heart")}`,
	},
	{
		key: "my",
		title: i18n.ts._gallery.my,
		icon: `${icon("ph-crown-simple")}`,
	},
]);

definePageMetadata({
	title: i18n.ts.gallery,
	icon: `${icon("ph-image-square")}`,
});

let swiperRef = null;

function setSwiperRef(swiper) {
	swiperRef = swiper;
	syncSlide(tabs.indexOf(tab.value));
	const styles = getComputedStyle(swiper.el);
	swiper.changeLanguageDirection(styles.direction as "rtl" | "ltr");
	if (styles["writing-mode"].startsWith("vertical")) {
		swiper.changeDirection("vertical");
	}
}

function onSlideChange() {
	tab.value = tabs[swiperRef.activeIndex];
}

function syncSlide(index) {
	swiperRef.slideTo(index);
}

onMounted(() => {
	syncSlide(tabs.indexOf(swiperRef.activeIndex));
});
</script>

<style lang="scss" scoped>
.vfpdbgtk {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: 12px;
	margin-block: 0;
	margin-inline: var(--margin);

	> .post {
	}
}
</style>
