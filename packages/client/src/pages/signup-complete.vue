<template>
	<div>
		{{ i18n.ts.processing }}
	</div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import * as os from "@/os";
import { signIn } from "@/account";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const props = defineProps<{
	code: string;
}>();

onMounted(async () => {
	await os.alert({
		type: "info",
		text: i18n.t("clickToFinishEmailVerification", { ok: i18n.ts.gotIt }),
	});
	const res = await os.apiWithDialog("signup-pending", {
		code: props.code,
	});
	signIn(res.i, "/");
});

definePageMetadata({
	title: i18n.ts.signup,
	icon: `${icon("ph-user")}`,
});
</script>
