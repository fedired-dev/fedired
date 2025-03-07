<template>
	<div class="_formRoot">
		<FormSection>
			<template #label>{{ i18n.ts.moveTo }}</template>
			<FormInfo warn class="_formBlock">{{
				i18n.ts.moveAccountDescription
			}}</FormInfo>
			<FormInput v-model="moveToAccount" class="_formBlock">
				<template #prefix
					><i :class="icon('ph-airplane-takeoff')"></i
				></template>
				<template #label>{{ i18n.ts.moveToLabel }}</template>
			</FormInput>
			<FormButton primary danger @click="move(moveToAccount)">
				{{ i18n.ts.moveAccount }}
			</FormButton>
		</FormSection>

		<FormSection>
			<template #label>{{ i18n.ts.moveFrom }}</template>
			<FormInfo warn class="_formBlock">{{
				i18n.ts.moveFromDescription
			}}</FormInfo>
			<FormInput
				v-for="(_, i) in accountAlias"
				v-model="accountAlias[i]"
				class="_formBlock"
			>
				<template #prefix
					><i :class="icon('ph-airplane-landing')"></i
				></template>
				<template #label>{{
					`#${i + 1} ${i18n.ts.moveFromLabel}`
				}}</template>
			</FormInput>
			<FormButton
				class="button"
				:disabled="accountAlias.length >= 10"
				inline
				style="margin-inline-end: 8px"
				@click="add"
				><i :class="icon('ph-plus')"></i> {{ i18n.ts.add }}</FormButton
			>
			<FormButton class="button" inline primary @click="save">
				<i :class="icon('ph-floppy-disk-back')"></i>
				{{ i18n.ts.save }}
			</FormButton>
		</FormSection>
	</div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { acct, type entities } from "fedired-js";
import FormSection from "@/components/form/section.vue";
import FormInput from "@/components/form/input.vue";
import FormButton from "@/components/MkButton.vue";
import FormInfo from "@/components/MkInfo.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { me } from "@/me";
import { refreshAccount } from "@/account";
import icon from "@/scripts/icon";

const moveToAccount = ref("");
const accountAlias = ref([""]);

await init();

async function init() {
	await refreshAccount();
	if (me?.alsoKnownAs && me.alsoKnownAs.length > 0) {
		const aka = me.alsoKnownAs
			.map((uri) => os.api("ap/show", { uri }))
			.map(
				async (user) =>
					`@${acct.toString((await user).object as entities.UserDetailed)}`,
			);
		const accounts = await Promise.all(aka);
		accountAlias.value = accounts.length > 0 ? accounts : [""];
	} else {
		accountAlias.value = [""];
	}
}

async function save(): Promise<void> {
	const i = await os.apiWithDialog("i/known-as", {
		alsoKnownAs: accountAlias.value
			.map((e) => e.trim())
			.filter((e) => e !== ""),
	});
	me.alsoKnownAs = i.alsoKnownAs;
	await init();
}

function add(): void {
	accountAlias.value.push("");
}

async function move(account): Promise<void> {
	const confirm = await os.confirm({
		type: "warning",
		text: i18n.t("migrationConfirm", { account: account.toString() }),
	});
	if (confirm.canceled) return;
	os.apiWithDialog("i/move", {
		moveToAccount: account,
	});
}

definePageMetadata({
	title: i18n.ts.security,
	icon: `${icon("ph-lock")}`,
});
</script>
