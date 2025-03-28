<template>
	<div
		class="pemppnzi _block"
		@dragover.stop="onDragover"
		@drop.stop="onDrop"
	>
		<textarea
			ref="textEl"
			v-model="text"
			:placeholder="i18n.ts.inputMessageHere"
			@keydown="onKeydown"
			@compositionupdate="onCompositionUpdate"
			@paste="onPaste"
		></textarea>
		<footer>
			<div v-if="file" class="file" @click="file = null">
				{{ file.name }}
			</div>
			<div class="buttons">
				<button
					class="_button"
					:aria-label="i18n.ts.attachFile"
					@click="chooseFile"
				>
					<i :class="icon('ph-upload')"></i>
				</button>
				<button
					class="_button"
					:aria-label="i18n.ts.chooseEmoji"
					@click="insertEmoji"
				>
					<i :class="icon('ph-smiley')"></i>
				</button>
				<button
					class="send _button"
					:disabled="!canSend || sending"
					:title="i18n.ts.send"
					:aria-label="i18n.ts.send"
					@click="send"
				>
					<template v-if="!sending"
						><i :class="icon('ph-paper-plane-tilt')"></i></template
					><template v-if="sending"
						><i :class="icon('ph-circle-notch fa-pulse ph-fw')"></i
					></template>
				</button>
			</div>
		</footer>
		<input ref="fileEl" type="file" @change="onChangeFile" />
	</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import type { entities } from "fedired-js";
import autosize from "autosize";
// import insertTextAtCursor from 'insert-text-at-cursor';
import { throttle } from "throttle-debounce";
import { Autocomplete } from "@/scripts/autocomplete";
import { formatTimeString } from "@/scripts/format-time-string";
import { selectFile } from "@/scripts/select-file";
import * as os from "@/os";
import { useStream } from "@/stream";
import { defaultStore } from "@/store";
import { i18n } from "@/i18n";
import { uploadFile } from "@/scripts/upload";
import icon from "@/scripts/icon";

const props = defineProps<{
	user?: entities.UserDetailed | null;
	group?: entities.UserGroup | null;
}>();

const stream = useStream();

const textEl = ref<HTMLTextAreaElement>();
const fileEl = ref<HTMLInputElement>();

const text = ref<string>("");
const file = ref<entities.DriveFile | null>(null);
const sending = ref(false);
const typing = throttle(3000, () => {
	stream.send(
		"typingOnMessaging",
		props.user ? { partner: props.user.id } : { group: props.group?.id },
	);
});

const draftKey = computed(() =>
	props.user ? "user:" + props.user.id : "group:" + props.group?.id,
);
const canSend = computed(
	() => (text.value != null && text.value.trim() !== "") || file.value != null,
);

watch([text, file], saveDraft);

async function onPaste(ev: ClipboardEvent) {
	if (!ev.clipboardData) return;

	const clipboardData = ev.clipboardData;
	const items = clipboardData.items;

	if (items.length === 1) {
		if (items[0].kind === "file") {
			const pastedFile = items[0].getAsFile();
			if (!pastedFile) return;
			const lio = pastedFile.name.lastIndexOf(".");
			const ext = lio >= 0 ? pastedFile.name.slice(lio) : "";
			const formatted =
				formatTimeString(
					new Date(pastedFile.lastModified),
					defaultStore.state.pastedFileName,
				).replace(/{{number}}/g, "1") + ext;
			if (formatted) upload(pastedFile, formatted);
		}
	} else {
		if (items[0].kind === "file") {
			os.alert({
				type: "error",
				text: i18n.ts.onlyOneFileCanBeAttached,
			});
		}
	}
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	const isFile = ev.dataTransfer.items[0].kind === "file";
	const isDriveFile = ev.dataTransfer.types[0] === _DATA_TRANSFER_DRIVE_FILE_;
	if (isFile || isDriveFile) {
		ev.preventDefault();
		ev.dataTransfer.dropEffect =
			ev.dataTransfer.effectAllowed === "all" ? "copy" : "move";
	}
}

function onDrop(ev: DragEvent): void {
	if (!ev.dataTransfer) return;

	// ファイルだったら
	if (ev.dataTransfer.files.length === 1) {
		ev.preventDefault();
		upload(ev.dataTransfer.files[0]);
		return;
	} else if (ev.dataTransfer.files.length > 1) {
		ev.preventDefault();
		os.alert({
			type: "error",
			text: i18n.ts.onlyOneFileCanBeAttached,
		});
		return;
	}

	// #region ドライブのファイル
	const driveFile = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile !== "") {
		file.value = JSON.parse(driveFile);
		ev.preventDefault();
	}
	// #endregion
}

function onKeydown(ev: KeyboardEvent) {
	typing();
	const sendOnEnter =
		localStorage.getItem("enterSendsMessage") === "true" ||
		defaultStore.state.enterSendsMessage;
	if (sendOnEnter) {
		if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
			textEl.value.value += "\n";
		} else if (
			ev.key === "Enter" &&
			!ev.shiftKey &&
			!("ontouchstart" in document.documentElement) &&
			canSend.value
		) {
			ev.preventDefault();
			send();
		}
	} else {
		if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey) && canSend.value) {
			ev.preventDefault();
			send();
		}
	}
}

function onCompositionUpdate() {
	typing();
}

function chooseFile(ev: MouseEvent) {
	selectFile(ev.currentTarget ?? ev.target, i18n.ts.selectFile).then(
		(selectedFile) => {
			file.value = selectedFile;
		},
	);
}

function onChangeFile() {
	if (fileEl.value.files![0]) upload(fileEl.value.files[0]);
}

function upload(fileToUpload: File, name?: string) {
	uploadFile(fileToUpload, defaultStore.state.uploadFolder, name).then(
		(res) => {
			file.value = res;
		},
	);
}

function send() {
	sending.value = true;
	os.api("messaging/messages/create", {
		userId: props.user ? props.user.id : undefined,
		groupId: props.group ? props.group.id : undefined,
		text: text.value ? text.value : undefined,
		fileId: file.value ? file.value.id : undefined,
	})
		.then((message) => {
			clear();
		})
		.catch((err) => {
			console.error(err);
		})
		.then(() => {
			sending.value = false;
		});
}

function clear() {
	text.value = "";
	file.value = null;
	deleteDraft();
}

function saveDraft() {
	const drafts = JSON.parse(localStorage.getItem("message_drafts") || "{}");

	drafts[draftKey.value] = {
		updatedAt: new Date(),
		data: {
			text: text.value,
			file: file.value,
		},
	};

	localStorage.setItem("message_drafts", JSON.stringify(drafts));
}

function deleteDraft() {
	const drafts = JSON.parse(localStorage.getItem("message_drafts") || "{}");

	delete drafts[draftKey.value];

	localStorage.setItem("message_drafts", JSON.stringify(drafts));
}

async function insertEmoji(ev: MouseEvent) {
	os.openEmojiPicker(ev.currentTarget ?? ev.target, {}, textEl.value);
}

onMounted(() => {
	autosize(textEl.value);

	// TODO: detach when unmount
	new Autocomplete(textEl.value, text);

	// 書きかけの投稿を復元
	const draft = JSON.parse(localStorage.getItem("message_drafts") || "{}")[
		draftKey.value
	];
	if (draft) {
		text.value = draft.data.text;
		file.value = draft.data.file;
	}
});

defineExpose({
	file: file.value,
	upload,
});
</script>

<style lang="scss" scoped>
.pemppnzi {
	position: relative;
	margin-block-start: 1rem;

	> textarea {
		cursor: auto;
		display: block;
		inline-size: 100%;
		min-inline-size: 100%;
		max-inline-size: 100%;
		min-block-size: 80px;
		margin: 0;
		padding-block-start: 16px;
		padding-inline-end: 16px;
		padding-block-end: 0;
		padding-inline-start: 16px;
		resize: none;
		font-size: 1em;
		font-family: inherit;
		outline: none;
		border: none;
		border-radius: 0;
		box-shadow: none;
		background: transparent;
		box-sizing: border-box;
		color: var(--fg);
	}

	footer {
		position: sticky;
		inset-block-end: 0;
		background: var(--panel);

		> .file {
			padding: 8px;
			color: var(--fg);
			background: transparent;
			cursor: pointer;
		}
	}

	.files {
		display: block;
		margin: 0;
		padding-block: 0;
		padding-inline: 8px;
		list-style: none;

		&:after {
			content: "";
			display: block;
			clear: both;
		}

		> li {
			display: block;
			float: inline-start;
			margin: 4px;
			padding: 0;
			inline-size: 64px;
			block-size: 64px;
			background-color: #eee;
			background-repeat: no-repeat;
			background-position: center center;
			background-size: cover;
			cursor: move;

			&:hover {
				> .remove {
					display: block;
				}
			}

			> .remove {
				display: none;
				position: absolute;
				inset-inline-end: -6px;
				inset-block-start: -6px;
				margin: 0;
				padding: 0;
				background: transparent;
				outline: none;
				border: none;
				border-radius: 0;
				box-shadow: none;
				cursor: pointer;
			}
		}
	}

	.buttons {
		display: flex;

		._button {
			margin: 0;
			padding: 16px;
			font-size: 1em;
			font-weight: normal;
			text-decoration: none;
			transition: color 0.1s ease;

			&:hover {
				color: var(--accent);
			}

			&:active {
				color: var(--accentDarken);
				transition: color 0s ease;
			}
		}

		> .send {
			margin-inline-start: auto;
			color: var(--accent);

			&:hover {
				color: var(--accentLighten);
			}

			&:active {
				color: var(--accentDarken);
				transition: color 0s ease;
			}
		}
	}

	input[type="file"] {
		display: none;
	}
}
</style>
