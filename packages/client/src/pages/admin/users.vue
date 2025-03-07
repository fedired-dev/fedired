<template>
	<div>
		<MkStickyContainer>
			<template #header
				><MkPageHeader
					:actions="headerActions"
					:tabs="headerTabs"
					:display-back-button="true"
			/></template>
			<MkSpacer :content-max="900">
				<div class="lknzcolw">
					<div class="users">
						<div class="inputs">
							<MkSelect v-model="sort" style="flex: 1">
								<template #label>{{ i18n.ts.sort }}</template>
								<option value="-createdAt">
									{{ i18n.ts.registeredDate }} ({{
										i18n.ts.ascendingOrder
									}})
								</option>
								<option value="+createdAt">
									{{ i18n.ts.registeredDate }} ({{
										i18n.ts.descendingOrder
									}})
								</option>
								<option value="-updatedAt">
									{{ i18n.ts.lastUsed }} ({{
										i18n.ts.ascendingOrder
									}})
								</option>
								<option value="+updatedAt">
									{{ i18n.ts.lastUsed }} ({{
										i18n.ts.descendingOrder
									}})
								</option>
							</MkSelect>
							<MkSelect v-model="state" style="flex: 1">
								<template #label>{{ i18n.ts.state }}</template>
								<option value="all">{{ i18n.ts.all }}</option>
								<option value="available">
									{{ i18n.ts.normal }}
								</option>
								<option value="admin">
									{{ i18n.ts.administrator }}
								</option>
								<option value="moderator">
									{{ i18n.ts.moderator }}
								</option>
								<option value="silenced">
									{{ i18n.ts.silence }}
								</option>
								<option value="suspended">
									{{ i18n.ts.suspend }}
								</option>
							</MkSelect>
							<MkSelect v-model="origin" style="flex: 1">
								<template #label>{{
									i18n.ts.instance
								}}</template>
								<option value="combined">
									{{ i18n.ts.all }}
								</option>
								<option value="local">
									{{ i18n.ts.local }}
								</option>
								<option value="remote">
									{{ i18n.ts.remote }}
								</option>
							</MkSelect>
						</div>
						<div class="inputs">
							<MkInput
								v-model="searchUsername"
								style="flex: 1"
								type="text"
								:spellcheck="false"
								@update:modelValue="$refs.users.reload()"
							>
								<template #prefix>@</template>
								<template #label>{{
									i18n.ts.username
								}}</template>
							</MkInput>
							<MkInput
								v-model="searchHost"
								style="flex: 1"
								type="text"
								:spellcheck="false"
								:disabled="pagination.params.origin === 'local'"
								@update:modelValue="$refs.users.reload()"
							>
								<template #prefix>@</template>
								<template #label>{{ i18n.ts.host }}</template>
							</MkInput>
						</div>

						<MkPagination
							v-slot="{ items }"
							ref="paginationComponent"
							:pagination="pagination"
							class="users"
						>
							<MkUserCardMini
								v-for="user in items"
								:key="user.id"
								v-tooltip.mfm="
									user.updatedAt
										? `Last posted: ${new Date(
												user.updatedAt,
											).toLocaleString()}`
										: 'Never posted'
								"
								class="user"
								:user="user"
								:show-about-page="true"
							/>
						</MkPagination>
					</div>
				</div>
			</MkSpacer>
		</MkStickyContainer>
	</div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import MkInput from "@/components/form/input.vue";
import MkSelect from "@/components/form/select.vue";
import MkPagination, {
	type MkPaginationType,
} from "@/components/MkPagination.vue";
import * as os from "@/os";
import { lookupUser } from "@/scripts/lookup-user";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import MkUserCardMini from "@/components/MkUserCardMini.vue";
import icon from "@/scripts/icon";

const paginationComponent = ref<MkPaginationType<
	typeof pagination.endpoint
> | null>(null);

const sort = ref("+createdAt");
const state = ref("all");
const origin = ref("local");
const searchUsername = ref("");
const searchHost = ref("");
const pagination = {
	endpoint: "admin/show-users" as const,
	limit: 10,
	params: computed(() => ({
		sort: sort.value,
		state: state.value,
		origin: origin.value,
		username: searchUsername.value,
		hostname: searchHost.value,
	})),
	offsetMode: true,
};

function searchUser() {
	os.selectUser().then((user) => {
		show(user);
	});
}

async function addUser() {
	const { canceled: canceled1, result: username } = await os.inputText({
		title: i18n.ts.username,
	});
	if (canceled1) return;

	const { canceled: canceled2, result: password } = await os.inputText({
		title: i18n.ts.password,
		type: "password",
	});
	if (canceled2) return;

	os.apiWithDialog("admin/accounts/create", {
		username,
		password,
	}).then((res) => {
		paginationComponent.value.reload();
	});
}

function show(user) {
	os.pageWindow(`/user-info/${user.id}`);
}

const headerActions = computed(() => [
	{
		icon: `${icon("ph-magnifying-glass")}`,
		text: i18n.ts.search,
		handler: searchUser,
	},
	{
		asFullButton: true,
		icon: `${icon("ph-plus")}`,
		text: i18n.ts.addUser,
		handler: addUser,
	},
	{
		asFullButton: true,
		icon: `${icon("ph-magnifying-glass")}`,
		text: i18n.ts.lookup,
		handler: lookupUser,
	},
]);

const headerTabs = computed(() => []);

definePageMetadata(
	computed(() => ({
		title: i18n.ts.users,
		icon: `${icon("ph-users")}`,
	})),
);
</script>

<style lang="scss" scoped>
.lknzcolw {
	> .users {
		> .inputs {
			display: flex;
			gap: 0.4rem;
			margin-block-end: 16px;

			> * {
				margin-inline-end: 16px;

				&:last-child {
					margin-inline-end: 0;
				}
			}
		}

		> .users {
			margin-block-start: var(--margin);
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
			grid-gap: 12px;

			> .user:hover {
				text-decoration: none;
			}
		}
	}
}
</style>
