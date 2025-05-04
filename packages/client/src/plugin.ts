import { Interpreter, Parser, utils, values } from "@syuilo/aiscript";
import { inputText } from "@/os";
import { createAiScriptEnv } from "@/scripts/aiscript/api";
import {
	noteActions,
	notePostInterruptors,
	noteViewInterruptors,
	postFormActions,
	userActions,
} from "@/store";

const parser = new Parser();
const pluginContexts = new Map<string, Interpreter>();

export function install(plugin) {
	console.info("Plugin installed:", plugin.name, `v${plugin.version}`);

	const aiscript = new Interpreter(
		createPluginEnv({
			plugin,
			storageKey: `plugins:${plugin.id}`,
		}),
		{
			in: (q) => {
				return new Promise((ok) => {
					inputText({
						title: q,
					}).then(({ canceled, result: a }) => {
						ok(a);
					});
				});
			},
			out: (value) => {
				console.log(value);
			},
			log: (type, params) => {},
		},
	);

	initPlugin({ plugin, aiscript });

	aiscript.exec(parser.parse(plugin.src));
}

interface Plugin {
	config?: Record<
		string,
		{
			default: unknown;
			[k: string]: unknown;
		}
	>;
	configData: Record<string, unknown>;
	token: string;
	id: string;
}

function createPluginEnv(opts: { plugin: Plugin; storageKey: string }) {
	const config = new Map<string, values.Value>();
	for (const [k, v] of Object.entries(opts.plugin.config ?? {})) {
		config.set(
			k,
			utils.jsToVal(
				typeof opts.plugin.configData[k] !== "undefined"
					? opts.plugin.configData[k]
					: v.default,
			),
		);
	}

	return {
		...createAiScriptEnv({ ...opts, token: opts.plugin.token }),
		// #region Deprecated
		"Mk:register_post_form_action": values.FN_NATIVE(([title, handler]) => {
			registerPostFormAction({
				pluginId: opts.plugin.id,
				title: title.value,
				handler,
			});
		}),
		"Mk:register_user_action": values.FN_NATIVE(([title, handler]) => {
			registerUserAction({
				pluginId: opts.plugin.id,
				title: title.value,
				handler,
			});
		}),
		"Mk:register_note_action": values.FN_NATIVE(([title, handler]) => {
			registerNoteAction({
				pluginId: opts.plugin.id,
				title: title.value,
				handler,
			});
		}),
		// #endregion
		"Plugin:register_post_form_action": values.FN_NATIVE(([title, handler]) => {
			registerPostFormAction({
				pluginId: opts.plugin.id,
				title: title.value,
				handler,
			});
		}),
		"Plugin:register_user_action": values.FN_NATIVE(([title, handler]) => {
			registerUserAction({
				pluginId: opts.plugin.id,
				title: title.value,
				handler,
			});
		}),
		"Plugin:register_note_action": values.FN_NATIVE(([title, handler]) => {
			registerNoteAction({
				pluginId: opts.plugin.id,
				title: title.value,
				handler,
			});
		}),
		"Plugin:register_note_view_interruptor": values.FN_NATIVE(([handler]) => {
			registerNoteViewInterruptor({
				pluginId: opts.plugin.id,
				handler,
			});
		}),
		"Plugin:register_note_post_interruptor": values.FN_NATIVE(([handler]) => {
			registerNotePostInterruptor({
				pluginId: opts.plugin.id,
				handler,
			});
		}),
		"Plugin:register_page_view_interruptor": values.FN_NATIVE(([handler]) => {
			registerPageViewInterruptor({
				pluginId: opts.plugin.id,
				handler,
			});
		}),
		"Plugin:open_url": values.FN_NATIVE(([url]) => {
			window.open(url.value, "_blank");
		}),
		"Plugin:config": values.OBJ(config),
	};
}

function initPlugin({ plugin, aiscript }) {
	pluginContexts.set(plugin.id, aiscript);
}

function registerPostFormAction({ pluginId, title, handler }) {
	postFormActions.push({
		title,
		handler: (form, update) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) {
				return;
			}
			pluginContext.execFn(handler, [
				utils.jsToVal(form),
				values.FN_NATIVE(([key, value]) => {
					if (!key || !value) {
						return;
					}
					update(utils.valToJs(key), utils.valToJs(value));
				}),
			]);
		},
	});
}

function registerUserAction({ pluginId, title, handler }) {
	userActions.push({
		title,
		handler: (user) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) {
				return;
			}
			pluginContext.execFn(handler, [utils.jsToVal(user)]);
		},
	});
}

function registerNoteAction({ pluginId, title, handler }) {
	noteActions.push({
		title,
		handler: (note) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) {
				return;
			}
			pluginContext.execFn(handler, [utils.jsToVal(note)]);
		},
	});
}

function registerNoteViewInterruptor({ pluginId, handler }) {
	noteViewInterruptors.push({
		handler: async (note) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) {
				return;
			}
			return utils.valToJs(
				await pluginContext.execFn(handler, [utils.jsToVal(note)]),
			);
		},
	});
}

function registerNotePostInterruptor({ pluginId, handler }) {
	notePostInterruptors.push({
		handler: async (note) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) {
				return;
			}
			return utils.valToJs(
				await pluginContext.execFn(handler, [utils.jsToVal(note)]),
			);
		},
	});
}

// FIXME: where is pageViewInterruptors?
// This function currently can't do anything
function registerPageViewInterruptor({ pluginId, handler }): void {
	// pageViewInterruptors.push({
	// 	handler: async (page) => {
	// 		const pluginContext = pluginContexts.get(pluginId);
	// 		if (!pluginContext) {
	// 			return;
	// 		}
	// 		return utils.valToJs(
	// 			await pluginContext.execFn(handler, [utils.jsToVal(page)]),
	// 		);
	// 	},
	// });
}
