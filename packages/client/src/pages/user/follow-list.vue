<template>
	<div>
		<MkPagination
			v-slot="{ items }"
			ref="list"
			:pagination="
				type === 'following' ? followingPagination : followersPagination
			"
			class="mk-following-or-followers"
		>
			<div class="users">
				<MkUserInfo
					v-for="user in items.map((x) =>
						type === 'following' ? x.followee : x.follower,
					)"
					:key="user.id"
					class="user"
					:user="user"
				/>
			</div>
		</MkPagination>
	</div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { entities } from "fedired-js";
import MkUserInfo from "@/components/MkUserInfo.vue";
import MkPagination from "@/components/MkPagination.vue";

const props = defineProps<{
	user: entities.User;
	type: "following" | "followers";
}>();

const followingPagination = {
	endpoint: "users/following" as const,
	limit: 20,
	params: computed(() => ({
		userId: props.user.id,
	})),
};

const followersPagination = {
	endpoint: "users/followers" as const,
	limit: 20,
	params: computed(() => ({
		userId: props.user.id,
	})),
};
</script>

<style lang="scss" scoped>
.mk-following-or-followers {
	> .users {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		grid-gap: var(--margin);
	}
}
</style>
