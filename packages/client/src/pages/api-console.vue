<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader :actions="headerActions" :tabs="headerTabs"
		/></template>
		<MkSpacer :content-max="700">
			<div class="_formRoot">
				<div class="_formBlock">
					<MkInput
						v-model="endpoint"
						:datalist="endpoints"
						class="_formBlock"
						@update:modelValue="onEndpointChange()"
					>
						<template #label>Endpoint</template>
					</MkInput>
					<MkTextarea v-model="body" class="_formBlock" code>
						<template #label>Params (JSON or JSON5)</template>
					</MkTextarea>
					<MkSwitch v-model="withCredential" class="_formBlock">
						With credential
					</MkSwitch>
					<MkButton
						class="_formBlock"
						primary
						:disabled="sending"
						@click="send"
					>
						<template v-if="sending"><MkEllipsis /></template>
						<template v-else
							><i :class="icon('ph-paper-plane-tilt')"></i>
							Send</template
						>
					</MkButton>
				</div>
				<div v-if="res" class="_formBlock">
					<MkTextarea v-model="res" code readonly tall>
						<template #label>Response</template>
					</MkTextarea>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import JSON5 from "json5";
import type { Endpoints } from "fedired-js";
import MkButton from "@/components/MkButton.vue";
import MkInput from "@/components/form/input.vue";
import MkTextarea from "@/components/form/textarea.vue";
import MkSwitch from "@/components/form/switch.vue";
import * as os from "@/os";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const body = ref("{}");
const endpoint = ref("");
const endpoints = ref<any[]>([]);
const sending = ref(false);
const res = ref("");
const withCredential = ref(true);

os.api("endpoints").then((endpointResponse) => {
	endpoints.value = endpointResponse;
});

function send() {
	sending.value = true;
	const requestBody = JSON5.parse(body.value);
	os.api(
		endpoint.value as keyof Endpoints,
		requestBody,
		null,
		withCredential.value,
	).then(
		(resp) => {
			sending.value = false;
			res.value = JSON5.stringify(resp, null, 2);
		},
		(err) => {
			sending.value = false;
			res.value = JSON5.stringify(err, null, 2);
		},
	);
}

function onEndpointChange() {
	os.api(
		"endpoint",
		{ endpoint: endpoint.value },
		withCredential.value ? undefined : null,
	).then((resp) => {
		const endpointBody = {};
		for (const p of resp.params) {
			endpointBody[p.name] =
				p.type === "String"
					? ""
					: p.type === "Number"
						? 0
						: p.type === "Boolean"
							? false
							: p.type === "Array"
								? []
								: p.type === "Object"
									? {}
									: null;
		}
		body.value = JSON5.stringify(endpointBody, null, 2);
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata({
	title: "API console",
	icon: `${icon("ph-terminal-window")}`,
});
</script>
