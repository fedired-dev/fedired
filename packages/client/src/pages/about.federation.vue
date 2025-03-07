<template>
	<div class="taeiyria">
		<div class="query">
			<MkInput v-model="host" :debounce="true" class="">
				<template #prefix
					><i :class="icon('ph-magnifying-glass')"></i
				></template>
				<template #label>{{ i18n.ts.host }}</template>
			</MkInput>
			<FormSplit style="margin-block-start: var(--margin)">
				<MkSelect v-model="state">
					<template #label>{{ i18n.ts.state }}</template>
					<option value="all">{{ i18n.ts.all }}</option>
					<option value="federating">{{ i18n.ts.federating }}</option>
					<option value="subscribing">
						{{ i18n.ts.subscribing }}
					</option>
					<option value="publishing">{{ i18n.ts.publishing }}</option>
					<option value="suspended">{{ i18n.ts.suspended }}</option>
					<option value="blocked">{{ i18n.ts.blocked }}</option>
					<option value="silenced">{{ i18n.ts.silenced }}</option>
					<option value="notResponding">
						{{ i18n.ts.notResponding }}
					</option>
				</MkSelect>
				<MkSelect v-model="sort">
					<template #label>{{ i18n.ts.sort }}</template>
					<option value="+pubSub">
						{{ i18n.ts.pubSub }} ({{ i18n.ts.descendingOrder }})
					</option>
					<option value="-pubSub">
						{{ i18n.ts.pubSub }} ({{ i18n.ts.ascendingOrder }})
					</option>
					<option value="+notes">
						{{ i18n.ts.notes }} ({{ i18n.ts.descendingOrder }})
					</option>
					<option value="-notes">
						{{ i18n.ts.notes }} ({{ i18n.ts.ascendingOrder }})
					</option>
					<option value="+users">
						{{ i18n.ts.users }} ({{ i18n.ts.descendingOrder }})
					</option>
					<option value="-users">
						{{ i18n.ts.users }} ({{ i18n.ts.ascendingOrder }})
					</option>
					<option value="+following">
						{{ i18n.ts.following }} ({{ i18n.ts.descendingOrder }})
					</option>
					<option value="-following">
						{{ i18n.ts.following }} ({{ i18n.ts.ascendingOrder }})
					</option>
					<option value="+followers">
						{{ i18n.ts.followers }} ({{ i18n.ts.descendingOrder }})
					</option>
					<option value="-followers">
						{{ i18n.ts.followers }} ({{ i18n.ts.ascendingOrder }})
					</option>
					<option value="+caughtAt">
						{{ i18n.ts.registeredAt }} ({{
							i18n.ts.descendingOrder
						}})
					</option>
					<option value="-caughtAt">
						{{ i18n.ts.registeredAt }} ({{
							i18n.ts.ascendingOrder
						}})
					</option>
					<option value="+lastCommunicatedAt">
						{{ i18n.ts.lastCommunication }} ({{
							i18n.ts.descendingOrder
						}})
					</option>
					<option value="-lastCommunicatedAt">
						{{ i18n.ts.lastCommunication }} ({{
							i18n.ts.ascendingOrder
						}})
					</option>
				</MkSelect>
			</FormSplit>
		</div>

		<MkPagination
			v-slot="{ items }"
			ref="instances"
			:key="host + state"
			:pagination="pagination"
		>
			<div class="dqokceoi">
				<MkA
					v-for="instance in items"
					:key="instance.id"
					v-tooltip.mfm="
						`Last communicated: ${new Date(
							instance.lastCommunicatedAt,
						).toLocaleString()}\nStatus: ${getStatus(instance)}`
					"
					class="instance"
					:to="`/instance-info/${instance.host}`"
				>
					<MkInstanceCardMini :instance="instance" />
				</MkA>
			</div>
		</MkPagination>
	</div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import type { instanceSortParam } from "fedired-js";
import MkInput from "@/components/form/input.vue";
import MkSelect from "@/components/form/select.vue";
import MkPagination from "@/components/MkPagination.vue";
import MkInstanceCardMini from "@/components/MkInstanceCardMini.vue";
import FormSplit from "@/components/form/split.vue";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const host = ref("");
const state = ref("federating");
const sort = ref<(typeof instanceSortParam)[number]>("+pubSub");
const pagination = {
	endpoint: "federation/instances" as const,
	limit: 10,
	offsetMode: true,
	params: computed(() => ({
		sort: sort.value,
		host: host.value !== "" ? host.value : null,
		...(state.value === "federating"
			? { federating: true }
			: state.value === "subscribing"
				? { subscribing: true }
				: state.value === "publishing"
					? { publishing: true }
					: state.value === "suspended"
						? { suspended: true }
						: state.value === "blocked"
							? { blocked: true }
							: state.value === "silenced"
								? { silenced: true }
								: state.value === "notResponding"
									? { notResponding: true }
									: {}),
	})),
};

function getStatus(instance) {
	if (instance.isSuspended) return "Suspended";
	if (instance.isBlocked) return "Blocked";
	if (instance.isSilenced) return "Silenced";
	if (instance.isNotResponding) return "Error";
	return "Alive";
}
</script>

<style lang="scss" scoped>
.taeiyria {
	> .query {
		background: var(--bg);
		margin-block-end: 16px;
	}
}

.dqokceoi {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
	grid-gap: 12px;

	> .instance:hover {
		text-decoration: none;
	}
}
</style>
