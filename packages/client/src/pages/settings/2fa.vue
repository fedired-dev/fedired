<template>
	<FormSection :first="first">
		<template #label>{{ i18n.ts["2fa"] }}</template>

		<div v-if="me" class="_gaps_s">
			<MkFolder>
				<template #icon
					><i
						:class="icon('ph-shield-check')"
						style="margin-inline-end: 0.5rem"
					></i
				></template>
				<template #label>{{ i18n.ts.totp }}</template>
				<template #caption>{{ i18n.ts.totpDescription }}</template>
				<div v-if="me.twoFactorEnabled" class="_gaps_s">
					<div v-text="i18n.ts._2fa.alreadyRegistered" />
					<MkButton @click="unregisterTOTP"
						><i
							:class="icon('ph-shield-slash')"
							style="margin-inline-end: 0.5rem"
						></i
						>{{ i18n.ts.unregister }}</MkButton
					>
				</div>

				<MkButton
					v-else-if="!twoFactorData && !me.twoFactorEnabled"
					@click="registerTOTP"
					>{{ i18n.ts._2fa.registerTOTP }}</MkButton
				>
			</MkFolder>

			<MkFolder>
				<template #icon
					><i :class="icon('ph-key')" style="margin-inline-end: 0.5rem"></i
				></template>
				<template #label>{{ i18n.ts.securityKeyAndPasskey }}</template>
				<div class="_gaps_s">
					<MkInfo>
						{{ i18n.ts._2fa.securityKeyInfo }}<br />
						<br />
						{{ i18n.ts._2fa.chromePasskeyNotSupported }}
					</MkInfo>

					<MkInfo v-if="!supportsCredentials" warn>
						{{ i18n.ts._2fa.securityKeyNotSupported }}
					</MkInfo>

					<template v-else>
						<MkButton primary @click="addSecurityKey"
							><i
								:class="icon('ph-key')"
								style="margin-inline-end: 0.5rem"
							></i
							>{{ i18n.ts._2fa.registerSecurityKey }}</MkButton
						>
						<MkFolder
							v-for="key in me.securityKeysList"
							:key="key.id"
						>
							<h3>{{ key.name }}</h3>
							<p>
								{{ `${i18n.ts.lastUsedDate}: ${key.lastUsed}` }}
							</p>
							<div class="_flexList">
								<MkButton @click="renameKey(key)"
									><i :class="icon('ph-pencil-line')"></i>
									{{ i18n.ts.rename }}</MkButton
								>
								<MkButton danger @click="unregisterKey(key)"
									><i :class="icon('ph-trash')"></i>
									{{ i18n.ts.unregister }}</MkButton
								>
							</div>
						</MkFolder>
					</template>
				</div>
			</MkFolder>

			<MkSwitch
				:disabled="
					!me.twoFactorEnabled || me.securityKeysList.length === 0
				"
				:model-value="usePasswordLessLogin"
				@update:modelValue="(v) => updatePasswordLessLogin(v)"
			>
				<template #label>{{ i18n.ts.passwordLessLogin }}</template>
				<template #caption>{{
					i18n.ts.passwordLessLoginDescription
				}}</template>
			</MkSwitch>
		</div>
	</FormSection>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from "vue";
import { hostname } from "@/config";
import { byteify, hexify, stringify } from "@/scripts/2fa";
import MkButton from "@/components/MkButton.vue";
import MkInfo from "@/components/MkInfo.vue";
import MkSwitch from "@/components/form/switch.vue";
import FormSection from "@/components/form/section.vue";
import MkFolder from "@/components/MkFolder.vue";
import * as os from "@/os";
import { me } from "@/me";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

// メモ: 各エンドポイントはmeUpdatedを発行するため、refreshAccountは不要

withDefaults(
	defineProps<{
		first?: boolean;
	}>(),
	{
		first: false,
	},
);

const twoFactorData = ref<any>(null);
const supportsCredentials = ref(!!navigator.credentials);
const usePasswordLessLogin = computed(() => me!.usePasswordLessLogin);

async function registerTOTP() {
	const password = await os.inputText({
		title: i18n.ts._2fa.registerTOTP,
		text: i18n.ts.currentPassword,
		type: "password",
		autocomplete: "current-password",
	});
	if (password.canceled) return;

	const twoFactorData = await os.apiWithDialog("i/2fa/register", {
		password: password.result,
	});

	const qrdialog = await new Promise<boolean>((res) => {
		os.popup(
			defineAsyncComponent(() => import("./2fa.qrdialog.vue")),
			{
				twoFactorData,
			},
			{
				ok: () => res(true),
				cancel: () => res(false),
			},
			"closed",
		);
	});
	if (!qrdialog) return;

	const token = await os.inputText({
		title: i18n.ts._2fa.step3Title,
		text: i18n.ts._2fa.step3,
		autocomplete: "one-time-code",
	});
	if (token.canceled) return;

	await os.apiWithDialog("i/2fa/done", {
		token: token.result,
	});

	await os.alert({
		type: "success",
		text: i18n.ts._2fa.step4,
	});
}

function unregisterTOTP() {
	os.inputText({
		title: i18n.ts.password,
		type: "password",
		autocomplete: "current-password",
	}).then(({ canceled, result: password }) => {
		if (canceled) return;
		os.apiWithDialog("i/2fa/unregister", {
			password,
		}).catch((error) => {
			os.alert({
				type: "error",
				text: error,
			});
		});
	});
}

async function unregisterKey(key) {
	const confirm = await os.confirm({
		type: "question",
		title: i18n.ts._2fa.removeKey,
		text: i18n.t("_2fa.removeKeyConfirm", { name: key.name }),
	});
	if (confirm.canceled) return;

	const password = await os.inputText({
		title: i18n.ts.password,
		type: "password",
		autocomplete: "current-password",
	});
	if (password.canceled) return;

	await os.apiWithDialog("i/2fa/remove-key", {
		password: password.result,
		credentialId: key.id,
	});
	os.success();
}

async function renameKey(key) {
	const name = await os.inputText({
		title: i18n.ts.rename,
		default: key.name,
		type: "text",
		minLength: 1,
		maxLength: 30,
	});
	if (name.canceled) return;

	await os.apiWithDialog("i/2fa/update-key", {
		name: name.result,
		credentialId: key.id,
	});
}

async function addSecurityKey() {
	const password = await os.inputText({
		title: i18n.ts.password,
		type: "password",
		autocomplete: "current-password",
	});
	if (password.canceled) return;

	const challenge: any = await os.apiWithDialog("i/2fa/register-key", {
		password: password.result,
	});

	const name = await os.inputText({
		title: i18n.ts._2fa.registerSecurityKey,
		text: i18n.ts._2fa.securityKeyName,
		type: "text",
		minLength: 1,
		maxLength: 30,
	});
	if (name.canceled) return;

	const webAuthnCreation = navigator.credentials.create({
		publicKey: {
			challenge: byteify(challenge.challenge, "base64"),
			rp: {
				id: hostname,
				name: "Fedired",
			},
			user: {
				id: byteify(me!.id, "ascii"),
				name: me!.username,
				displayName: me!.name,
			},
			pubKeyCredParams: [{ alg: -7, type: "public-key" }],
			timeout: 60000,
			attestation: "direct",
		},
	}) as Promise<
		| (PublicKeyCredential & { response: AuthenticatorAttestationResponse })
		| null
	>;

	const credential = await os.promiseDialog(
		webAuthnCreation,
		null,
		() => {}, // ユーザーのキャンセルはrejectなのでエラーダイアログを出さない
		i18n.ts._2fa.tapSecurityKey,
	);
	if (!credential) return;

	await os.apiWithDialog("i/2fa/key-done", {
		password: password.result,
		name: name.result,
		challengeId: challenge.challengeId,
		// we convert each 16 bits to a string to serialise
		clientDataJSON: stringify(credential.response.clientDataJSON),
		attestationObject: hexify(credential.response.attestationObject),
	});
}

async function updatePasswordLessLogin(value: boolean) {
	await os.apiWithDialog("i/2fa/password-less", {
		value,
	});
}
</script>
