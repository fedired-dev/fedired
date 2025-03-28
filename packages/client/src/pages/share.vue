<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader :actions="headerActions" :tabs="headerTabs"
		/></template>
		<MkSpacer :content-max="800">
			<XPostForm
				v-if="state === 'writing'"
				fixed
				:instant="true"
				:initial-text="initialText"
				:initial-visibility="visibility"
				:initial-files="files"
				:initial-local-only="localOnly"
				:reply="reply"
				:renote="renote"
				:initial-visible-users="visibleUsers"
				class="_panel"
				@posted="state = 'posted'"
			/>
			<MkButton
				v-else-if="state === 'posted'"
				primary
				class="close"
				@click="close()"
				>{{ i18n.ts.close }}</MkButton
			>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";

// SPECIFICATION: https://misskey-hub.net/docs/features/share-form.html
import type { entities } from "fedired-js";
import { acct } from "fedired-js";
import MkButton from "@/components/MkButton.vue";
import XPostForm from "@/components/MkPostForm.vue";
import * as os from "@/os";
import { mainRouter } from "@/router";
import { definePageMetadata } from "@/scripts/page-metadata";
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";
import type { NoteVisibility } from "@/types/note";
import { noteVisibilitiesClient } from "@/scripts/consts";

const urlParams = new URLSearchParams(window.location.search);
const localOnlyQuery = urlParams.get("localOnly");
const visibilityQuery = urlParams.get("visibility");

const state = ref("fetching" as "fetching" | "writing" | "posted");
const title = ref(urlParams.get("title"));
const text = urlParams.get("text");
const url = urlParams.get("url");
const initialText = ref(null as string | null);
const reply = ref(null as entities.Note | null);
const renote = ref(null as entities.Note | null);

function isVisibility(v: string | null): v is NoteVisibility {
	if (v == null) return false;
	return (noteVisibilitiesClient as readonly string[]).includes(v);
}

const visibility = ref(
	isVisibility(visibilityQuery) ? visibilityQuery : undefined,
);
const localOnly = ref(
	localOnlyQuery === "0" ? false : localOnlyQuery === "1" ? true : null,
);
const files = ref([] as entities.DriveFile[]);
const visibleUsers = ref([] as entities.User[]);

async function init() {
	let noteText = "";
	if (title.value) noteText += `${title.value}\n`;
	// Googleニュース対策
	if (text?.startsWith(`${title.value}.\n`))
		noteText += text.replace(`${title.value}.\n`, "");
	else if (text && title.value !== text) noteText += `${text}\n`;
	if (url) noteText += `${url}`;
	initialText.value = noteText.trim();

	if (visibility.value === "specified") {
		const visibleUserIds = urlParams.get("visibleUserIds");
		const visibleAccts = urlParams.get("visibleAccts");
		await Promise.all(
			[
				...(visibleUserIds
					? visibleUserIds.split(",").map((userId) => ({ userId }))
					: []),
				...(visibleAccts ? visibleAccts.split(",").map(acct.parse) : []),
			]
				// TypeScriptの指示通りに変換する
				.map((q) =>
					"username" in q
						? {
								username: q.username,
								host: q.host === null ? undefined : q.host,
							}
						: q,
				)
				.map((q) =>
					os.api("users/show", q).then(
						(user) => {
							visibleUsers.value.push(user);
						},
						() => {
							console.error(`Invalid user query: ${JSON.stringify(q)}`);
						},
					),
				),
		);
	}

	try {
		// #region Reply
		const replyId = urlParams.get("replyId");
		const replyUri = urlParams.get("replyUri");
		if (replyId) {
			reply.value = await os.api("notes/show", {
				noteId: replyId,
			});
		} else if (replyUri) {
			const obj = await os.api("ap/show", {
				uri: replyUri,
			});
			if (obj.type === "Note") {
				reply.value = obj.object;
			}
		}
		// #endregion

		// #region Renote
		const renoteId = urlParams.get("renoteId");
		const renoteUri = urlParams.get("renoteUri");
		if (renoteId) {
			renote.value = await os.api("notes/show", {
				noteId: renoteId,
			});
		} else if (renoteUri) {
			const obj = await os.api("ap/show", {
				uri: renoteUri,
			});
			if (obj.type === "Note") {
				renote.value = obj.object;
			}
		}
		// #endregion

		// #region Drive files
		const fileIds = urlParams.get("fileIds");
		if (fileIds) {
			await Promise.all(
				fileIds.split(",").map((fileId) =>
					os.api("drive/files/show", { fileId }).then(
						(file) => {
							files.value.push(file);
						},
						() => {
							console.error(`Failed to fetch a file ${fileId}`);
						},
					),
				),
			);
		}
		// #endregion
	} catch (err) {
		os.alert({
			type: "error",
			title: err.message,
			text: err.name,
		});
	}

	state.value = "writing";
}

init();

function close(): void {
	window.close();

	// 閉じなければ100ms後タイムラインに
	window.setTimeout(() => {
		mainRouter.push("/");
	}, 100);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.share,
	icon: `${icon("ph-share-network")}`,
});
</script>

<style lang="scss" scoped>
.close {
	margin-block: 16px;
	margin-inline: auto;
}
</style>
