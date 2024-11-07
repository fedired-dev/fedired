<template>
	<MkStickyContainer>
		<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<div style="overflow: clip;">
			<MkSpacer :contentMax="600" :marginMin="20">
				<div class="_gaps_m znqjceqz">
					<div v-panel class="about">
						<div ref="containerEl" class="container" :class="{ playing: easterEggEngine != null }">
							<img src="/client-assets/about-icon.png" alt="" class="icon" draggable="false" @load="iconLoaded" @click="gravity"/>
							<div class="fedired">Fedired</div>
							<div class="version">v{{ version }}</div>
							<span v-for="emoji in easterEggEmojis" :key="emoji.id" class="emoji" :data-physics-x="emoji.left" :data-physics-y="emoji.top" :class="{ _physics_circle_: !emoji.emoji.startsWith(':') }">
								<MkCustomEmoji v-if="emoji.emoji[0] === ':'" class="emoji" :name="emoji.emoji" :normal="true" :noStyle="true" :fallbackToImage="true"/>
								<MkEmoji v-else class="emoji" :emoji="emoji.emoji" :normal="true" :noStyle="true"/>
							</span>
						</div>
						<button v-if="thereIsTreasure" class="_button treasure" @click="getTreasure"><img src="/fluent-emoji/1f3c6.png" class="treasureImg"></button>
					</div>
					<div style="text-align: center;">
						{{ i18n.ts._aboutFedired.about }}<br><a href="https://about.fedired.com/" target="_blank" class="_link">{{ i18n.ts.learnMore }}</a>
					</div>
					<div v-if="$i != null" style="text-align: center;">
						<MkButton primary rounded inline @click="iLoveFedired">I <Mfm text="$[jelly ❤]"/> #Fedired</MkButton>
					</div>
					<FormSection>
						<div class="_gaps_s">
							<FormLink to="https://github.com/fedired-dev/fedired" external>
								<template #icon><i class="ti ti-code"></i></template>
								{{ i18n.ts._aboutFedired.source }} ({{ i18n.ts._aboutFedired.original }})
								<template #suffix>GitHub</template>
							</FormLink>
							<FormLink to="https://crowdin.com/project/fedired" external>
								<template #icon><i class="ti ti-language-hiragana"></i></template>
								{{ i18n.ts._aboutFedired.translation }}
								<template #suffix>Crowdin</template>
							</FormLink>
							<FormLink to="https://www.patreon.com/fedired" external>
								<template #icon><i class="ti ti-pig-money"></i></template>
								{{ i18n.ts._aboutFedired.donate }}
								<template #suffix>Patreon</template>
							</FormLink>
						</div>
					</FormSection>
					<FormSection v-if="instance.repositoryUrl !== 'https://github.com/fedired-dev/fedired'">
						<div class="_gaps_s">
							<MkInfo>
								{{ i18n.tsx._aboutFedired.thisIsModifiedVersion({ name: instance.name }) }}
							</MkInfo>
							<FormLink v-if="instance.repositoryUrl" :to="instance.repositoryUrl" external>
								<template #icon><i class="ti ti-code"></i></template>
								{{ i18n.ts._aboutFedired.source }}
							</FormLink>
							<FormLink v-if="instance.providesTarball" :to="`/tarball/fedired-${version}.tar.gz`" external>
								<template #icon><i class="ti ti-download"></i></template>
								{{ i18n.ts._aboutFedired.source }}
								<template #suffix>Tarball</template>
							</FormLink>
							<MkInfo v-if="!instance.repositoryUrl && !instance.providesTarball" warn>
								{{ i18n.ts.sourceCodeIsNotYetProvided }}
							</MkInfo>
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
						<template #label>Special thanks</template>
						<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));grid-gap:24px;align-items:center;">
							<div>
								<a style="display: inline-block;" class="masknetwork" title="Sushell Guatemala" href="https://sushell.com/" target="_blank"><img style="width: 100%;" src="#" alt="Sushell Guatemala"></a>
							</div>
						</div>
					</FormSection>
					<FormSection>
						<template #label><Mfm text="$[jelly ❤]"/> {{ i18n.ts._aboutFedired.patrons }}</template>
						<div :class="$style.patronsWithIcon">
							<div v-for="patron in patronsWithIcon" :class="$style.patronWithIcon">
								<img :src="patron.icon" :class="$style.patronIcon">
								<span :class="$style.patronName">{{ patron.name }}</span>

							</div>
						</div>
						<div style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); grid-gap: 12px;">
							<div v-for="patron in patrons" :key="patron">{{ patron }}</div>
						</div>
						<p>{{ i18n.ts._aboutFedired.morePatrons }}</p>
					</FormSection>
					<FormSection>
						<template #label><Mfm text="$[jelly ❤]"/> {{ i18n.ts._aboutFedired.patrons }}</template>
						<div :class="$style.patronsWithIcon">
							<div v-for="patron in patronsWithIcon" :class="$style.patronWithIcon">
								<img :src="patron.icon" :class="$style.patronIcon">
								<span :class="$style.patronName">{{ patron.name }}</span>
							</div>
						</div>
						<div style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); grid-gap: 12px;">
							<div v-for="patron in patrons" :key="patron">{{ patron }}</div>
						</div>
						<p>{{ i18n.ts._aboutFedired.morePatrons }}</p>
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
	
	const patronsWithIcon = [{
		name: 'iBootech',
		icon: 'https://fedired.com/files/thumbnail-193ea65e-1289-4486-a5bb-5796ce955e06',
	},{
		name: 'Joshua',
		icon: 'https://fedired.com/files/thumbnail-1a535f39-ebe1-43df-95e9-d0729ad0e2d6',
	},
	];
	
	const patrons = [
		'J-REC',
	];
	
	const thereIsTreasure = ref($i && !claimedAchievements.includes('foundTreasure'));
	
	let easterEggReady = false;
	const easterEggEmojis = ref<{
		id: string,
		top: number,
		left: number,
		emoji: string
	}[]>([]);
	const easterEggEngine = ref<{ stop: () => void } | null>(null);
	const containerEl = shallowRef<HTMLElement>();
	
	function iconLoaded() {
		const emojis = defaultStore.state.reactions;
		const containerWidth = containerEl.value.offsetWidth;
		for (let i = 0; i < 32; i++) {
			easterEggEmojis.value.push({
				id: i.toString(),
				top: -(128 + (Math.random() * 256)),
				left: (Math.random() * containerWidth),
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
	
	function iLoveFedired() {
		os.post({
			initialText: 'I $[jelly ❤] #Fedired',
			instant: true,
		});
	}
	
	function getTreasure() {
		thereIsTreasure.value = false;
		claimAchievement('foundTreasure');
	}
	
	onBeforeUnmount(() => {
		if (easterEggEngine.value) {
			easterEggEngine.value.stop();
		}
	});
	
	const headerActions = computed(() => []);
	
	const headerTabs = computed(() => []);
	
	definePageMetadata(() => ({
		title: i18n.ts.aboutFedired,
		icon: null,
	}));
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
	