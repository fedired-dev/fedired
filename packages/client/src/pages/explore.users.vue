<template>
	<MkSpacer :content-max="1200">
		<MkTab v-model="origin" style="margin-block-end: var(--margin)">
			<option value="local">{{ i18n.ts.local }}</option>
			<option value="remote">{{ i18n.ts.remote }}</option>
		</MkTab>
		<div v-if="origin === 'local'">
			<template v-if="tag == null">
				<MkFolder class="_gap" persist-key="explore-pinned-users">
					<template #header
						><i
							:class="icon('ph-bookmark ph-fw')"
							style="margin-inline-end: 0.5em"
						></i
						>{{ i18n.ts.pinnedUsers }}</template
					>
					<XUserList :pagination="pinnedUsers" />
				</MkFolder>
				<MkFolder
					v-if="isSignedIn(me)"
					class="_gap"
					persist-key="explore-popular-users"
				>
					<template #header
						><i
							:class="icon('ph-chart-line-up ph-fw')"
							style="margin-inline-end: 0.5em"
						></i
						>{{ i18n.ts.popularUsers }}</template
					>
					<XUserList :pagination="popularUsers" />
				</MkFolder>
				<MkFolder
					v-if="isSignedIn(me)"
					class="_gap"
					persist-key="explore-recently-updated-users"
				>
					<template #header
						><i
							:class="icon('ph-activity ph-fw')"
							style="margin-inline-end: 0.5em"
						></i
						>{{ i18n.ts.recentlyUpdatedUsers }}</template
					>
					<XUserList :pagination="recentlyUpdatedUsers" />
				</MkFolder>
				<MkFolder
					v-if="isSignedIn(me)"
					class="_gap"
					persist-key="explore-recently-registered-users"
				>
					<template #header
						><i
							:class="icon('ph-butterfly ph-fw')"
							style="margin-inline-end: 0.5em"
						></i
						>{{ i18n.ts.recentlyRegisteredUsers }}</template
					>
					<XUserList :pagination="recentlyRegisteredUsers" />
				</MkFolder>
			</template>
		</div>
		<div v-else>
			<MkFolder
				ref="tagsEl"
				:foldable="true"
				:expanded="false"
				class="_gap"
			>
				<template #header
					><i
						:class="icon('ph-compass ph-fw')"
						style="margin-inline-end: 0.5em"
					></i
					>{{ i18n.ts.popularTags }}</template
				>

				<div class="vxjfqztj">
					<MkA
						v-for="tag in tagsLocal"
						:key="'local:' + tag.tag"
						:to="`/tags/${tag.tag}`"
						class="local"
						>{{ tag.tag }}</MkA
					>
					<MkA
						v-for="tag in tagsRemote"
						:key="'remote:' + tag.tag"
						:to="`/tags/${tag.tag}`"
						>{{ tag.tag }}</MkA
					>
				</div>
			</MkFolder>

			<MkFolder v-if="tag != null" :key="`${tag}`" class="_gap">
				<template #header
					><i
						:class="icon('ph-hash ph-fw')"
						style="margin-inline-end: 0.5em"
					></i
					>{{ tag }}</template
				>
				<XUserList :pagination="tagUsers" />
			</MkFolder>

			<template v-if="tag == null && isSignedIn(me)">
				<MkFolder class="_gap">
					<template #header
						><i
							:class="icon('ph-chart-line-up ph-fw')"
							style="margin-inline-end: 0.5em"
						></i
						>{{ i18n.ts.popularUsers }}</template
					>
					<XUserList :pagination="popularUsersF" />
				</MkFolder>
				<MkFolder class="_gap">
					<template #header
						><i
							:class="icon('ph-activity ph-fw')"
							style="margin-inline-end: 0.5em"
						></i
						>{{ i18n.ts.recentlyUpdatedUsers }}</template
					>
					<XUserList :pagination="recentlyUpdatedUsersF" />
				</MkFolder>
				<MkFolder class="_gap">
					<template #header
						><i
							:class="icon('ph-rocket-launch ph-fw')"
							style="margin-inline-end: 0.5em"
						></i
						>{{ i18n.ts.recentlyDiscoveredUsers }}</template
					>
					<XUserList :pagination="recentlyRegisteredUsersF" />
				</MkFolder>
			</template>
		</div>
	</MkSpacer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import XUserList from "@/components/MkUserList.vue";
import MkFolder from "@/components/MkFolder.vue";
import MkTab from "@/components/MkTab.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { isSignedIn, me } from "@/me";
import icon from "@/scripts/icon";

const props = defineProps<{
	tag?: string;
}>();

const origin = ref("local");
const tagsEl = ref<InstanceType<typeof MkFolder>>();
const tagsLocal = ref([]);
const tagsRemote = ref([]);

watch(
	() => props.tag,
	() => {
		if (tagsEl.value) tagsEl.value.toggleContent(props.tag == null);
	},
);

const tagUsers = computed(() => ({
	endpoint: "hashtags/users" as const,
	limit: 30,
	params: {
		tag: props.tag,
		origin: "combined",
		sort: "+follower",
	},
}));

const pinnedUsers = { endpoint: "pinned-users" };
const popularUsers = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		state: "alive",
		origin: "local",
		sort: "+follower",
	},
};
const recentlyUpdatedUsers = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		origin: "local",
		sort: "+updatedAt",
	},
};
const recentlyRegisteredUsers = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		origin: "local",
		state: "alive",
		sort: "+createdAt",
	},
};
const popularUsersF = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		state: "alive",
		origin: "remote",
		sort: "+follower",
	},
};
const recentlyUpdatedUsersF = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		origin: "combined",
		sort: "+updatedAt",
	},
};
const recentlyRegisteredUsersF = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		origin: "combined",
		sort: "+createdAt",
	},
};

os.api("hashtags/list", {
	sort: "+attachedLocalUsers",
	attachedToLocalUserOnly: true,
	limit: 30,
}).then((tags) => {
	tagsLocal.value = tags;
});
os.api("hashtags/list", {
	sort: "+attachedRemoteUsers",
	attachedToRemoteUserOnly: true,
	limit: 30,
}).then((tags) => {
	tagsRemote.value = tags;
});
</script>

<style lang="scss" scoped>
.vxjfqztj {
	> * {
		margin-inline-end: 16px;

		&.local {
			font-weight: bold;
		}
	}
}
</style>
