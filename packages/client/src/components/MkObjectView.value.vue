<template>
	<div class="igpposuu _monospace">
		<div v-if="value === null" class="null">null</div>
		<div
			v-else-if="typeof value === 'boolean'"
			class="boolean"
			:class="{ true: value, false: !value }"
		>
			{{ value ? "true" : "false" }}
		</div>
		<div v-else-if="typeof value === 'string'" class="string">
			"{{ value }}"
		</div>
		<div v-else-if="typeof value === 'number'" class="number">
			{{ number(value) }}
		</div>
		<div v-else-if="isArray(value) && isEmpty(value)" class="array empty">
			[]
		</div>
		<div v-else-if="isArray(value)" class="array">
			<div v-for="i in value.length" class="element">
				{{ i }}: <XValue :value="value[i - 1]" collapsed />
			</div>
		</div>
		<div v-else-if="isObject(value) && isEmpty(value)" class="object empty">
			{}
		</div>
		<div v-else-if="isObject(value)" class="object">
			<div v-for="k in Object.keys(value)" class="kv">
				<button
					class="toggle _button"
					:class="{ visible: collapsable(value[k]) }"
					@click="collapsed[k] = !collapsed[k]"
				>
					{{ collapsed[k] ? "+" : "-" }}
				</button>
				<div class="k">{{ k }}:</div>
				<div v-if="collapsed[k]" class="v">
					<button
						class="_button"
						@click="collapsed[k] = !collapsed[k]"
					>
						<template v-if="typeof value[k] === 'string'"
							>"..."</template
						>
						<template v-else-if="isArray(value[k])">[...]</template>
						<template v-else-if="isObject(value[k])"
							>{...}</template
						>
					</button>
				</div>
				<div v-else class="v"><XValue :value="value[k]" /></div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, reactive } from "vue";
import number from "@/filters/number";

export default defineComponent({
	name: "XValue",

	props: {
		value: {
			required: true,
		},
	},

	setup(props) {
		const collapsed = reactive({});

		if (isObject(props.value)) {
			for (const key in props.value) {
				collapsed[key] = collapsable(props.value[key]);
			}
		}

		function isObject(v): boolean {
			return typeof v === "object" && !Array.isArray(v) && v !== null;
		}

		function isArray(v): boolean {
			return Array.isArray(v);
		}

		function isEmpty(v): boolean {
			return (
				(isArray(v) && v.length === 0) ||
				(isObject(v) && Object.keys(v).length === 0)
			);
		}

		function collapsable(v): boolean {
			return (isObject(v) || isArray(v)) && !isEmpty(v);
		}

		return {
			number,
			collapsed,
			isObject,
			isArray,
			isEmpty,
			collapsable,
		};
	},
});
</script>

<style lang="scss" scoped>
.igpposuu {
	display: inline;

	> .null {
		display: inline;
		opacity: 0.7;
	}

	> .boolean {
		display: inline;
		color: var(--codeBoolean);

		&.true {
			font-weight: bold;
		}

		&.false {
			opacity: 0.7;
		}
	}

	> .string {
		display: inline;
		color: var(--codeString);
	}

	> .number {
		display: inline;
		color: var(--codeNumber);
	}

	> .array.empty {
		display: inline;
		opacity: 0.7;
	}

	> .array:not(.empty) {
		display: inline;

		> .element {
			display: block;
			padding-inline-start: 16px;
		}
	}

	> .object.empty {
		display: inline;
		opacity: 0.7;
	}

	> .object:not(.empty) {
		display: inline;

		> .kv {
			display: block;
			padding-inline-start: 16px;

			> .toggle {
				inline-size: 16px;
				color: var(--accent);
				visibility: hidden;

				&.visible {
					visibility: visible;
				}
			}

			> .k {
				display: inline;
				margin-inline-end: 8px;
			}

			> .v {
				display: inline;
			}
		}
	}
}
</style>
