<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader :actions="headerActions" :tabs="headerTabs"
		/></template>
		<MkSpacer
			v-if="token"
			:content-max="700"
			:margin-min="16"
			:margin-max="32"
		>
			<div class="_formRoot">
				<FormInput
					v-model="password"
					type="password"
					class="_formBlock"
				>
					<template #prefix
						><i :class="icon('ph-lock')"></i
					></template>
					<template #label>{{ i18n.ts.newPassword }}</template>
				</FormInput>

				<FormButton primary class="_formBlock" @click="save">{{
					i18n.ts.save
				}}</FormButton>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import FormInput from "@/components/form/input.vue";
import FormButton from "@/components/MkButton.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { mainRouter } from "@/router";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const props = defineProps<{
	token?: string;
}>();

const password = ref("");

async function save() {
	await os.apiWithDialog("reset-password", {
		token: props.token,
		password: password.value,
	});
	mainRouter.push("/");
}

onMounted(() => {
	if (props.token == null) {
		os.popup(
			defineAsyncComponent(() => import("@/components/MkForgotPassword.vue")),
			{},
			{},
			"closed",
		);
		mainRouter.push("/");
	}
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.resetPassword,
	icon: `${icon("ph-lock")}`,
});
</script>
