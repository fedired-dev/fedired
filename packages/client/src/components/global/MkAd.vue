<template>
	<div
		v-for="chosenItem in chosen"
		v-if="chosen && Array.isArray(chosen) && chosen.length > 0 && defaultStore.state.showAds"
		class="qiivuoyo"
	>
		<div v-if="!showMenu" class="main" :class="chosenItem.place">
			<a :href="chosenItem.url" target="_blank">
				<img :src="chosenItem.imageUrl" />
			</a>
		</div>
	</div>
	<div v-else-if="chosen && !Array.isArray(chosen) && defaultStore.state.showAds" class="qiivuoyo">
		<div v-if="!showMenu" class="main" :class="chosen.place">
			<a :href="chosen.url" target="_blank">
				<img :src="chosen.imageUrl" />
				<button class="_button menu" @click.prevent.stop="toggleMenu">
					<span :class="icon('ph-info info-circle')"></span>
				</button>
			</a>
		</div>
		<div v-else class="menu">
			<div class="body">
				<div>{{ i18n.t("_ad.adsBy", { by: host }) }}</div>
				<!--<MkButton class="button" primary>{{ i18n.ts._ad.like }}</MkButton>-->
				<MkButton
					v-if="chosen.ratio !== 0"
					class="button"
					@click="reduceFrequency"
					>{{ i18n.ts._ad.reduceFrequencyOfThisAd }}</MkButton
				>
				<button class="_textButton" @click="toggleMenu">
					{{ i18n.ts._ad.back }}
				</button>
			</div>
		</div>
	</div>
	<div v-else></div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { getInstanceInfo } from "@/instance";
import { host } from "@/config";
import MkButton from "@/components/MkButton.vue";
import { defaultStore } from "@/store";
import * as os from "@/os";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

// TODO?: rename to community banner
const instanceAds = getInstanceInfo().ads;
type Ad = (typeof instanceAds)[number];

const props = defineProps<{
	prefer: string[];
	specify?: Ad;
}>();

const showMenu = ref(false);
const toggleMenu = (): void => {
	showMenu.value = !showMenu.value;
};

const choseAd = (): Ad | Ad[] | null => {
	if (props.specify) {
		return props.specify;
	}

	const allAds = instanceAds.map((ad) =>
		defaultStore.state.mutedAds.includes(ad.id)
			? {
					...ad,
					ratio: 0,
				}
			: ad,
	);

	let ads = allAds.filter((ad) => props.prefer.includes(ad.place));

	if (ads.length === 0) {
		ads = allAds.filter((ad) => ad.place === "square");
	}

	const lowPriorityAds = ads.filter((ad) => ad.ratio === 0);
	const widgetAds = ads.filter((ad) => ad.place === "widget");
	ads = ads.filter((ad) => ad.ratio !== 0);

	if (widgetAds.length !== 0) {
		return widgetAds;
	} else if (ads.length === 0) {
		if (lowPriorityAds.length !== 0) {
			return lowPriorityAds[Math.floor(Math.random() * lowPriorityAds.length)];
		} else {
			return null;
		}
	}

	const totalFactor = ads.reduce((a, b) => a + b.ratio, 0);
	const r = Math.random() * totalFactor;

	let stackedFactor = 0;
	for (const ad of ads) {
		if (r >= stackedFactor && r <= stackedFactor + ad.ratio) {
			return ad;
		} else {
			stackedFactor += ad.ratio;
		}
	}

	return null;
};

const chosen = ref(choseAd());

function reduceFrequency(): void {
	if (chosen.value == null) return;
	if (Array.isArray(chosen.value)) return;
	if (defaultStore.state.mutedAds.includes(chosen.value.id)) return;
	defaultStore.push("mutedAds", chosen.value.id);
	os.success();
	chosen.value = choseAd();
	showMenu.value = false;
}
</script>

<style lang="scss" scoped>
.qiivuoyo {
	background-size: auto auto;
	background-image: repeating-linear-gradient(
		45deg,
		transparent,
		transparent 8px,
		var(--ad) 8px,
		var(--ad) 14px
	);

	> .main {
		text-align: center;

		> a {
			display: inline-block;
			position: relative;
			vertical-align: bottom;

			&:hover {
				> img {
					filter: contrast(120%);
				}
			}

			> img {
				display: block;
				object-fit: contain;
				margin: auto;
				border-radius: 5px;
			}

			> .menu {
				position: absolute;
				inset-block-start: 1px;
				inset-inline-end: 1px;

				> .info-circle {
					border: 3px solid var(--panel);
					border-radius: 50%;
					background: var(--panel);
				}
			}
		}

		&.widget {
			> a,
			> a > img {
				max-inline-size: min(300px, 100%);
				max-block-size: 300px;
			}
		}

		&.inline {
			padding: 8px;

			> a,
			> a > img {
				max-inline-size: min(600px, 100%);
				max-block-size: 80px;
			}
		}

		&.inline-big {
			padding: 8px;

			> a,
			> a > img {
				max-inline-size: min(600px, 100%);
				max-block-size: 250px;
			}
		}

		&.vertical {
			> a,
			> a > img {
				max-inline-size: min(100px, 100%);
			}
		}
	}

	> .menu {
		padding: 8px;
		text-align: center;

		> .body {
			padding: 8px;
			margin-block: 0;
			margin-inline: auto;
			max-inline-size: 400px;
			border: solid 1px var(--divider);

			> .button {
				margin-block: 8px;
				margin-inline: auto;
			}
		}
	}
}
</style>
