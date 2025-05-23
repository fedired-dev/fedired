<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				v-model:tab="tab"
				:actions="headerActions"
				:tabs="headerTabs"
		/></template>
		<MkSpacer :content-max="700">
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
					<div class="rknalgpo">
						<MkPagination
							v-slot="{ items }"
							:pagination="featuredPagesPagination"
						>
							<MkPagePreview
								v-for="page in items"
								:key="page.id"
								class="ckltabjg"
								:page="page"
							/>
						</MkPagination>
					</div>
				</swiper-slide>
				<swiper-slide v-if="true">
					<div class="rknalgpo liked">
						<MkPagination
							v-slot="{ items }"
							:pagination="likedPagesPagination"
						>
							<MkPagePreview
								v-for="like in items"
								:key="like.page.id"
								class="ckltabjg"
								:page="like.page"
							/>
						</MkPagination>
					</div>
				</swiper-slide>
				<swiper-slide v-if="true">
					<div class="rknalgpo my">
						<div class="buttoncontainer">
							<MkButton class="new primary" @click="create()"
								><i :class="icon('ph-plus')"></i>
								{{ i18n.ts._pages.newPage }}</MkButton
							>
						</div>
						<MkPagination
							v-slot="{ items }"
							:pagination="myPagesPagination"
						>
							<MkPagePreview
								v-for="mypage in items"
								:key="mypage.id"
								class="ckltabjg"
								:page="mypage"
							/>
						</MkPagination>
					</div>
				</swiper-slide>
			</swiper>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import MkPagePreview from "@/components/MkPagePreview.vue";
import MkPagination from "@/components/MkPagination.vue";
import MkButton from "@/components/MkButton.vue";
import { useRouter } from "@/router";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deviceKind } from "@/scripts/device-kind";
import { defaultStore } from "@/store";
import icon from "@/scripts/icon";
import "swiper/scss";
import "swiper/scss/virtual";

const router = useRouter();

const tab = ref("featured");
const tabs = ["featured", "liked", "my"];
watch(tab, () => syncSlide(tabs.indexOf(tab.value)));

const featuredPagesPagination = {
	endpoint: "pages/featured" as const,
	limit: 10,
};
const likedPagesPagination = {
	endpoint: "i/page-likes" as const,
	limit: 10,
};
const myPagesPagination = {
	endpoint: "i/pages" as const,
	limit: 10,
};

function create() {
	router.push("/pages/new");
}

const headerActions = computed(() => [
	{
		icon: `${icon("ph-plus")}`,
		text: i18n.ts.create,
		handler: create,
	},
]);

const headerTabs = computed(() => [
	{
		key: "featured",
		title: i18n.ts._pages.featured,
		icon: `${icon("ph-fire-simple")}`,
	},
	{
		key: "liked",
		title: i18n.ts._pages.liked,
		icon: `${icon("ph-heart")}`,
	},
	{
		key: "my",
		title: i18n.ts._pages.my,
		icon: `${icon("ph-crown-simple")}`,
	},
]);

definePageMetadata(
	computed(() => ({
		title: i18n.ts.pages,
		icon: `${icon("ph-file-text ph-dir")}`,
	})),
);

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
.rknalgpo {
	> .buttoncontainer {
		display: grid;
		justify-content: center;
		margin-block-end: 1rem;
	}

	&.my .ckltabjg:first-child {
		margin-block-start: 16px;
	}

	.ckltabjg:not(:last-child) {
		margin-block-end: 8px;
	}

	@media (min-inline-size: 500px) {
		.ckltabjg:not(:last-child) {
			margin-block-end: 16px;
		}
	}
}
</style>
