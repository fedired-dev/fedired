<template>
	<XModalWindow
		ref="dialog"
		:width="370"
		:height="400"
		@close="dialog!.close()"
		@closed="emit('closed')"
	>
		<template #header>{{ i18n.ts.forgotPassword }}</template>

		<form
			v-if="enableEmail"
			class="bafeceda"
			@submit.prevent="onSubmit"
		>
			<div class="main _formRoot">
				<MkInput
					v-model="username"
					class="_formBlock"
					type="text"
					pattern="^[a-zA-Z0-9_]+$"
					:spellcheck="false"
					autofocus
					required
				>
					<template #label>{{ i18n.ts.username }}</template>
					<template #prefix>@</template>
				</MkInput>

				<MkInput
					v-model="email"
					class="_formBlock"
					type="email"
					:spellcheck="false"
					required
				>
					<template #label>{{ i18n.ts.emailAddress }}</template>
					<template #caption>{{
						i18n.ts._forgotPassword.enterEmail
					}}</template>
				</MkInput>

				<MkButton
					class="_formBlock"
					type="submit"
					:disabled="processing"
					primary
					style="margin: 0 auto"
					>{{ i18n.ts.send }}</MkButton
				>
			</div>
			<div class="sub">
				<MkA to="/about" class="_link">{{
					i18n.ts._forgotPassword.ifNoEmail
				}}</MkA>
			</div>
		</form>
		<div v-else class="bafecedb">
			{{ i18n.ts._forgotPassword.contactAdmin }}
		</div>
	</XModalWindow>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import XModalWindow from "@/components/MkModalWindow.vue";
import MkButton from "@/components/MkButton.vue";
import MkInput from "@/components/form/input.vue";
import * as os from "@/os";
import { getInstanceInfo } from "@/instance";
import { i18n } from "@/i18n";

const emit = defineEmits<{
	(ev: "done"): void;
	(ev: "closed"): void;
}>();

const dialog = ref<InstanceType<typeof XModalWindow> | null>(null);

const username = ref("");
const email = ref("");
const processing = ref(false);

const { enableEmail } = getInstanceInfo();

async function onSubmit() {
	processing.value = true;
	await os.apiWithDialog("request-reset-password", {
		username: username.value,
		email: email.value,
	});
	emit("done");
	dialog.value?.close();
}
</script>

<style lang="scss" scoped>
.bafeceda {
	> .main {
		padding: 24px;
	}

	> .sub {
		border-block-start: solid 0.5px var(--divider);
		padding: 24px;
	}
}

.bafecedb {
	padding: 24px;
}
</style>
