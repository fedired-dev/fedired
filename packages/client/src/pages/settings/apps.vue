<template>
	<div class="_formRoot">
		<FormPagination ref="list" :pagination="pagination">
			<template #empty>
				<div class="_fullinfo">
					<img
						src="/static-assets/badges/info.webp"
						class="_ghost"
						alt="Info"
					/>
					<div>{{ i18n.ts.nothing }}</div>
				</div>
			</template>
			<template #default="{ items }">
				<div
					v-for="token in items"
					:key="token.id"
					class="_panel bfomjevm"
				>
					<img
						v-if="token.iconUrl"
						class="icon"
						:src="token.iconUrl"
						alt=""
					/>
					<div class="body">
						<div class="name">{{ token.name }}</div>
						<div class="description">{{ token.description }}</div>
						<div class="_keyValue">
							<div>{{ i18n.ts.installedDate }}:</div>
							<div><MkTime :time="token.createdAt" /></div>
						</div>
						<div class="_keyValue">
							<div>{{ i18n.ts.lastUsedDate }}:</div>
							<div><MkTime :time="token.lastUsedAt" /></div>
						</div>
						<div class="actions">
							<button class="_button" @click="revoke(token)">
								<i :class="icon('ph-trash')"></i>
							</button>
						</div>
						<details>
							<summary>{{ i18n.ts.details }}</summary>
							<ul>
								<li v-for="p in token.permission" :key="p">
									{{ i18n.t(`_permissions.${p}`) }}
								</li>
							</ul>
						</details>
					</div>
				</div>
			</template>
		</FormPagination>
	</div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import FormPagination from "@/components/MkPagination.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const list = ref<any>(null);

const pagination = {
	endpoint: "i/apps" as const,
	limit: 100,
	params: {
		sort: "+lastUsedAt",
	},
};

function revoke(token) {
	os.api("i/revoke-token", { tokenId: token.id }).then(() => {
		list.value.reload();
	});
}

definePageMetadata({
	title: i18n.ts.installedApps,
	icon: `${icon("ph-plug")}`,
});
</script>

<style lang="scss" scoped>
.bfomjevm {
	display: flex;
	padding: 16px;

	> .icon {
		display: block;
		flex-shrink: 0;
		margin-block-start: 0;
		margin-inline-end: 12px;
		margin-block-end: 0;
		margin-inline-start: 0;
		inline-size: 50px;
		block-size: 50px;
		border-radius: 8px;
	}

	> .body {
		inline-size: calc(100% - 62px);
		position: relative;

		> .name {
			font-weight: bold;
		}
	}
}
</style>
