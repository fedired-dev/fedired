<template>
	<div class="kmwsukvl">
		<div class="body">
			<div class="top">
				<div
					class="banner"
					:user="me"
					:style="{ backgroundImage: `url(${me.bannerUrl})` }"
				></div>
				<button
					v-click-anime
					v-tooltip.noDelay.right="
						`${i18n.ts.account}: @${me.username}`
					"
					class="item _button account"
					@click="openAccountMenu"
				>
					<MkAvatar
						:user="me"
						class="icon"
						disable-link
					/><!-- <MkAcct class="text" :user="me"/> -->
				</button>
			</div>
			<div class="middle">
				<MkA
					v-click-anime
					class="item index"
					active-class="active"
					to="/"
					exact
				>
					<i :class="icon('ph-house icon ph-fw')"></i
					><span class="text">{{ i18n.ts.timeline }}</span>
				</MkA>
				<template v-for="item in menu">
					<div v-if="item === '-'" class="divider"></div>
					<component
						:is="navbarItemDef[item].to ? 'MkA' : 'button'"
						v-else-if="
							navbarItemDef[item] &&
							navbarItemDef[item].show !== false
						"
						v-click-anime
						class="item _button"
						:class="[item, { active: navbarItemDef[item].active }]"
						active-class="active"
						:to="navbarItemDef[item].to"
						v-on="
							navbarItemDef[item].action
								? { click: navbarItemDef[item].action }
								: {}
						"
					>
						<i
							class="icon ph-fw ph-lg"
							:class="navbarItemDef[item].icon"
						></i
						><span class="text">{{
							i18n.ts[navbarItemDef[item].title]
						}}</span>
						<span
							v-if="navbarItemDef[item].indicated"
							class="indicator"
							:class="{
								animateIndicator: defaultStore.state.animation,
							}"
							><i class="icon ph-circle ph-fill"></i
						></span>
					</component>
				</template>
				<div class="divider"></div>
				<MkA
					v-if="isModerator"
					v-click-anime
					class="item"
					active-class="active"
					to="/admin"
				>
					<i :class="icon('ph-door icon ph-fw')"></i
					><span class="text">{{ i18n.ts.controlPanel }}</span>
				</MkA>
				<MkA
					v-else-if="me.emojiModPerm !== 'unauthorized'"
					v-click-anime
					v-tooltip.noDelay.right="i18n.ts.customEmojis"
					class="item _button"
					active-class="active"
					to="/admin/emojis"
				>
					<i :class="icon('ph-smiley icon ph-fw')"></i
					><span class="text">{{ i18n.ts.customEmojis }}</span>
				</MkA>
				<button v-click-anime class="item _button" @click="more">
					<i :class="icon('ph-dots-three-outline ph-dir icon ph-fw')"></i
					><span class="text">{{ i18n.ts.more }}</span>
					<span
						v-if="otherMenuItemIndicated"
						class="indicator"
						:class="{
							animateIndicator: defaultStore.state.animation,
						}"
						><i class="icon ph-circle ph-fill"></i
					></span>
				</button>
				<MkA
					v-click-anime
					class="item"
					active-class="active"
					to="/settings"
				>
					<i :class="icon('ph-gear-six icon ph-fw')"></i
					><span class="text">{{ i18n.ts.settings }}</span>
				</MkA>
				<div class="divider"></div>
				<MkA
					v-click-anime
					v-tooltip.noDelay.right="i18n.ts.help"
					class="item"
					to="#"
					@click="openHelpMenu"
				>
					<i :class="icon('ph-info help icon ph-xl ph-fw', false)"></i>
					<span class="text">Ayuda </span>
				</MkA>
			</div>
		</div>
		</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, toRef } from "vue";
import * as os from "@/os";
import { navbarItemDef } from "@/navbar";
import { openAccountMenu as openAccountMenu_ } from "@/account";
import { isModerator, me } from "@/me";
import { openHelpMenu_ } from "@/scripts/helpMenu";
import { defaultStore } from "@/store";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";
const menu = toRef(defaultStore.state, "menu");
const otherMenuItemIndicated = computed(() => {
	for (const def in navbarItemDef) {
		if (menu.value.includes(def)) continue;
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});
function openAccountMenu(ev: MouseEvent) {
	openAccountMenu_(
		{
			withExtraOperation: true,
		},
		ev,
	);
}
function openHelpMenu(ev: MouseEvent) {
	openHelpMenu_(ev);
}
function more() {
	os.popup(
		defineAsyncComponent(() => import("@/components/MkLaunchPad.vue")),
		{},
		{},
		"closed",
	);
}
</script>

<style lang="scss" scoped>
.kmwsukvl {
	> .body {
		display: flex;
		flex-direction: column;
		> .top {
			position: sticky;
			inset-block-start: 0;
			z-index: 1;
			padding-block: 2rem;
			padding-inline: 0;
			background: var(--X14);
			-webkit-backdrop-filter: var(--blur, blur(8px));
			backdrop-filter: var(--blur, blur(8px));
			> .banner {
				position: absolute;
				inset-block-start: 0;
				inset-inline-start: 0;
				inline-size: 100%;
				block-size: 100%;
				background-size: cover;
				background-position: center center;
				-webkit-mask-image: linear-gradient(
					var(--gradient-to-block-start),
					rgba(0, 0, 0, 0) 15%,
					rgba(0, 0, 0, 0.75) 100%
				);
				mask-image: linear-gradient(
					var(--gradient-to-block-start),
					rgba(0, 0, 0, 0) 15%,
					rgba(0, 0, 0, 0.75) 100%
				);
			}
			> .account {
				position: relative;
				display: block;
				text-align: center;
				inline-size: 100%;
				> .icon {
					display: inline-block;
					inline-size: 55px;
					aspect-ratio: 1;
				}
			}
		}
		> .bottom {
			position: sticky;
			inset-block-end: 0;
			padding-block: 20px;
			padding-inline: 0;
			background: var(--X14);
			-webkit-backdrop-filter: var(--blur, blur(8px));
			backdrop-filter: var(--blur, blur(8px));
			> .post {
				position: relative;
				display: flex;
				align-items: center;
				inline-size: 100%;
				block-size: 40px;
				color: var(--fgOnAccent);
				font-weight: bold;
				text-align: start;
				&:before {
					content: "";
					display: block;
					inline-size: calc(100% - 38px);
					block-size: 100%;
					margin: auto;
					position: absolute;
					inset: 0;
					border-radius: 999px;
					background: linear-gradient(
						var(--gradient-to-inline-end),
						var(--buttonGradateA),
						var(--buttonGradateB)
					);
				}
				&:hover,
				&.active {
					&:before {
						background: var(--accentLighten);
					}
				}
				> .icon {
					position: relative;
					margin-inline-start: 30px;
					margin-inline-end: 8px;
					inline-size: 32px;
				}
				> .text {
					position: relative;
				}
			}
			> .help {
				position: relative;
				display: block;
				text-align: center;
				inline-size: 100%;
				margin-block-start: 1rem;
				color: var(--navFg);
				> .icon {
					display: inline-block;
					inline-size: 38px;
					aspect-ratio: 1;
				}
			}
			> .instance {
				position: relative;
				display: flex;
				align-items: center;
				padding-inline-start: 30px;
				text-overflow: ellipsis;
				overflow: hidden;
				white-space: nowrap;
				inline-size: 100%;
				text-align: start;
				box-sizing: border-box;
				margin-block-start: 16px;
				> .icon {
					position: relative;
					inline-size: 32px;
					aspect-ratio: 1;
					transform: translateX(-100%);
					inset-inline-start: 50%;
				}
			}
		}
		> .middle {
			flex: 0.1;
			> .divider {
				margin-block: 16px;
				margin-inline: 16px;
				border-block-start: solid 0.5px var(--divider);
			}
			> .item {
				position: relative;
				display: block;
				padding-inline-start: 24px;
				line-height: 2.85rem;
				text-overflow: ellipsis;
				overflow: hidden;
				white-space: nowrap;
				inline-size: 100%;
				text-align: start;
				box-sizing: border-box;
				color: var(--navFg);
				> .icon {
					position: relative;
					inline-size: 32px;
					margin-inline-end: 8px;
				}
				> .indicator {
					position: absolute;
					inset-block-start: 0;
					inset-inline-start: 20px;
					color: var(--navIndicator);
					font-size: 8px;
				}
				> .animateIndicator {
					animation: blink 1s infinite;
				}
				> .text {
					position: relative;
					font-size: 0.9em;
				}
				&:hover {
					text-decoration: none;
					color: var(--navHoverFg);
				}
				&.active {
					color: var(--navActive);
				}
				&:hover,
				&.active {
					&:before {
						content: "";
						display: block;
						inline-size: calc(100% - 24px);
						block-size: 100%;
						margin: auto;
						position: absolute;
						inset: 0;
						border-radius: 999px;
						background: var(--accentedBg);
					}
				}
				.item.active {
					background-color: var(--activeBgColor); // Esto puede hacer que parezca presionado
					color: var(--activeTextColor);
				}
				// Estilos generales para el botón
				&:focus {
					outline: none; // Eliminar el contorno si no es deseado (prueba)
				}
			}
		}
	}
}
</style>