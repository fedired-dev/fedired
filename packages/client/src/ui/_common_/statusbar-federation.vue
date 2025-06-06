<template>
	<span v-if="!fetching" class="nmidsaqw">
		<template v-if="display === 'marquee'">
			<transition name="change" mode="default">
				<MarqueeText
					:key="key"
					:duration="marqueeDuration"
					:reverse="marqueeReverse"
				>
					<span
						v-for="instance in instances"
						:key="instance.id"
						class="item"
						:class="{ colored }"
						:style="{
							background: colored ? instance.themeColor : null,
						}"
					>
						<img
							class="icon"
							:src="getInstanceIcon(instance)"
							@error="getInstanceIconErrorEvent($event)"
							alt=""
						/>
						<MkA
							:to="`/instance-info/${instance.host}`"
							class="host _monospace"
						>
							{{ instance.host }}
						</MkA>
						<span class="divider"></span>
					</span>
				</MarqueeText>
			</transition>
		</template>
		<template v-else-if="display === 'oneByOne'">
			<!-- TODO -->
		</template>
	</span>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { entities } from "fedired-js";
import MarqueeText from "@/components/MkMarquee.vue";
import * as os from "@/os";
import { useInterval } from "@/scripts/use-interval";
import { getProxiedImageUrlNullable } from "@/scripts/media-proxy";

const props = defineProps<{
	display?: "marquee" | "oneByOne";
	colored?: boolean;
	marqueeDuration?: number;
	marqueeReverse?: boolean;
	oneByOneInterval?: number;
	refreshIntervalSec?: number;
}>();

const instances = ref<entities.Instance[]>([]);
const fetching = ref(true);
const key = ref(0);

const tick = () => {
	os.api("federation/instances", {
		sort: "+lastCommunicatedAt",
		limit: 30,
	}).then((res) => {
		instances.value = res;
		fetching.value = false;
		key.value++;
	});
};

useInterval(tick, Math.max(5000, props.refreshIntervalSec * 1000), {
	immediate: true,
	afterMounted: true,
});

function getInstanceIcon(instance): string {
	return (
		getProxiedImageUrlNullable(instance.faviconUrl, "preview") ??
		getProxiedImageUrlNullable(instance.iconUrl, "preview") ??
		"/client-assets/dummy.png"
	);
}

function getInstanceIconErrorEvent($event) {
	$event.target.src = "/client-assets/dummy.png";
}
</script>

<style lang="scss" scoped>
.change-enter-active,
.change-leave-active {
	position: absolute;
	inset-block-start: 0;
	transition: all 1s ease;
}
.change-enter-from {
	opacity: 0;
	transform: translateY(-100%);
}
.change-leave-to {
	opacity: 0;
	transform: translateY(100%);
}

.nmidsaqw {
	display: inline-block;
	position: relative;

	::v-deep(.item) {
		display: inline-block;
		vertical-align: bottom;
		margin-inline-end: 5em;

		> .icon {
			display: inline-block;
			block-size: var(--height);
			aspect-ratio: 1;
			vertical-align: bottom;
			margin-inline-end: 1em;
		}

		> .host {
			vertical-align: bottom;
		}

		&.colored {
			padding-inline-end: 1em;
			color: #fff;
		}
	}
}
</style>
