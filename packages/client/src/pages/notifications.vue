<template>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader
				v-model:tab="tab"
				:actions="headerActions"
				:tabs="headerTabs"
				:display-my-avatar="true"
			/>
		</template>
		<MkSpacer :content-max="800">
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
				<swiper-slide>
					<XNotifications
						:key="'tab1'"
						class="notifications"
						:include-types="includeTypes"
						:unread-only="false"
					/>
				</swiper-slide>
				<swiper-slide>
					<XNotifications
						v-if="tab === 'reactions'"
						:key="'tab2'"
						class="notifications"
						:include-types="['reaction']"
						:unread-only="false"
					/>
				</swiper-slide>
				<swiper-slide>
					<XNotes v-if="tab === 'mentions'" :key="'tab3'" :pagination="mentionsPagination" />
				</swiper-slide>
				<swiper-slide>
					<XNotes v-if="tab === 'directNotes'" :key="'tab4'" :pagination="directNotesPagination" />
				</swiper-slide>
			</swiper>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import type { Swiper as SwiperType } from "swiper/types";
import { notificationTypes } from "fedired-js";
import XNotifications from "@/components/MkNotifications.vue";
import XNotes from "@/components/MkNotes.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deviceKind } from "@/scripts/device-kind";
import { defaultStore } from "@/store";
import icon from "@/scripts/icon";
import "swiper/scss";
import "swiper/scss/virtual";

const tabs = ["all", "reactions", "mentions", "directNotes"];
const tab = ref(tabs[0]);
watch(tab, () => syncSlide(tabs.indexOf(tab.value)));

const includeTypes = ref<(typeof notificationTypes)[number][] | null>(null);
os.api("notifications/mark-all-as-read");

const MOBILE_THRESHOLD = 500;
const isMobile = ref(
	deviceKind === "smartphone" || window.innerWidth <= MOBILE_THRESHOLD,
);
window.addEventListener("resize", () => {
	isMobile.value =
		deviceKind === "smartphone" || window.innerWidth <= MOBILE_THRESHOLD;
});

const mentionsPagination = {
	endpoint: "notes/mentions" as const,
	limit: 10,
};

const directNotesPagination = {
	endpoint: "notes/mentions" as const,
	limit: 10,
	params: {
		visibility: "specified",
	},
};

function setFilter(ev) {
	const typeItems = notificationTypes.map((t) => ({
		text: i18n.t(`_notification._types.${t}`),
		active: includeTypes.value?.includes(t),
		action: () => {
			includeTypes.value = [t];
		},
	}));
	const items =
		includeTypes.value != null
			? [
					{
						icon: `${icon("ph-x")}`,
						text: i18n.ts.clear,
						action: () => {
							includeTypes.value = null;
						},
					},
					null,
					...typeItems,
				]
			: typeItems;
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

const headerActions = computed(() =>
	tab.value === "all"
		? [
				{
					text: i18n.ts.filter,
					icon: `${icon("ph-funnel")}`,
					highlighted: includeTypes.value != null,
					handler: setFilter,
				},
				{
					text: i18n.ts.markAllAsRead,
					icon: `${icon("ph-check")}`,
					handler: () => {
						os.apiWithDialog("notifications/mark-all-as-read");
					},
				},
			]
		: [],
);

const headerTabs = computed(() => [
	{
		key: "all",
		title: i18n.ts.all,
		icon: `${icon("ph-bell")}`,
	},
	{
		key: "reactions",
		title: i18n.ts.reaction,
		icon: `${icon("ph-smiley")}`,
	},
	{
		key: "mentions",
		title: i18n.ts.mentions,
		icon: `${icon("ph-at")}`,
	},
	{
		key: "directNotes",
		title: i18n.ts.directNotes,
		icon: `${icon("ph-envelope-simple-open")}`,
	},
]);

definePageMetadata(
	computed(() => ({
		title: i18n.ts.notifications,
		icon: `${icon("ph-bell")}`,
	})),
);

let swiperRef: SwiperType | null = null;

function setSwiperRef(swiper: SwiperType) {
	swiperRef = swiper;
	syncSlide(tabs.indexOf(tab.value));
	const styles = getComputedStyle(swiper.el);
	swiper.changeLanguageDirection(styles.direction as "rtl" | "ltr");
	if (styles["writing-mode"].startsWith("vertical")) {
		swiper.changeDirection("vertical");
	}
}

function onSlideChange() {
	if (tab.value !== tabs[swiperRef!.activeIndex])
		tab.value = tabs[swiperRef!.activeIndex];
}

function syncSlide(index: number) {
	if (index !== swiperRef!.activeIndex) swiperRef!.slideTo(index);
}
</script>
