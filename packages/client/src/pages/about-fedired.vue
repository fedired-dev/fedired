<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader :actions="headerActions" :tabs="headerTabs"
		/></template>
		<div style="overflow: clip">
			<MkSpacer :content-max="600" :margin-min="20">
				<div class="_formRoot znqjceqz">
					<div id="debug"></div>
					<div
						ref="containerEl"
						v-panel
						class="_formBlock about"
						:class="{ playing: easterEggEngine != null }"
					>
						<img
							src="/client-assets/about-icon.png"
							alt=""
							class="icon"
							draggable="false"
							@load="iconLoaded"
							@click="gravity"
						/>
						<div class="misskey">Fedired</div>
						<div class="version">v{{ version }}</div>
						<span
							v-for="emoji in easterEggEmojis"
							:key="emoji.id"
							class="emoji"
							:data-physics-x="emoji.left"
							:data-physics-y="emoji.top"
							:class="{
								_physics_circle_: !emoji.emoji.startsWith(':'),
							}"
						>
							<MkEmoji
								class="emoji"
								:emoji="emoji.emoji"
								:custom-emojis="instanceEmojis"
								:is-reaction="false"
								:normal="true"
								:no-style="true"
							/>
						</span>
					</div>
					<div class="_formBlock" style="text-align: center">
						{{ i18n.ts._aboutFedired.about }}<br /><a
							href="https://about.fedired.com/"
							target="_blank"
							class="_link"
							>{{ i18n.ts.learnMore }}</a
						>
					</div>
					<div class="_formBlock" style="text-align: center">
						<MkButton primary rounded inline @click="iLoveMisskey"
							>I <Mfm text="$[jelly ❤]" /> #Fedired</MkButton
						>
					</div>
					<FormSection>
						<div class="_formLinks">
							<FormLink
								to="https://github.com/fedired-dev/fedired"
								external
							>
								<template #icon
									><i :class="icon('ph-code')"></i
								></template>
								{{ i18n.ts._aboutFedired.source }}
								<template #suffix>Source Code</template>
							</FormLink>
							<FormLink
								to="https://crowdin.com/project/fedired/"
								external
							>
								<template #icon
									><i :class="icon('ph-translate')"></i
								></template>
								{{ i18n.ts._aboutFedired.translation }}
								<template #suffix>Translate</template>
							</FormLink>
							<FormLink
								to="https://patreon.com/fedired/"
								external
							>
								<template #icon>
									<i :class="icon('ph-heart')"></i> 
									</template>
								Donar
								<template #suffix>Donation</template>
							</FormLink>
						</div>
					</FormSection>
					<FormSection>
					<template #label>{{ i18n.ts._aboutFedired.projectMembers }}</template>
					<div :class="$style.contributors">
						<a href="https://fedired.com/@srnovus" target="_blank" :class="$style.contributor">
							<img src="https://avatars.githubusercontent.com/u/81489497?v=4" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@srnovus</span>
						</a>
						<a href="https://mastodon.manalejandro.com/@ale" target="_blank" :class="$style.contributor">
							<img src="https://mastodon.manalejandro.com/system/accounts/avatars/110/711/016/774/768/897/original/5c4e90ae3f8432f9.png" :class="$style.contributorAvatar">
							<span :class="$style.contributorUsername">@ale</span>
						</a>
					</div>
				</FormSection>
					<FormSection>
						<template #label>Hecho por</template>
						<div class="contributors">
							<div class="contributor" v-for="contributor in contributors" :key="contributor.username">
								<a :href="contributor.link" target="_blank" class="_contributor">
									<img :src="contributor.avatar" class="contributorAvatar" />
									<span class="contributorUsername">{{ contributor.username }}</span>
								</a>
							</div>
						</div>
					</FormSection>
				</div>
			</MkSpacer>
		</div>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { version } from "@/config";
import FormLink from "@/components/form/link.vue";
import FormSection from "@/components/form/section.vue";
import MkButton from "@/components/MkButton.vue";
import { physics } from "@/scripts/physics";
import { i18n } from "@/i18n";
import { defaultReactions, defaultStore } from "@/store";
import * as os from "@/os";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";
import { getInstanceInfo } from "@/instance";
let easterEggReady = false;
const easterEggEmojis = ref([]);
const easterEggEngine = ref(null);
const containerEl = ref<HTMLElement>();
const instanceEmojis = getInstanceInfo().emojis;
function iconLoaded() {
	const emojis =
		defaultStore.state.reactions.length > 0
			? defaultStore.state.reactions
			: defaultReactions;
	const containerWidth = containerEl.value?.offsetWidth;
	for (let i = 0; i < 32; i++) {
		easterEggEmojis.value.push({
			id: i.toString(),
			top: -(128 + Math.random() * 256),
			left: Math.random() * containerWidth,
			emoji: emojis[Math.floor(Math.random() * emojis.length)],
		});
	}
	nextTick(() => {
		easterEggReady = true;
	});
}
function gravity() {
	if (!easterEggReady) return;
	easterEggReady = false;
	easterEggEngine.value = physics(containerEl.value);
}
function iLoveMisskey() {
	os.post({
		initialText: "I $[jelly ❤] #Fedired",
		instant: true,
	});
}
onBeforeUnmount(() => {
	if (easterEggEngine.value) {
		easterEggEngine.value.stop();
	}
});
const headerActions = computed(() => []);
const headerTabs = computed(() => []);
definePageMetadata({
	title: i18n.ts.aboutFedired,
	icon: null,
});

const contributors = [
	{ username: '@ibootech', link: 'https://fedired.com/@ibootech', avatar: 'https://about.fedired.com/storage/2024/10/iboo.png' },
	{ username: '@joshua', link: 'https://fedired.com/@joshua', avatar: 'https://static.vecteezy.com/system/resources/previews/008/442/086/non_2x/illustration-of-human-icon-user-symbol-icon-modern-design-on-blank-background-free-vector.jpg' },
];

const patrons = [
	'J-REC',
];

</script>

<style lang="scss" scoped>
.znqjceqz {
	> .about {
		position: relative;
		border-radius: var(--MI-radius);

		> .treasure {
			position: absolute;
			top: 60px;
			left: 0;
			right: 0;
			margin: 0 auto;
			width: min-content;

			> .treasureImg {
				width: 25px;
				vertical-align: bottom;
			}
		}

		> .container {
			position: relative;
			text-align: center;
			padding: 16px;

			&.playing {
				&, * {
					user-select: none;
				}

				* {
					will-change: transform;
				}

				> .emoji {
					visibility: visible;
				}
			}

			> .icon {
				display: block;
				width: 80px;
				margin: 0 auto;
				border-radius: 16px;
				position: relative;
				z-index: 1;
			}

			> .fedired {
				margin: 0.75em auto 0 auto;
				width: max-content;
				position: relative;
				z-index: 1;
			}

			> .version {
				margin: 0 auto;
				width: max-content;
				opacity: 0.5;
				position: relative;
				z-index: 1;
			}

			> .emoji {
				position: absolute;
				z-index: 1;
				top: 0;
				left: 0;
				visibility: hidden;

				> .emoji {
					pointer-events: none;
					font-size: 24px;
					width: 24px;
				}
			}
		}
	}
}
</style>

<style lang="scss" module>
.contributors {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	grid-gap: 12px;
}

.contributor {
	display: flex;
	align-items: center;
	padding: 12px;
	background: var(--MI_THEME-buttonBg);
	border-radius: 6px;

	&:hover {
		text-decoration: none;
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.active {
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.contributorAvatar {
	width: 30px;
	border-radius: 100%;
}

.contributorUsername {
	margin-left: 12px;
}

.patronsWithIcon {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	grid-gap: 12px;
}

.patronWithIcon {
	display: flex;
	align-items: center;
	padding: 12px;
	background: var(--MI_THEME-buttonBg);
	border-radius: 6px;
}

.patronIcon {
	width: 24px;
	border-radius: 100%;
}

.patronName {
	margin-left: 12px;
}
</style>
