<template>
	<div class="_formRoot">
		<FormFolder v-for="x in statusbars" :key="x.id" class="_formBlock">
			<template #label>{{ x.type ?? i18n.ts.notSet }}</template>
			<template #suffix>{{ x.name }}</template>
			<XStatusbar :_id="x.id" :user-lists="userLists" />
		</FormFolder>
		<FormButton primary @click="add">{{ i18n.ts.add }}</FormButton>
	</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { v4 as uuid } from "uuid";
import XStatusbar from "./statusbar.statusbar.vue";
import FormFolder from "@/components/form/folder.vue";
import FormButton from "@/components/MkButton.vue";
import * as os from "@/os";
import { defaultStore } from "@/store";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const statusbars = defaultStore.reactiveState.statusbars;

const userLists = ref();

onMounted(() => {
	os.api("users/lists/list").then((res) => {
		userLists.value = res;
	});
});

async function add() {
	defaultStore.push("statusbars", {
		id: uuid(),
		type: null,
		black: false,
		size: "medium",
		props: {},
	});
}

definePageMetadata({
	title: i18n.ts.statusbar,
	icon: `${icon("ph-list-bullets ph-dir")}`,
	bg: "var(--bg)",
});
</script>
