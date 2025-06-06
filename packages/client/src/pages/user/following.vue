<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader :actions="headerActions" :tabs="headerTabs"
		/></template>
		<MkSpacer :content-max="1000">
			<transition name="fade" mode="out-in">
				<div v-if="user">
					<XFollowList :user="user" type="following" />
				</div>
				<MkError v-else-if="error" @retry="fetchUser()" />
				<MkLoading v-else />
			</transition>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { acct, type entities } from "fedired-js";
import XFollowList from "./follow-list.vue";
import * as os from "@/os";
import { definePageMetadata } from "@/scripts/page-metadata";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const props = withDefaults(
	defineProps<{
		acct: string;
	}>(),
	{},
);

const user = ref<null | entities.UserDetailed>(null);
const error = ref(null);

function fetchUser(): void {
	if (props.acct == null) return;
	user.value = null;
	os.api("users/show", acct.parse(props.acct))
		.then((u) => {
			user.value = u;
		})
		.catch((err) => {
			error.value = err;
		});
}

watch(() => props.acct, fetchUser, {
	immediate: true,
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(
	computed(() =>
		user.value
			? {
					icon: `${icon("ph-user")}`,
					title: user.value.name
						? `${user.value.name} (@${user.value.username})`
						: `@${user.value.username}`,
					subtitle: i18n.ts.following,
					userName: user.value,
					avatar: user.value,
				}
			: null,
	),
);
</script>

<style lang="scss" scoped></style>
