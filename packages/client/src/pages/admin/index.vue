<template>
	<div ref="el" class="hiyeyicy" :class="{ wide: !narrow }">
		<div v-if="!narrow || currentPage?.route.name == null" class="nav">
			<MkSpacer :content-max="700" :margin-min="16">
				<div class="lxpfedzu">
					<div class="banner">
						<img
							:src="instance.iconUrl || '/favicon.ico'"
							alt=""
							class="icon"
						/>
					</div>

					<MkInfo
						v-if="thereIsUnresolvedAbuseReport"
						warn
						class="info"
						>{{ i18n.ts.thereIsUnresolvedAbuseReportWarning }}
						<MkA to="/admin/abuses" class="_link">{{
							i18n.ts.check
						}}</MkA></MkInfo
					>
					<MkInfo v-if="noMaintainerInformation" warn class="info"
						>{{ i18n.ts.noMaintainerInformationWarning }}
						<MkA to="/admin/settings" class="_link">{{
							i18n.ts.configure
						}}</MkA></MkInfo
					>
					<MkInfo v-if="noBotProtection" warn class="info"
						>{{ i18n.ts.noBotProtectionWarning }}
						<MkA to="/admin/security" class="_link">{{
							i18n.ts.configure
						}}</MkA></MkInfo
					>
					<MkInfo v-if="noEmailServer" warn class="info"
						>{{ i18n.ts.noEmailServerWarning }}
						<MkA to="/admin/email-settings" class="_link">{{
							i18n.ts.configure
						}}</MkA></MkInfo
					>
					<MkInfo v-if="updateAvailable" warn class="info"
						>{{ i18n.ts.updateAvailable }}
						<a
							href="https://github.com/fedired-dev/fedired/releases"
							target="_bank"
							class="_link"
							>{{ i18n.ts.check }}</a
						></MkInfo
					>
					<MkInfo warn class="info"
						>Necesitas ayuda
						<a
							href="https://github.com/orgs/fedired-dev/discussions"
							target="_bank"
							class="_link"
							>Reciber Soporte</a
						></MkInfo
					>
					
					<MkSuperMenu :def="menuDef" :grid="narrow"></MkSuperMenu>
				</div>
			</MkSpacer>
		</div>
		<div v-if="!(narrow && currentPage?.route.name == null)" class="main">
			<RouterView />
		</div>
	</div>
</template>

<script lang="ts" setup>
import {
	computed,
	onActivated,
	onMounted,
	onUnmounted,
	provide,
	ref,
	watch,
} from "vue";
import { i18n } from "@/i18n";
import MkSuperMenu from "@/components/MkSuperMenu.vue";
import MkInfo from "@/components/MkInfo.vue";
import { getInstanceInfo } from "@/instance";
import { version } from "@/config";
import { isAdmin } from "@/me";
import * as os from "@/os";
import { lookupUser } from "@/scripts/lookup-user";
import { lookupFile } from "@/scripts/lookup-file";
import { lookupInstance } from "@/scripts/lookup-instance";
import { defaultStore } from "@/store";
import { useRouter } from "@/router";
import {
	definePageMetadata,
	provideMetadataReceiver,
} from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const isEmpty = (x: string | null) => x == null || x === "";
const el = ref<HTMLElement | null>(null);
const router = useRouter();

const indexInfo = {
	title: i18n.ts.controlPanel,
	icon: `${icon("ph-gear-six")}`,
	hideHeader: true,
};

provide("shouldOmitHeaderTitle", false);

const instance = getInstanceInfo();

const INFO = ref(indexInfo);
const childInfo = ref(null);
const narrow = ref(false);
const noMaintainerInformation =
	isEmpty(instance.maintainerName) || isEmpty(instance.maintainerEmail);
const noBotProtection =
	!instance.disableRegistration &&
	!instance.enableHcaptcha &&
	!instance.enableRecaptcha;
const noEmailServer = !instance.enableEmail;
const thereIsUnresolvedAbuseReport = ref(false);
const updateAvailable = ref(false);
const currentPage = computed(() => router.currentRef.value?.child);

os.api("admin/abuse-user-reports", {
	state: "unresolved",
	limit: 1,
}).then((reports) => {
	if (reports?.length > 0) thereIsUnresolvedAbuseReport.value = true;
});

if (defaultStore.state.showAdminUpdates) {
	os.api("latest-version").then((res) => {
		updateAvailable.value = version < res?.latest_version;
	});
}

const NARROW_THRESHOLD = 600;
const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow.value = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

const menuDef = computed(() => [
	{
		title: i18n.ts.quickAction,
		items: [
			{
				type: "button",
				icon: `${icon("ph-magnifying-glass")}`,
				text: i18n.ts.lookup,
				action: lookup,
			},
			...(instance.disableRegistration
				? [
						{
							type: "button",
							icon: `${icon("ph-user-plus")}`,
							text: i18n.ts.invite,
							action: invite,
						},
					]
				: []),
		],
	},
	{
		title: i18n.ts.administration,
		items: [
			{
				icon: `${icon("ph-gauge")}`,
				text: i18n.ts.dashboard,
				to: "/admin/overview",
				active: currentPage.value?.route.name === "overview",
			},
			{
				icon: `${icon("ph-users")}`,
				text: i18n.ts.users,
				to: "/admin/users",
				active: currentPage.value?.route.name === "users",
			},
			{
				icon: `${icon("ph-smiley")}`,
				text: i18n.ts.customEmojis,
				to: "/admin/emojis",
				active: currentPage.value?.route.name === "emojis",
			},
			{
				icon: `${icon("ph-planet")}`,
				text: i18n.ts.federation,
				to: "/admin/federation",
				active: currentPage.value?.route.name === "federation",
			},
			{
				icon: `${icon("ph-queue")}`,
				text: i18n.ts.jobQueue,
				to: "/admin/queue",
				active: currentPage.value?.route.name === "queue",
			},
			{
				icon: `${icon("ph-cloud")}`,
				text: i18n.ts.files,
				to: "/admin/files",
				active: currentPage.value?.route.name === "files",
			},
			{
				icon: `${icon("ph-megaphone-simple")}`,
				text: i18n.ts.announcements,
				to: "/admin/announcements",
				active: currentPage.value?.route.name === "announcements",
			},
			{
				icon: `${icon("ph-money")}`,
				text: i18n.ts.ads,
				to: "/admin/ads",
				active: currentPage.value?.route.name === "ads",
			},
			{
				icon: `${icon("ph-warning-circle")}`,
				text: i18n.ts.abuseReports,
				to: "/admin/abuses",
				active: currentPage.value?.route.name === "abuses",
			},
		],
	},
	...(isAdmin
		? [
				{
					title: i18n.ts.settings,
					items: [
						{
							icon: `${icon("ph-gear-six")}`,
							text: i18n.ts.general,
							to: "/admin/settings",
							active: currentPage.value?.route.name === "settings",
						},
						{
							icon: `${icon("ph-envelope-simple-open")}`,
							text: i18n.ts.emailServer,
							to: "/admin/email-settings",
							active: currentPage.value?.route.name === "email-settings",
						},
						{
							icon: `${icon("ph-cloud")}`,
							text: i18n.ts.objectStorage,
							to: "/admin/object-storage",
							active: currentPage.value?.route.name === "object-storage",
						},
						{
							icon: `${icon("ph-lock")}`,
							text: i18n.ts.security,
							to: "/admin/security",
							active: currentPage.value?.route.name === "security",
						},
						{
							icon: `${icon("ph-arrows-merge")}`,
							text: i18n.ts.relays,
							to: "/admin/relays",
							active: currentPage.value?.route.name === "relays",
						},
						{
							icon: `${icon("ph-prohibit")}`,
							text: i18n.ts.instanceBlocking,
							to: "/admin/instance-block",
							active: currentPage.value?.route.name === "instance-block",
						},
						{
							icon: `${icon("ph-hash")}`,
							text: i18n.ts.hiddenTags,
							to: "/admin/hashtags",
							active: currentPage.value?.route.name === "hashtags",
						},
						{
							icon: `${icon("ph-ghost")}`,
							text: i18n.ts.proxyAccount,
							to: "/admin/proxy-account",
							active: currentPage.value?.route.name === "proxy-account",
						},
						{
							icon: `${icon("ph-database")}`,
							text: i18n.ts.database,
							to: "/admin/database",
							active: currentPage.value?.route.name === "database",
						},
						{
							icon: `${icon("ph-flask")}`,
							text: i18n.ts._experiments.title,
							to: "/admin/experiments",
							active: currentPage.value?.route.name === "experiments",
						},
					],
				},
			]
		: []),
]);

watch(narrow.value, () => {
	if (currentPage.value?.route.name == null && !narrow.value) {
		router.push("/admin/overview");
	}
});

onMounted(() => {
	ro.observe(el.value);

	narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;
	if (currentPage.value?.route.name == null && !narrow.value) {
		router.push("/admin/overview");
	}
});

onActivated(() => {
	narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow.value && currentPage.value?.route.name == null) {
		router.replace("/admin/overview");
	}
});

onUnmounted(() => {
	ro.disconnect();
});

watch(router.currentRef, (to) => {
	if (
		to?.route.path === "/admin" &&
		to.child?.route.name == null &&
		!narrow.value
	) {
		router.replace("/admin/overview");
	}
});

provideMetadataReceiver((info) => {
	if (info == null) {
		childInfo.value = null;
	} else {
		childInfo.value = info;
	}
});

const invite = () => {
	os.api("admin/invite")
		.then((x) => {
			os.alert({
				type: "info",
				text: x.code,
			});
		})
		.catch((err) => {
			os.alert({
				type: "error",
				text: err,
			});
		});
};

async function lookupNote() {
	const { canceled, result: q } = await os.inputText({
		title: i18n.ts.noteId,
	});
	if (canceled) return;

	os.api(
		"notes/show",
		q.startsWith("http://") || q.startsWith("https://")
			? { url: q.trim() }
			: { noteId: q.trim() },
	)
		.then((note) => {
			os.pageWindow(`/notes/${note.id}`);
		})
		.catch((err) => {
			if (err.code === "NO_SUCH_NOTE") {
				os.alert({
					type: "error",
					text: i18n.ts.notFound,
				});
			}
		});
}

const lookup = (ev) => {
	os.popupMenu(
		[
			{
				text: i18n.ts.user,
				icon: `${icon("ph-user")}`,
				action: () => {
					lookupUser();
				},
			},
			{
				text: i18n.ts.note,
				icon: `${icon("ph-pencil")}`,
				action: () => {
					lookupNote();
				},
			},
			{
				text: i18n.ts.file,
				icon: `${icon("ph-cloud")}`,
				action: () => {
					lookupFile();
				},
			},
			{
				text: i18n.ts.instance,
				icon: `${icon("ph-planet")}`,
				action: () => {
					lookupInstance();
				},
			},
		],
		ev.currentTarget ?? ev.target,
	);
};

definePageMetadata(INFO.value);

defineExpose({
	header: {
		title: i18n.ts.controlPanel,
	},
});
</script>

<style lang="scss" scoped>
.hiyeyicy {
	&.wide {
		display: flex;
		margin-block: 0;
		margin-inline: auto;
		block-size: 100%;

		> .nav {
			inline-size: 32%;
			max-inline-size: 280px;
			box-sizing: border-box;
			border-inline-end: solid 0.5px var(--divider);
			overflow: auto;
			block-size: 100%;
		}

		> .main {
			flex: 1;
			min-inline-size: 0;
		}
	}

	> .nav {
		.lxpfedzu {
			> .info {
				margin-block: 16px;
				margin-inline: 0;
			}

			> .banner {
				margin: 16px;

				> .icon {
					display: block;
					margin: auto;
					block-size: 42px;
				}
			}
		}
	}
}
</style>
