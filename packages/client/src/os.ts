// TODO: なんでもかんでもos.tsに突っ込むのやめたいのでよしなに分割する

import { EventEmitter } from "eventemitter3";
import { type Endpoints, type entities, api as fedireddApi } from "fedired-js";
import insertTextAtCursor from "insert-text-at-cursor";
import type { Component, MaybeRef, Ref } from "vue";
import { defineAsyncComponent, markRaw, ref } from "vue";
import { i18n } from "./i18n";
import MkDialog from "@/components/MkDialog.vue";
import MkQrCode from "@/components/MkQrCode.vue";
import MkPostFormDialog from "@/components/MkPostFormDialog.vue";
import MkToast from "@/components/MkToast.vue";
import MkWaitingDialog from "@/components/MkWaitingDialog.vue";
import { apiUrl, url } from "@/config";
import { me } from "@/me";
import type { MenuItem } from "@/types/menu";
import type { Form, GetFormResultType } from "@/types/form";

export const pendingApiRequestsCount = ref(0);

const apiClient = new fedireddApi.APIClient({
	origin: url,
});

export const api = ((
	endpoint: string,
	data: Record<string, unknown> = {},
	token?: string | null | undefined,
	useToken = true,
) => {
	pendingApiRequestsCount.value++;

	const onFinally = () => {
		pendingApiRequestsCount.value--;
	};

	const authorizationToken = token ?? me?.token ?? undefined;
	const authorization = authorizationToken
		? `Bearer ${authorizationToken}`
		: undefined;

	const promise = new Promise((resolve, reject) => {
		fetch(endpoint.includes("://") ? endpoint : `${apiUrl}/${endpoint}`, {
			method: "POST",
			body: JSON.stringify(data),
			credentials: "omit",
			cache: "no-cache",
			headers: {
				"Content-Type": "application/json",
				...(authorization && useToken ? { authorization } : {}),
			},
		})
			.then(async (res) => {
				const body = res.status === 204 ? null : await res.json();

				if (res.status === 200) {
					resolve(body);
				} else if (res.status === 204) {
					resolve(undefined);
				} else {
					reject(body.error);
				}
			})
			.catch(reject);
	});

	promise.then(onFinally, onFinally);

	return promise;
}) as typeof apiClient.request;

export const apiGet = ((
	endpoint: string,
	data: URLSearchParams | string | string[][] | Record<string, string> = {},
	token?: string | null | undefined,
) => {
	pendingApiRequestsCount.value++;

	const onFinally = () => {
		pendingApiRequestsCount.value--;
	};

	const query = new URLSearchParams(data);

	const authorizationToken = token ?? me?.token ?? undefined;
	const authorization = authorizationToken
		? `Bearer ${authorizationToken}`
		: undefined;

	const promise = new Promise((resolve, reject) => {
		// Send request
		fetch(`${apiUrl}/${endpoint}?${query}`, {
			method: "GET",
			credentials: "omit",
			cache: "default",
			headers: authorization ? { authorization } : {},
		})
			.then(async (res) => {
				const body = res.status === 204 ? null : await res.json();

				if (res.status === 200) {
					resolve(body);
				} else if (res.status === 204) {
					resolve(undefined);
				} else {
					reject(body.error);
				}
			})
			.catch(reject);
	});

	promise.then(onFinally, onFinally);

	return promise;
}) as typeof apiClient.request;

export const apiWithDialog = ((
	endpoint: keyof Endpoints,
	data: Record<string, unknown> = {},
	token?: string | null | undefined,
) => {
	const promise = api(endpoint, data, token);
	promiseDialog(promise, null, (err) => {
		alert({
			type: "error",
			text: `${err.message}\n${err.id}`,
		});
	});

	return promise;
}) as typeof api;

export function promiseDialog<T>(
	promise: Promise<T>,
	onSuccess?: ((res: T) => void) | null,
	onFailure?: ((err: fedireddApi.APIError) => void) | null,
	text?: string,
): Promise<T> {
	const showing = ref(true);
	const success = ref(false);

	promise
		.then((res) => {
			if (onSuccess) {
				showing.value = false;
				onSuccess(res);
			} else {
				success.value = true;
				window.setTimeout(() => {
					showing.value = false;
				}, 1000);
			}
		})
		.catch((err) => {
			showing.value = false;
			if (onFailure) {
				onFailure(err);
			} else {
				alert({
					type: "error",
					text: err,
				});
			}
		});

	// NOTE: dynamic importすると挙動がおかしくなる(showingの変更が伝播しない)
	popup(
		MkWaitingDialog,
		{
			success,
			showing,
			text,
		},
		{},
		"closed",
	);

	return promise;
}

let popupIdCount = 0;

interface PopupType {
	id: number;
	component: Component;
	props: Record<string, unknown>;
	events: Record<string, unknown>;
}
export const popups = ref<PopupType[]>([]);

const zIndexes = {
	low: 1000000,
	middle: 2000000,
	high: 3000000,
};
export function claimZIndex(
	priority: "low" | "middle" | "high" = "low",
): number {
	zIndexes[priority] += 100;
	return zIndexes[priority];
}

let uniqueId = 0;
export function getUniqueId(): string {
	return String(uniqueId++);
}

interface VueComponentConstructor<P, E> {
	__isFragment?: never;
	__isTeleport?: never;
	__isSuspense?: never;
	new (): {
		$props: P;
	};
	emits?: E;
}

type NonArrayAble<A> = A extends Array<unknown> ? never : A;

type CanUseRef<T> = {
	[K in keyof T]: MaybeRef<T[K]>;
};

export async function popup<Props, Emits>(
	component: VueComponentConstructor<Props, Emits>,
	props: CanUseRef<Props>,
	events: Partial<NonArrayAble<NonNullable<Emits>>> = {},
	disposeEvent?: keyof Partial<NonArrayAble<NonNullable<Emits>>>,
) {
	markRaw(component);

	const id = ++popupIdCount;
	const dispose = () => {
		// このsetTimeoutが無いと挙動がおかしくなる(autocompleteが閉じなくなる)。Vueのバグ？
		window.setTimeout(() => {
			popups.value = popups.value.filter((popup) => popup.id !== id);
		}, 0);
	};
	const state = {
		component,
		props: props as Record<string, unknown>,
		events: disposeEvent
			? {
					...events,
					[disposeEvent]: dispose,
				}
			: events,
		id,
	};

	// Hint: Vue will automatically resolve ref here, so it is safe to use ref in props
	popups.value.push(state);

	return {
		dispose,
	};
}

export function pageWindow(path: string) {
	popup(
		defineAsyncComponent({
			loader: () => import("@/components/MkPageWindow.vue"),
			loadingComponent: MkWaitingDialog,
			delay: 1000,
		}),
		{
			initialPath: path,
		},
		{},
		"closed",
	);
}

export function modalPageWindow(path: string) {
	popup(
		defineAsyncComponent({
			loader: () => import("@/components/MkModalPageWindow.vue"),
			loadingComponent: MkWaitingDialog,
			delay: 1000,
		}),
		{
			initialPath: path,
		},
		{},
		"closed",
	);
}

export function toast(message: string) {
	popup(
		MkToast,
		{
			message,
		},
		{},
		"closed",
	);
}

export function alert(props: {
	type?: "error" | "info" | "success" | "warning" | "waiting" | "question";
	title?: string | null;
	text?: string | null;
	isPlaintext?: boolean;
}): Promise<void> {
	return new Promise((resolve, _reject) => {
		if (props.text == null && props.type === "error") {
			props.text = i18n.ts.somethingHappened;
		}
		popup(
			MkDialog,
			props,
			{
				done: (result) => {
					resolve();
				},
			},
			"closed",
		);
	});
}

export function confirm(props: {
	type: "error" | "info" | "success" | "warning" | "waiting" | "question";
	title?: string | null;
	text?: string | null;
	okText?: string;
	cancelText?: string;
	isPlaintext?: boolean;
}): Promise<{ canceled: boolean }> {
	return new Promise((resolve, _reject) => {
		popup(
			MkDialog,
			{
				...props,
				showCancelButton: true,
			},
			{
				done: (result) => {
					resolve(result || { canceled: true });
				},
			},
			"closed",
		);
	});
}

export function yesno(props: {
	type: "error" | "info" | "success" | "warning" | "waiting" | "question";
	title?: string | null;
	text?: string | null;
	isPlaintext?: boolean;
}): Promise<{ canceled: boolean }> {
	return new Promise((resolve, _reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				...props,
				showCancelButton: true,
				isYesNo: true,
			},
			{
				done: (result) => {
					resolve(result || { canceled: true });
				},
			},
			"closed",
		);
	});
}

export function inputText(props: {
	type?: "text" | "email" | "password" | "url" | "search";
	title?: string | null;
	text?: string | null;
	placeholder?: string | null;
	autocomplete?: string;
	default?: string | null;
	minLength?: number;
	maxLength?: number;
	isPlaintext?: boolean;
}): Promise<
	| { canceled: true; result?: undefined }
	| {
			canceled: false;
			result: string;
	  }
> {
	return new Promise((resolve, _reject) => {
		popup(
			MkDialog,
			{
				title: props.title,
				text: props.text,
				input: {
					type: props.type,
					placeholder: props.placeholder,
					autocomplete: props.autocomplete,
					default: props.default,
					minLength: props.minLength,
					maxLength: props.maxLength,
				},
				isPlaintext: props.isPlaintext,
			},
			{
				done: (result) => {
					if (result.canceled) {
						resolve({ canceled: true });
					} else {
						resolve({
							canceled: false,
							result: String(result.result),
						});
					}
				},
			},
			"closed",
		);
	});
}

export function inputParagraph(props: {
	title?: string | null;
	text?: string | null;
	placeholder?: string | null;
	default?: string | null;
}): Promise<
	| { canceled: true; result?: undefined }
	| {
			canceled: false;
			result: string;
	  }
> {
	return new Promise((resolve, _reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				title: props.title,
				text: props.text,
				input: {
					type: "paragraph",
					placeholder: props.placeholder,
					default: props.default,
				},
			},
			{
				done: (result) => {
					if (result.canceled) {
						resolve({ canceled: true });
					} else {
						resolve({
							canceled: false,
							result: String(result.result),
						});
					}
				},
			},
			"closed",
		);
	});
}

export function inputNumber(props: {
	title?: string | null;
	text?: string | null;
	placeholder?: string | null;
	default?: number | null;
	autocomplete?: string;
}): Promise<
	| { canceled: true; result?: undefined }
	| {
			canceled: false;
			result: number;
	  }
> {
	return new Promise((resolve, _reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				title: props.title,
				text: props.text,
				input: {
					type: "number",
					placeholder: props.placeholder,
					autocomplete: props.autocomplete,
					default: props.default,
				},
			},
			{
				done: (result) => {
					if (result.canceled) {
						resolve({ canceled: true });
					} else {
						resolve({
							canceled: false,
							result: Number(result.result),
						});
					}
				},
			},
			"closed",
		);
	});
}

export function inputDate(props: {
	title?: string | null;
	text?: string | null;
	placeholder?: string | null;
	default?: Date | string | null;
}): Promise<
	| { canceled: true; result?: undefined }
	| {
			canceled: false;
			result: Date;
	  }
> {
	props.default ??= new Date();
	return new Promise((resolve, _reject) => {
		popup(
			MkDialog,
			{
				title: props.title,
				text: props.text,
				input: {
					type: "date",
					placeholder: props.placeholder,
					default:
						props.default instanceof Date
							? props.default.toISOString().slice(0, 10)
							: props.default,
				},
			},
			{
				done: (result) => {
					resolve(
						result
							? {
									result: new Date(result.result as string | number),
									canceled: false,
								}
							: { canceled: true },
					);
				},
			},
			"closed",
		);
	});
}

export function select<C extends string>(
	props: {
		title?: string | null;
		text?: string | null;
		default?: string | null;
	} & (
		| {
				items: {
					value: C;
					text: string;
				}[];
				groupedItems?: undefined;
		  }
		| {
				items?: undefined;
				groupedItems: {
					label: string;
					items: {
						value: C;
						text: string;
					}[];
				}[];
		  }
	),
): Promise<
	| { canceled: true; result?: undefined }
	| {
			canceled: false;
			result: C;
	  }
> {
	return new Promise((resolve, _reject) => {
		popup(
			MkDialog,
			{
				title: props.title,
				text: props.text,
				select: props.items
					? {
							items: props.items,
							default: props.default,
						}
					: {
							groupedItems: props.groupedItems,
							default: props.default,
						},
			},
			{
				done: (result) => {
					if (result.canceled) {
						resolve({ canceled: true });
					} else {
						resolve(result as never);
					}
				},
			},
			"closed",
		);
	});
}

export function success(): Promise<void> {
	return new Promise((resolve, _reject) => {
		const showing = ref(true);
		window.setTimeout(() => {
			showing.value = false;
		}, 1000);
		popup(
			MkWaitingDialog,
			{
				success: true,
				showing,
			},
			{
				done: () => resolve(),
			},
			"closed",
		);
	});
}

export function waiting(): Promise<void> {
	return new Promise((resolve, _reject) => {
		const showing = ref(true);
		popup(
			MkWaitingDialog,
			{
				success: false,
				showing,
			},
			{
				done: () => resolve(),
			},
			"closed",
		);
	});
}

export function form<T extends Form>(title: string, form: T) {
	return new Promise<{
		result?: GetFormResultType<T>;
		canceled?: true;
	}>((resolve, _reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkFormDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{ title, form },
			{
				done: (result) => {
					resolve(result as never);
				},
			},
			"closed",
		);
	});
}

export function selectUser() {
	return new Promise<entities.UserDetailed>((resolve, _reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkUserSelectDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{},
			{
				ok: (user) => {
					resolve(user);
				},
			},
			"closed",
		);
	});
}

export function selectLocalUser() {
	return new Promise<entities.UserDetailed>((resolve, _reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkUserSelectLocalDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{},
			{
				ok: (user) => {
					resolve(user);
				},
			},
			"closed",
		);
	});
}

export function selectInstance(): Promise<entities.Instance> {
	return new Promise((resolve, _reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkInstanceSelectDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{},
			{
				ok: (instance) => {
					resolve(instance);
				},
			},
			"closed",
		);
	});
}

export function selectDriveFile<Multiple extends boolean>(multiple: Multiple) {
	return new Promise<
		Multiple extends true ? entities.DriveFile[] : entities.DriveFile
	>((resolve, _reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkDriveSelectDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				type: "file",
				multiple,
			},
			{
				done: (files) => {
					if (files) {
						resolve((multiple ? files : files[0]) as never);
					}
				},
			},
			"closed",
		);
	});
}

export async function selectDriveFolder(multiple: boolean) {
	return new Promise((resolve, _reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkDriveSelectDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				type: "folder",
				multiple,
			},
			{
				done: (folders) => {
					if (folders) {
						resolve(multiple ? folders : folders[0]);
					}
				},
			},
			"closed",
		);
	});
}

export async function pickEmoji(src: HTMLElement | null, opts) {
	return new Promise((resolve, _reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkEmojiPickerDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				src,
				...opts,
			},
			{
				done: (emoji) => {
					resolve(emoji);
				},
			},
			"closed",
		);
	});
}

export async function cropImage(
	image: entities.DriveFile,
	options: {
		aspectRatio: number;
	},
): Promise<entities.DriveFile> {
	return new Promise((resolve, _reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkCropperDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				file: image,
				aspectRatio: options.aspectRatio,
			},
			{
				ok: (x) => {
					resolve(x);
				},
			},
			"closed",
		);
	});
}

type AwaitType<T> = T extends Promise<infer U>
	? U
	: T extends (...args: unknown[]) => Promise<infer V>
		? V
		: T;
let openingEmojiPicker: AwaitType<ReturnType<typeof popup>> | null = null;
let activeTextarea: HTMLTextAreaElement | HTMLInputElement;
export async function openEmojiPicker(
	src: HTMLElement | undefined,
	opts,
	initialTextarea: typeof activeTextarea,
) {
	if (openingEmojiPicker) return;

	activeTextarea = initialTextarea;

	const textareas = document.querySelectorAll<
		HTMLTextAreaElement | HTMLInputElement
	>("textarea, input");
	for (const textarea of Array.from(textareas)) {
		textarea.addEventListener("focus", () => {
			activeTextarea = textarea;
		});
	}

	const observer = new MutationObserver((records) => {
		for (const record of records) {
			for (const node of Array.from(record.addedNodes).filter(
				(node) => node instanceof HTMLElement,
			) as HTMLElement[]) {
				const textareas = node.querySelectorAll<
					HTMLTextAreaElement | HTMLInputElement
				>("textarea, input");
				for (const textarea of Array.from(textareas).filter(
					(textarea) => textarea.dataset.preventEmojiInsert == null,
				)) {
					if (document.activeElement === textarea) activeTextarea = textarea;
					textarea.addEventListener("focus", () => {
						activeTextarea = textarea;
					});
				}
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: false,
		characterData: false,
	});

	openingEmojiPicker = await popup(
		defineAsyncComponent({
			loader: () => import("@/components/MkEmojiPickerDialog.vue"),
			loadingComponent: MkWaitingDialog,
			delay: 1000,
		}),
		{
			src,
			...opts,
		},
		{
			done: (emoji) => {
				insertTextAtCursor(activeTextarea, emoji);
			},
			closed: () => {
				openingEmojiPicker?.dispose();
				openingEmojiPicker = null;
				observer.disconnect();
			},
		},
	);
}

export function popupMenu(
	items: MenuItem[] | Ref<MenuItem[]>,
	src?: HTMLElement | null,
	options?: {
		align?: string;
		width?: number;
		viaKeyboard?: boolean;
		noReturnFocus?: boolean;
		anchor?: {
			x: "left" | "center" | "right";
			y: "top" | "center" | "bottom";
		};
	},
) {
	return new Promise<void>((resolve, _reject) => {
		let dispose: () => void;
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkPopupMenu.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				items,
				src,
				anchor: options?.anchor,
				width: options?.width,
				align: options?.align,
				viaKeyboard: options?.viaKeyboard,
				noReturnFocus: options?.noReturnFocus,
			},
			{
				closed: () => {
					resolve();
					dispose();
				},
			},
		).then((res) => {
			dispose = res.dispose;
		});
	});
}

export function contextMenu(
	items: MenuItem[] | Ref<MenuItem[]>,
	ev: MouseEvent,
) {
	ev.preventDefault();
	return new Promise<void>((resolve, _reject) => {
		let dispose: () => void;
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkContextMenu.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				items,
				ev,
			},
			{
				closed: () => {
					resolve();
					dispose();
				},
			},
		).then((res) => {
			dispose = res.dispose;
		});
	});
}

export function post(
	props: InstanceType<typeof MkPostFormDialog>["$props"] = {},
	onClosed?: () => void,
) {
	return new Promise<void>((resolve, _reject) => {
		// NOTE: MkPostFormDialogをdynamic importするとiOSでテキストエリアに自動フォーカスできない
		// NOTE: ただ、dynamic importしない場合、MkPostFormDialogインスタンスが使いまわされ、
		//       Vueが渡されたコンポーネントに内部的に__propsというプロパティを生やす影響で、
		//       複数のpost formを開いたときに場合によってはエラーになる
		//       もちろん複数のpost formを開けること自体Misskeyサイドのバグなのだが
		// NOTE: Text area cannot be auto-focused on iOS when dynamically importing MkPostFormDialog
		// NOTE: However, if you do not dynamically import, the MkPostFormDialog instance will be reused,
		// Due to the effect that Vue internally creates a property called __props on the passed component,
		// Sometimes an error occurs when opening multiple post forms
		// Of course, opening multiple post forms is itself a bug on Misskey's side.
		let dispose: () => void;
		popup(MkPostFormDialog, props, {
			closed: () => {
				resolve();
				dispose();
				onClosed?.();
			},
		}).then((res) => {
			dispose = res.dispose;
		});
	});
}

export async function displayQrCode(qrCode: string) {
	(
		await new Promise<(() => void) | undefined>((resolve) => {
			let dispose: (() => void) | undefined;
			popup(
				MkQrCode,
				{ qrCode },
				{
					closed: () => {
						resolve(dispose);
					},
				},
			).then((res) => {
				dispose = res.dispose;
			});
		})
	)?.();
}

export const deckGlobalEvents = new EventEmitter();

/*
export function checkExistence(fileData: ArrayBuffer): Promise<any> {
	return new Promise((resolve, _reject) => {
		const data = new FormData();
		data.append('md5', getMD5(fileData));

		os.api('drive/files/find-by-hash', {
			md5: getMD5(fileData)
		}).then(resp => {
			resolve(resp.length > 0 ? resp[0] : null);
		});
	});
} */
