<template>
	<MkContainer :show-header="widgetProps.showHeader" class="mkw-aiscript">
		<template #header
			><i :class="icon('ph-terminal-window')"></i
			>{{ i18n.ts._widgets.aiscript }}</template
		>

		<div class="uylguesu _monospace">
			<textarea
				v-model="widgetProps.script"
				placeholder="(1 + 1)"
			></textarea>
			<button class="_buttonPrimary" @click="run">RUN</button>
			<div class="logs">
				<div
					v-for="log in logs"
					:key="log.id"
					class="log"
					:class="{ print: log.print }"
				>
					{{ log.text }}
				</div>
			</div>
		</div>
	</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { Interpreter, Parser, utils } from "@syuilo/aiscript";
import { useWidgetPropsManager } from "./widget";
import type {
	WidgetComponentEmits,
	WidgetComponentExpose,
	WidgetComponentProps,
} from "./widget";
import type { GetFormResultType } from "@/scripts/form";
import * as os from "@/os";
import MkContainer from "@/components/MkContainer.vue";
import { createAiScriptEnv } from "@/scripts/aiscript/api";
import { me } from "@/me";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";

const name = "aiscript";

const widgetPropsDef = {
	showHeader: {
		type: "boolean" as const,
		default: true,
	},
	script: {
		type: "string" as const,
		multiline: true,
		default: "(1 + 1)",
		hidden: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(
	name,
	widgetPropsDef,
	props,
	emit,
);

const logs = ref<
	{
		id: string;
		text: string;
		print: boolean;
	}[]
>([]);

const parser = new Parser();

const run = async () => {
	logs.value = [];
	const aiscript = new Interpreter(
		createAiScriptEnv({
			storageKey: "widget",
			token: me?.token,
		}),
		{
			in: (q) => {
				return new Promise((ok) => {
					os.inputText({
						title: q,
					}).then(({ canceled, result: a }) => {
						ok(a);
					});
				});
			},
			out: (value) => {
				logs.value.push({
					id: Math.random().toString(),
					text: value.type === "str" ? value.value : utils.valToString(value),
					print: true,
				});
			},
			log: (type, params) => {
				switch (type) {
					case "end":
						logs.value.push({
							id: Math.random().toString(),
							text: utils.valToString(params.val, true),
							print: false,
						});
						break;
					default:
						break;
				}
			},
		},
	);

	let ast;
	try {
		ast = parser.parse(widgetProps.script);
	} catch (err) {
		os.alert({
			type: "error",
			text: `Syntax error : ${err}`,
		});
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err) {
		os.alert({
			type: "error",
			text: String(err),
		});
	}
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.uylguesu {
	text-align: end;

	> textarea {
		display: block;
		inline-size: 100%;
		max-inline-size: 100%;
		min-inline-size: 100%;
		padding: 16px;
		color: var(--fg);
		background: transparent;
		border: none;
		border-block-end: solid 0.5px var(--divider);
		border-radius: 0;
		box-sizing: border-box;
		font: inherit;

		&:focus-visible {
			outline: none;
		}
	}

	> button {
		display: inline-block;
		margin: 8px;
		padding-block: 0;
		padding-inline: 10px;
		block-size: 28px;
		outline: none;
		border-radius: 4px;

		&:disabled {
			opacity: 0.7;
			cursor: default;
		}
	}

	> .logs {
		border-block-start: solid 0.5px var(--divider);
		text-align: start;
		padding: 16px;

		&:empty {
			display: none;
		}

		> .log {
			&:not(.print) {
				opacity: 0.7;
			}
		}
	}
}
</style>
