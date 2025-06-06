<template>
	<XModalWindow
		ref="dialogEl"
		:with-ok-button="true"
		:ok-button-disabled="selected == null"
		@click="cancel()"
		@close="cancel()"
		@ok="ok()"
		@closed="$emit('closed')"
	>
		<template #header>{{ i18n.ts.selectInstance }}</template>
		<div class="mehkoush">
			<div class="form">
				<MkInput
					v-model="hostname"
					:autofocus="true"
					@update:modelValue="search"
				>
					<template #label>{{ i18n.ts.instance }}</template>
				</MkInput>
			</div>
			<div
				v-if="hostname != ''"
				class="result"
				:class="{ hit: instances.length > 0 }"
			>
				<div v-if="instances.length > 0" class="instances">
					<div
						v-for="item in instances"
						:key="item.id"
						class="instance"
						:class="{
							selected: selected && selected.id === item.id,
						}"
						@click="selected = item"
						@dblclick="ok()"
					>
						<div class="body">
							<img
								class="icon"
								:src="
									item.iconUrl ?? '/client-assets/dummy.png'
								"
								aria-hidden="true"
							/>
							<span class="name">{{ item.host }}</span>
						</div>
					</div>
				</div>
				<div v-else class="empty">
					<span>{{ i18n.ts.noInstances }}</span>
				</div>
			</div>
		</div>
	</XModalWindow>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import type { entities } from "fedired-js";
import MkInput from "@/components/form/input.vue";
import XModalWindow from "@/components/MkModalWindow.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";

const emit = defineEmits<{
	ok: [selected: entities.Instance];
	cancel: [];
	closed: [];
}>();

const hostname = ref("");
const instances = ref<entities.Instance[]>([]);
const selected = ref<entities.Instance | null>(null);
const dialogEl = ref<InstanceType<typeof XModalWindow>>();

let searchOrderLatch = 0;
const search = () => {
	if (hostname.value === "") {
		instances.value = [];
		return;
	}

	const searchId = ++searchOrderLatch;
	os.api("federation/instances", {
		host: hostname.value,
		limit: 10,
		blocked: false,
		suspended: false,
		sort: "+pubSub",
	}).then((_instances) => {
		if (searchId !== searchOrderLatch) return;
		instances.value = _instances.map(
			(x) =>
				({
					id: x.id,
					host: x.host,
					iconUrl: x.iconUrl,
				}) as entities.Instance,
		);
	});
};

const ok = () => {
	if (selected.value == null) return;
	emit("ok", selected.value);
	dialogEl.value?.close();
};

const cancel = () => {
	emit("cancel");
	dialogEl.value?.close();
};
</script>

<style lang="scss" scoped>
.mehkoush {
	margin-block: var(--marginFull);
	margin-inline: 0;

	> .form {
		padding-block: 0;
		padding-inline: var(--root-margin);
	}

	> .result {
		display: flex;
		flex-direction: column;
		overflow: auto;
		block-size: 100%;

		&.result.hit {
			padding: 0;
		}

		> .instances {
			flex: 1;
			overflow: auto;
			padding-block: 8px;
			padding-inline: 0;

			> .instance {
				display: flex;
				align-items: center;
				padding-block: 8px;
				padding-inline: var(--root-margin);
				font-size: 14px;

				&:hover {
					background: var(--X7);
				}

				&.selected {
					background: var(--accent);
					color: #fff;
				}

				> * {
					pointer-events: none;
					user-select: none;
				}

				> .body {
					padding-block: 0;
					padding-inline: 8px;
					inline-size: 100%;

					> .name {
						display: block;
						font-weight: bold;
					}

					> .icon {
						inline-size: 16px;
						block-size: 16px;
						margin-inline-end: 8px;
						float: inline-start;
					}
				}
			}
		}

		> .empty {
			opacity: 0.7;
			text-align: center;
		}
	}
}
</style>
