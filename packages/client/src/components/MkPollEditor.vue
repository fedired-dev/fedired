<template>
	<div class="zmdxowus">
		<p v-if="choices.length < 2" class="caution">
			<i :class="icon('ph-warning')"></i
			>{{ i18n.ts._poll.noOnlyOneChoice }}
		</p>
		<ul>
			<li v-for="(choice, i) in choices" :key="i">
				<MkInput
					class="input"
					small
					:model-value="choice"
					:placeholder="i18n.t('_poll.choiceN', { n: i + 1 })"
					@update:modelValue="onInput(i, $event)"
				>
				</MkInput>
				<button
					class="_button"
					:aria-label="i18n.ts.remove"
					@click="remove(i)"
				>
					<i :class="icon('ph-x')"></i>
				</button>
			</li>
		</ul>
		<MkButton v-if="choices.length < 10" class="add" @click="add">{{
			i18n.ts.add
		}}</MkButton>
		<MkButton v-else class="add" disabled>{{
			i18n.ts._poll.noMore
		}}</MkButton>
		<MkSwitch v-model="multiple">{{
			i18n.ts._poll.canMultipleVote
		}}</MkSwitch>
		<section>
			<div>
				<MkSelect v-model="expiration" small>
					<template #label>{{ i18n.ts._poll.expiration }}</template>
					<option value="infinite">
						{{ i18n.ts._poll.infinite }}
					</option>
					<option value="at">{{ i18n.ts._poll.at }}</option>
					<option value="after">{{ i18n.ts._poll.after }}</option>
				</MkSelect>
				<section v-if="expiration === 'at'">
					<MkInput v-model="atDate" small type="date" class="input">
						<template #label>{{
							i18n.ts._poll.deadlineDate
						}}</template>
					</MkInput>
					<MkInput v-model="atTime" small type="time" class="input">
						<template #label>{{
							i18n.ts._poll.deadlineTime
						}}</template>
					</MkInput>
				</section>
				<section v-else-if="expiration === 'after'">
					<MkInput v-model="after" small type="number" class="input">
						<template #label>{{ i18n.ts._poll.duration }}</template>
					</MkInput>
					<MkSelect v-model="unit" small>
						<option value="second">
							{{ i18n.ts._time.second }}
						</option>
						<option value="minute">
							{{ i18n.ts._time.minute }}
						</option>
						<option value="hour">{{ i18n.ts._time.hour }}</option>
						<option value="day">{{ i18n.ts._time.day }}</option>
					</MkSelect>
				</section>
			</div>
		</section>
	</div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import MkInput from "./form/input.vue";
import MkSelect from "./form/select.vue";
import MkSwitch from "./form/switch.vue";
import MkButton from "./MkButton.vue";
import { formatDateTimeString } from "@/scripts/format-time-string";
import { addTime } from "@/scripts/time";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";
import type { PollType } from "@/types/post-form";

const props = defineProps<{
	modelValue: PollType;
}>();
const emit = defineEmits<{
	"update:modelValue": [
		v: {
			expiresAt?: number;
			expiredAfter?: number | null;
			choices: string[];
			multiple: boolean;
		},
	];
}>();

const choices = ref(props.modelValue.choices);
const multiple = ref(props.modelValue.multiple);
const expiration = ref("infinite");
const atDate = ref(
	formatDateTimeString(addTime(new Date(), 1, "day"), "yyyy-MM-dd"),
);
const atTime = ref("00:00");
const after = ref(0);
const unit = ref("second");

if (props.modelValue.expiresAt) {
	expiration.value = "at";
	atDate.value = atTime.value = props.modelValue.expiresAt;
} else if (typeof props.modelValue.expiredAfter === "number") {
	expiration.value = "after";
	after.value = props.modelValue.expiredAfter / 1000;
} else {
	expiration.value = "infinite";
}

function onInput(i, value) {
	choices.value[i] = value;
}

function add() {
	choices.value.push("");
	// TODO
	// nextTick(() => {
	//   (this.$refs.choices as any).childNodes[this.choices.length - 1].childNodes[0].focus();
	// });
}

function remove(i) {
	choices.value = choices.value.filter((_, _i) => _i !== i);
}

function get() {
	const calcAt = () => {
		return new Date(`${atDate.value} ${atTime.value}`).getTime();
	};

	const calcAfter = () => {
		let base = Number.parseInt(after.value.toString());
		switch (unit.value) {
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: Fallthrough intentially
			case "day":
				base *= 24;
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: Fallthrough intentially
			case "hour":
				base *= 60;
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: Fallthrough intentially
			case "minute":
				base *= 60;
			case "second":
				return base * 1000;
			default:
				return null;
		}
	};

	return {
		choices: choices.value,
		multiple: multiple.value,
		...(expiration.value === "at"
			? { expiresAt: calcAt() }
			: expiration.value === "after"
				? { expiredAfter: calcAfter() }
				: {}),
	};
}

watch(
	[choices, multiple, expiration, atDate, atTime, after, unit],
	() => emit("update:modelValue", get()),
	{
		deep: true,
	},
);
</script>

<style lang="scss" scoped>
.zmdxowus {
	padding-block: 8px;
	padding-inline: 16px;

	> .caution {
		margin-block-start: 0;
		margin-inline-end: 0;
		margin-block-end: 8px;
		margin-inline-start: 0;
		font-size: 0.8em;
		color: #f00;

		> i {
			margin-inline-end: 4px;
		}
	}

	> ul {
		display: block;
		margin: 0;
		padding: 0;
		list-style: none;

		> li {
			display: flex;
			margin-block: 8px;
			margin-inline: 0;
			padding: 0;
			inline-size: 100%;

			> .input {
				flex: 1;
			}

			> button {
				inline-size: 32px;
				padding-block: 4px;
				padding-inline: 0;
			}
		}
	}

	> .add {
		margin-block: 8px;
		margin-inline: 0;
		z-index: 1;
	}

	> section {
		margin-block-start: 16px;
		margin-inline-end: 0;
		margin-block-end: 0;
		margin-inline-start: 0;

		> div {
			margin-block: 0;
			margin-inline: 8px;
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 12px;

			&:last-child {
				flex: 1 0 auto;

				> div {
					flex-grow: 1;
				}

				> section {
					// MAGIC: Prevent div above from growing unless wrapped to its own line
					flex-grow: 9999;
					align-items: end;
					display: flex;
					gap: 4px;

					> .input {
						flex: 1 1 auto;
					}
				}
			}
		}
	}
}
</style>
