<template>
	<MkSpacer :content-max="800">
		<div v-if="me">
			<div v-if="state == 'waiting'" class="waiting _section">
				<div class="_content">
					<MkLoading />
				</div>
			</div>
			<div v-if="state == 'denied'" class="denied _section">
				<div class="_content">
					<p>{{ i18n.ts._auth.denied }}</p>
				</div>
			</div>
			<div v-else-if="state == 'accepted'" class="accepted _section">
				<div class="_content">
					<p v-if="callback">
						{{ i18n.ts._auth.callback }}<MkEllipsis />
					</p>
					<p v-else>{{ i18n.ts._auth.pleaseGoBack }}</p>
				</div>
			</div>
			<div v-else class="_section">
				<div v-if="name" class="_title">
					{{ i18n.t("_auth.shareAccess", { name: name }) }}
				</div>
				<div v-else class="_title">
					{{ i18n.ts._auth.shareAccessAsk }}
				</div>
				<div class="_content">
					<p>{{ i18n.ts._auth.permissionAsk }}</p>
					<div
						v-if="_permissions.length === 32"
						:class="[$style.permissions]"
					>
						<div
							:class="[$style.permission]"
							style="
								background-color: var(--error);
								color: var(--fgOnAccent);
							"
						>
							<i
								:class="icon('ph-shield-warning ph-xl', false)"
								style="margin-inline-end: 0.5rem"
							></i>
							{{ i18n.ts._permissions.allPermissions }}
						</div>
					</div>
					<div v-else :class="[$style.permissions]">
						<div
							v-for="p in _permissions"
							:key="p"
							:class="[$style.permission]"
						>
							<i
								:class="icon(`ph-${getIcon(p)} ph-xl`, false)"
								style="margin-inline-end: 0.5rem"
							></i>
							{{ i18n.t(`_permissions.${p}`) }}
						</div>
					</div>
				</div>
				<div class="_footer">
					<MkButton inline @click="deny">{{
						i18n.ts.cancel
					}}</MkButton>
					<MkButton inline primary @click="accept">{{
						i18n.ts.accept
					}}</MkButton>
				</div>
			</div>
		</div>
		<div v-else class="signin">
			<MkSignin @login="onLogin" />
		</div>
	</MkSpacer>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import MkSignin from "@/components/MkSignin.vue";
import MkButton from "@/components/MkButton.vue";
import * as os from "@/os";
import { signIn } from "@/account";
import { me } from "@/me";
import { appendQuery, query } from "@/scripts/url";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const props = defineProps<{
	session: string;
	callback?: string;
	name: string;
	icon: string;
	permission: string; // コンマ区切り
}>();

const _permissions = props.permission.split(",");

const state = ref<string | null>(null);

function getIcon(p: string) {
	return p.includes("write") ? "pencil-simple" : "eye";
}

async function accept(): Promise<void> {
	state.value = "waiting";
	await os.api("miauth/gen-token", {
		session: props.session,
		name: props.name,
		iconUrl: props.icon,
		permission: _permissions,
	});

	state.value = "accepted";
	if (props.callback) {
		const cbUrl = new URL(props.callback);
		if (
			["javascript:", "file:", "data:", "mailto:", "tel:", "vbscript:"].includes(
				cbUrl.protocol,
			)
		)
			throw new Error("invalid url");
		location.href = appendQuery(
			props.callback,
			query({
				session: props.session,
			}),
		);
	}
}

function deny(): void {
	state.value = "denied";
}

function onLogin(res): void {
	signIn(res.i);
}
</script>

<style lang="scss" module>
.permissions {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	margin-block-end: 2rem;
}

.permission {
	display: inline-flex;
	padding-block: 0.5rem;
	padding-inline: 1rem;
	border-radius: var(--radius);
	background-color: var(--buttonBg);
	color: var(--fg);
}
</style>
