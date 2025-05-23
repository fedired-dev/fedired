<template>
	<div class="mk-app">
		<div v-if="!narrow && !root" class="side">
			<XKanban class="kanban" full />
		</div>

		<div class="main">
			<XKanban v-if="narrow && !root" class="banner" :powered-by="root" />

			<div class="contents">
				<XHeader v-if="!root" class="header" :info="pageInfo" />
				<main>
					<RouterView />
				</main>
				<div v-if="!root" class="powered-by">
					<b
						><MkA to="/">{{ host }}</MkA></b
					>
					<small
						>Powered by
						<a
							href="https://github.com/fedired-dev/fedired"
							target="_blank"
							>Fedired</a
						></small
					>
				</div>
			</div>
		</div>

		<transition :name="defaultStore.state.animation ? 'tray-back' : ''">
			<div
				v-if="showMenu"
				class="menu-back _modalBg"
				@click="showMenu = false"
				@touchstart.passive="showMenu = false"
			></div>
		</transition>

		<transition :name="defaultStore.state.animation ? 'tray' : ''">
			<div v-if="showMenu" class="menu">
				<MkA to="/" class="link" active-class="active"
					><i :class="icon('ph-house icon')"></i
					>{{ i18n.ts.home }}</MkA
				>
				<MkA to="/explore" class="link" active-class="active"
					><i :class="icon('ph-compass icon')"></i
					>{{ i18n.ts.explore }}</MkA
				>
				<MkA to="/channels" class="link" active-class="active"
					><i :class="icon('ph-television icon')"></i
					>{{ i18n.ts.channel }}</MkA
				>
				<MkA to="/pages" class="link" active-class="active"
					><i :class="icon('ph-file-text ph-dir icon')"></i
					>{{ i18n.ts.pages }}</MkA
				>
				<MkA to="/gallery" class="link" active-class="active"
					><i :class="icon('ph-image-square icon')"></i
					>{{ i18n.ts.gallery }}</MkA
				>
				<button
					class="_button link"
					active-class="active"
					@click="search()"
				>
					<i :class="icon('ph-magnifying-glass icon')"></i
					><span>{{ i18n.ts.search }}</span>
				</button>
				<div class="action">
					<button class="_buttonPrimary" @click="signup()">
						{{ i18n.ts.signup }}
					</button>
					<button class="_button" @click="signin()">
						{{ i18n.ts.login }}
					</button>
				</div>
			</div>
		</transition>
	</div>
</template>

<script lang="ts" setup>
import type { ComputedRef } from "vue";
import { computed, onMounted, provide, ref } from "vue";
import XHeader from "./header.vue";
import XKanban from "./kanban.vue";
import { host, instanceName } from "@/config";
import { search } from "@/scripts/search";
import * as os from "@/os";
import XSigninDialog from "@/components/MkSigninDialog.vue";
import XSignupDialog from "@/components/MkSignupDialog.vue";
import { defaultStore } from "@/store";
import { mainRouter } from "@/router";
import type { PageMetadata } from "@/scripts/page-metadata";
import { provideMetadataReceiver } from "@/scripts/page-metadata";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const DESKTOP_THRESHOLD = 1000;

const pageMetadata = ref<null | ComputedRef<PageMetadata>>();

provide("router", mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata.value = info;
	if (pageMetadata.value.value) {
		document.title = `${pageMetadata.value.value.title} | ${instanceName}`;
	}
});

const root = computed(() => mainRouter.currentRoute.value?.name === "index");
const showMenu = ref(false);
const isDesktop = ref(window.innerWidth >= DESKTOP_THRESHOLD);
const narrow = ref(window.innerWidth < 1280);
const meta = ref();

os.api("meta", { detail: true }).then((res) => {
	meta.value = res;
});

function signin() {
	os.popup(
		XSigninDialog,
		{
			autoSet: true,
		},
		{},
		"closed",
	);
}

function signup() {
	os.popup(
		XSignupDialog,
		{
			autoSet: true,
		},
		{},
		"closed",
	);
}

onMounted(() => {
	if (!isDesktop.value) {
		window.addEventListener(
			"resize",
			() => {
				if (window.innerWidth >= DESKTOP_THRESHOLD) isDesktop.value = true;
			},
			{ passive: true },
		);
	}
});

defineExpose({
	showMenu,
});
</script>

<style lang="scss" scoped>
.tray-enter-active,
.tray-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition:
		transform 300ms cubic-bezier(0.23, 1, 0.32, 1),
		opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-enter-from,
.tray-leave-active {
	opacity: 0;
	transform: translateX(-240px);
}

.tray-back-enter-active,
.tray-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-back-enter-from,
.tray-back-leave-active {
	opacity: 0;
}

.mk-app {
	display: flex;
	min-block-size: 100vb;
	background-position: center;
	background-size: cover;
	background-attachment: fixed;

	> .side {
		inline-size: 500px;
		block-size: 100vb;

		> .kanban {
			position: fixed;
			inset-block-start: 0;
			inset-inline-start: 0;
			inline-size: 500px;
			block-size: 100vb;
			overflow: auto;
		}
	}

	> .main {
		flex: 1;
		min-inline-size: 0;

		> .banner {
		}

		> .contents {
			position: relative;
			z-index: 1;

			> .powered-by {
				padding: 28px;
				font-size: 14px;
				text-align: center;
				border-block-start: 1px solid var(--divider);

				> small {
					display: block;
					margin-block-start: 8px;
					opacity: 0.5;
				}
			}
		}
	}

	> .menu-back {
		position: fixed;
		z-index: 1001;
		inset-block-start: 0;
		inset-inline-start: 0;
		inline-size: 100vi;
		block-size: 100vb;
	}

	> .menu {
		position: fixed;
		z-index: 1001;
		inset-block-start: 0;
		inset-inline-start: 0;
		inline-size: 240px;
		block-size: 100vb;
		background: var(--panel);

		> .link {
			display: block;
			padding: 16px;

			> .icon {
				margin-inline-end: 1em;
			}
		}

		> .action {
			padding: 16px;

			> button {
				display: block;
				inline-size: 100%;
				padding: 10px;
				box-sizing: border-box;
				text-align: center;
				border-radius: 999px;

				&._button {
					background: var(--panel);
				}

				&:first-child {
					margin-block-end: 16px;
				}
			}
		}
	}
}
</style>
