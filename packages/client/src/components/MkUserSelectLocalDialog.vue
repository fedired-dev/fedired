<template>
	<XModalWindow
		ref="dialogEl"
		:with-ok-button="true"
		:ok-button-disabled="selected == null"
		@click="cancel()"
		@close="cancel()"
		@ok="ok()"
		@closed="$emit('closed')"
	>
		<template #header>{{ i18n.ts.selectUser }}</template>
		<div class="tbhwbxdg">
			<div class="form">
				<FormSplit :min-width="170">
					<MkInput
						v-model="username"
						:autofocus="true"
						@update:modelValue="search"
					>
						<template #label>{{ i18n.ts.username }}</template>
						<template #prefix>@</template>
					</MkInput>
				</FormSplit>
			</div>
			<div
				v-if="username != ''"
				class="result"
				:class="{ hit: users.length > 0 }"
			>
				<div v-if="users.length > 0" class="users">
					<div
						v-for="user in users"
						:key="user.id"
						class="user"
						:class="{
							selected: selected && selected.id === user.id,
						}"
						@click="selected = user"
						@dblclick="ok()"
					>
						<MkAvatar
							:user="user"
							class="avatar"
							:show-indicator="true"
							disable-link
						/>
						<div class="body">
							<MkUserName :user="user" class="name" />
							<MkAcct :user="user" class="acct" />
						</div>
					</div>
				</div>
				<div v-else class="empty">
					<span>{{ i18n.ts.noUsers }}</span>
				</div>
			</div>
			<div v-if="username == ''" class="recent">
				<div class="users">
					<div
						v-for="user in recentUsers"
						:key="user.id"
						class="user"
						:class="{
							selected: selected && selected.id === user.id,
						}"
						@click="selected = user"
						@dblclick="ok()"
					>
						<MkAvatar
							:user="user"
							class="avatar"
							:show-indicator="true"
							disable-link
						/>
						<div class="body">
							<MkUserName :user="user" class="name" />
							<MkAcct :user="user" class="acct" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</XModalWindow>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import type { entities } from "fedired-js";
import MkInput from "@/components/form/input.vue";
import FormSplit from "@/components/form/split.vue";
import XModalWindow from "@/components/MkModalWindow.vue";
import * as os from "@/os";
import { defaultStore } from "@/store";
import { i18n } from "@/i18n";

const emit = defineEmits<{
	ok: [selected: entities.UserDetailed];
	cancel: [];
	closed: [];
}>();

const username = ref("");
const users = ref([] as entities.UserDetailed[]);
const recentUsers = ref([] as entities.UserDetailed[]);
const selected = ref<entities.UserDetailed | null>(null);
const dialogEl = ref();

const search = () => {
	if (username.value === "") {
		users.value = [];
		return;
	}
	os.api("users/search", {
		query: username.value,
		origin: "local",
		limit: 10,
		detail: true,
	}).then((_users) => {
		users.value = _users;
	});
};

const ok = () => {
	if (selected.value == null) return;
	emit("ok", selected.value);
	dialogEl.value.close();

	// 最近使ったユーザー更新
	let recents = defaultStore.state.recentlyUsedUsers;
	recents = recents.filter((x) => x !== selected.value!.id);
	recents.unshift(selected.value.id);
	defaultStore.set("recentlyUsedUsers", recents.splice(0, 16));
};

const cancel = () => {
	emit("cancel");
	dialogEl.value.close();
};

onMounted(() => {
	os.api("users/show", {
		userIds: defaultStore.state.recentlyUsedUsers,
	}).then((users) => {
		recentUsers.value = users;
	});
});
</script>

<style lang="scss" scoped>
.tbhwbxdg {
	> .form {
		padding-block: 0;
		padding-inline: var(--root-margin);
	}

	> .result,
	> .recent {
		display: flex;
		flex-direction: column;
		overflow: auto;
		block-size: 100%;

		&.result.hit {
			padding: 0;
		}

		&.recent {
			padding: 0;
		}

		> .users {
			flex: 1;
			overflow: auto;
			padding-block: 8px;
			padding-inline: 0;

			> .user {
				display: flex;
				align-items: center;
				padding-block: 8px;
				padding-inline: var(--root-margin);
				font-size: 14px;

				&:hover {
					background: var(--X7);
				}

				&.selected {
					background: var(--accent);
					color: #fff;
				}

				> * {
					pointer-events: none;
					user-select: none;
				}

				> .avatar {
					inline-size: 45px;
					block-size: 45px;
				}

				> .body {
					padding-block: 0;
					padding-inline: 8px;
					min-inline-size: 0;

					> .name {
						display: block;
						font-weight: bold;
					}

					> .acct {
						opacity: 0.5;
					}
				}
			}
		}

		> .empty {
			opacity: 0.7;
			text-align: center;
		}
	}
}
</style>
