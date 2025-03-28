<template>
	<div class="adhpbeos">
		<label>
			<span class="label">
				<slot name="label"></slot>
			</span>
			<div class="input" :class="{ disabled, focused, tall, pre }">
				<textarea
					ref="inputEl"
					v-model="v"
					v-adaptive-border
					:class="{ code, _monospace: code }"
					:disabled="disabled"
					:required="required"
					:readonly="readonly"
					:placeholder="placeholder"
					:pattern="pattern"
					:autocomplete="autocomplete"
					:spellcheck="spellcheck"
					@focus="focused = true"
					@blur="focused = false"
					@keydown="onKeydown($event)"
					@input="onInput"
				></textarea>
			</div>
			<div class="caption"><slot name="caption"></slot></div>
		</label>

		<MkButton
			v-if="manualSave && changed"
			primary
			class="save"
			@click="updated"
		>
			<i :class="icon('ph-floppy-disk-back')"></i>
			{{ i18n.ts.save }}</MkButton
		>
	</div>
</template>

<script lang="ts">
import {
	computed,
	defineComponent,
	nextTick,
	onMounted,
	ref,
	toRefs,
	watch,
} from "vue";
import { debounce } from "throttle-debounce";
import MkButton from "@/components/MkButton.vue";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

export default defineComponent({
	components: {
		MkButton,
	},

	props: {
		modelValue: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			required: false,
		},
		required: {
			type: Boolean,
			required: false,
		},
		readonly: {
			type: Boolean,
			required: false,
		},
		disabled: {
			type: Boolean,
			required: false,
		},
		pattern: {
			type: String,
			required: false,
		},
		placeholder: {
			type: String,
			required: false,
		},
		autofocus: {
			type: Boolean,
			required: false,
			default: false,
		},
		autocomplete: {
			type: String,
			required: false,
		},
		spellcheck: {
			type: Boolean,
			required: false,
		},
		code: {
			type: Boolean,
			required: false,
		},
		tall: {
			type: Boolean,
			required: false,
			default: false,
		},
		pre: {
			type: Boolean,
			required: false,
			default: false,
		},
		debounce: {
			type: Boolean,
			required: false,
			default: false,
		},
		manualSave: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	emits: ["change", "keydown", "enter", "update:modelValue"],

	setup(props, context) {
		const { modelValue, autofocus } = toRefs(props);
		const v = ref(modelValue.value);
		const focused = ref(false);
		const changed = ref(false);
		const invalid = ref(false);
		const filled = computed(() => v.value !== "" && v.value != null);
		const inputEl = ref<HTMLTextAreaElement | null>(null);

		const focus = () => inputEl.value!.focus();
		const onInput = (ev) => {
			changed.value = true;
			context.emit("change", ev);
		};
		const onKeydown = (ev: KeyboardEvent) => {
			context.emit("keydown", ev);

			if (ev.code === "Enter") {
				context.emit("enter");
			}
		};

		const updated = () => {
			changed.value = false;
			context.emit("update:modelValue", v.value);
		};

		const debouncedUpdated = debounce(1000, updated);

		watch(modelValue, (newValue) => {
			v.value = newValue;
		});

		watch(v, () => {
			if (!props.manualSave) {
				if (props.debounce) {
					debouncedUpdated();
				} else {
					updated();
				}
			}

			invalid.value = inputEl.value!.validity.badInput;
		});

		onMounted(() => {
			nextTick(() => {
				if (autofocus.value) {
					focus();
				}
			});
		});

		return {
			v,
			focused,
			invalid,
			changed,
			filled,
			inputEl,
			focus,
			onInput,
			onKeydown,
			updated,
			i18n,
			icon,
		};
	},
});
</script>

<style lang="scss" scoped>
.adhpbeos {
	> label {
		> .label {
			font-size: 0.85em;
			padding-block-start: 0;
			padding-inline-end: 0;
			padding-block-end: 8px;
			padding-inline-start: 0;
			user-select: none;
			&:empty {
				display: none;
			}
		}
		> .caption {
			font-size: 0.85em;
			padding-block-start: 8px;
			padding-inline-end: 0;
			padding-block-end: 0;
			padding-inline-start: 0;
			color: var(--fgTransparentWeak);

			&:empty {
				display: none;
			}
		}
		> .input {
			position: relative;

			> textarea {
				appearance: none;
				-webkit-appearance: none;
				display: block;
				inline-size: 100%;
				min-inline-size: 100%;
				max-inline-size: 100%;
				min-block-size: 130px;
				margin: 0;
				padding: 12px;
				font: inherit;
				font-weight: normal;
				font-size: 1em;
				color: var(--fg);
				background: var(--panel);
				border: solid 1px var(--panel);
				border-radius: 6px;
				outline: none;
				box-shadow: none;
				box-sizing: border-box;
				transition: border-color 0.1s ease-out;

				&:hover {
					border-color: var(--inputBorderHover) !important;
				}
			}

			&.focused {
				> textarea {
					border-color: var(--accent) !important;
				}
			}

			&.disabled {
				opacity: 0.7;

				&,
				* {
					cursor: not-allowed !important;
				}
			}

			&.tall {
				> textarea {
					min-block-size: 200px;
				}
			}

			&.pre {
				> textarea {
					white-space: pre;
				}
			}
		}
	}

	> .save {
		margin-block-start: 8px;
		margin-inline-end: 0;
		margin-block-end: 0;
		margin-inline-start: 0;
	}
}
</style>
