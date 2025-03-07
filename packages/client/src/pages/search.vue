<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				v-model:tab="tab"
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="800">
			<swiper
				:round-lengths="true"
				:touch-angle="25"
				:threshold="10"
				:centered-slides="true"
				:modules="[Virtual]"
				:space-between="30"
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
					<XNotes ref="notes" :pagination="notesPagination" />
				</swiper-slide>
				<swiper-slide>
					<XUserList
						ref="users"
						class="_gap"
						:pagination="usersPagination"
					/>
				</swiper-slide>
			</swiper>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import moment from "moment";
import XNotes from "@/components/MkNotes.vue";
import XUserList from "@/components/MkUserList.vue";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { defaultStore } from "@/store";
import { deviceKind } from "@/scripts/device-kind";
import icon from "@/scripts/icon";
import { me } from "@/me";
import "swiper/scss";
import "swiper/scss/virtual";
import { api } from "@/os";

const props = defineProps<{
	query?: string;
	user?: string;
	host?: string;
	since?: string;
	until?: string;
	channel?: string;
	withFiles: "0" | "1";
	searchCwAndAlt: "0" | "1";
}>();

const userId = props.user == null ? undefined : await getUserId(props.user);

const notesPagination = {
	endpoint: "notes/search" as const,
	limit: 10,
	params: computed(() => ({
		query: props.query ?? undefined,
		userId,
		host: props.host == null ? undefined : getHost(props.host),
		sinceDate:
			props.since == null ? undefined : getUnixTime(props.since, false),
		untilDate: props.until == null ? undefined : getUnixTime(props.until, true),
		withFiles: props.withFiles === "1",
		searchCwAndAlt: props.searchCwAndAlt === "1",
		channelId: props.channel,
	})),
};

const usersPagination = {
	endpoint: "users/search" as const,
	limit: 10,
	params: computed(() => ({
		// FIXME: query is necessary for user search
		query: props.query!,
		origin: "combined" as const,
	})),
};

async function getUserId(user: string): Promise<string> {
	if (user === "me") return me!.id;

	const split = (user.startsWith("@") ? user.slice(1) : user).split("@");
	const username = split[0];
	const host = split.length === 1 ? undefined : split[1];

	return (await api("users/show", { username, host })).id;
}

function getHost(host: string): string | null {
	if (host === "local") return null;
	return host;
}

function getUnixTime(date: string, nextDay: boolean): number {
	return moment(date, date.length === 4 ? "MMDD" : "YYYYMMDD")
		.add(nextDay ? 1 : 0, "days")
		.valueOf();
}

const tabs = ["notes", "users"];
const tab = ref(tabs[0]);
watch(tab, () => syncSlide(tabs.indexOf(tab.value)));

const headerActions = computed(() => []);

const headerTabs = computed(() => [
	{
		key: "notes",
		icon: `${icon("ph-magnifying-glass")}`,
		title: i18n.ts.notes,
	},
	{
		key: "users",
		icon: `${icon("ph-users")}`,
		title: i18n.ts.users,
	},
]);

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

definePageMetadata(
	computed(() => ({
		title: i18n.t("searchWith", { q: props.query }),
		icon: `${icon("ph-magnifying-glass")}`,
	})),
);
</script>
