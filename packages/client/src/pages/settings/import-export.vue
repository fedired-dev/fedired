<template>
	<div class="_formRoot">
		<FormSection>
			<template #label>{{ i18n.ts._exportOrImport.allNotes }}</template>
			<FormFolder>
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon
					><i :class="icon('ph-download-simple')"></i
				></template>
				<MkButton
					primary
					:class="$style.button"
					inline
					@click="exportNotes()"
					><i :class="icon('ph-download-simple')"></i>
					{{ i18n.ts.export }}</MkButton
				>
			</FormFolder>
			<FormFolder class="_formBlock">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon
					><i :class="icon('ph-upload-simple')"></i
				></template>
				<FormRadios v-model="importType" class="_formBlock">
					<option value="fedired">Fedired/Misskey</option>
					<option value="mastodon">Mastodon/Akkoma/Pleroma</option>
				</FormRadios>
				<MkButton
					primary
					:class="$style.button"
					inline
					@click="importPosts($event)"
					><i :class="icon('ph-upload-simple')"></i>
					{{ i18n.ts.import }}</MkButton
				>
			</FormFolder>
		</FormSection>
		<FormSection>
			<template #label>{{
				i18n.ts._exportOrImport.followingList
			}}</template>
			<FormFolder class="_formBlock">
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon
					><i :class="icon('ph-download-simple')"></i
				></template>
				<FormSwitch v-model="excludeMutingUsers" class="_formBlock">
					{{ i18n.ts._exportOrImport.excludeMutingUsers }}
				</FormSwitch>
				<FormSwitch v-model="excludeInactiveUsers" class="_formBlock">
					{{ i18n.ts._exportOrImport.excludeInactiveUsers }}
				</FormSwitch>
				<MkButton
					primary
					:class="$style.button"
					inline
					@click="exportFollowing()"
					><i :class="icon('ph-download-simple')"></i>
					{{ i18n.ts.export }}</MkButton
				>
			</FormFolder>
			<FormFolder class="_formBlock">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon
					><i :class="icon('ph-upload-simple')"></i
				></template>
				<MkButton
					primary
					:class="$style.button"
					inline
					@click="importFollowing($event)"
					><i :class="icon('ph-upload-simple')"></i>
					{{ i18n.ts.import }}</MkButton
				>
			</FormFolder>
		</FormSection>
		<FormSection>
			<template #label>{{
				i18n.ts.followers
			}}</template>
			<FormFolder class="_formBlock">
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon
					><i :class="icon('ph-download-simple')"></i
				></template>
				<FormSwitch v-model="excludeMutingUsers" class="_formBlock">
					{{ i18n.ts._exportOrImport.excludeMutingUsers }}
				</FormSwitch>
				<FormSwitch v-model="excludeInactiveUsers" class="_formBlock">
					{{ i18n.ts._exportOrImport.excludeInactiveUsers }}
				</FormSwitch>
				<MkButton
					primary
					:class="$style.button"
					inline
					@click="exportFollowers()"
					><i :class="icon('ph-download-simple')"></i>
					{{ i18n.ts.export }}</MkButton
				>
			</FormFolder>
		</FormSection>
		<FormSection>
			<template #label>{{ i18n.ts._exportOrImport.userLists }}</template>
			<FormFolder class="_formBlock">
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon
					><i :class="icon('ph-download-simple')"></i
				></template>
				<MkButton
					primary
					:class="$style.button"
					inline
					@click="exportUserLists()"
					><i :class="icon('ph-download-simple')"></i>
					{{ i18n.ts.export }}</MkButton
				>
			</FormFolder>
			<FormFolder class="_formBlock">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon
					><i :class="icon('ph-upload-simple')"></i
				></template>
				<MkButton
					primary
					:class="$style.button"
					inline
					@click="importUserLists($event)"
					><i :class="icon('ph-upload-simple')"></i>
					{{ i18n.ts.import }}</MkButton
				>
			</FormFolder>
		</FormSection>
		<FormSection>
			<template #label>{{ i18n.ts._exportOrImport.muteList }}</template>
			<FormFolder class="_formBlock">
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon
					><i :class="icon('ph-download-simple')"></i
				></template>
				<MkButton
					primary
					:class="$style.button"
					inline
					@click="exportMuting()"
					><i :class="icon('ph-download-simple')"></i>
					{{ i18n.ts.export }}</MkButton
				>
			</FormFolder>
			<FormFolder class="_formBlock">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon
					><i :class="icon('ph-upload-simple')"></i
				></template>
				<MkButton
					primary
					:class="$style.button"
					inline
					@click="importMuting($event)"
					><i :class="icon('ph-upload-simple')"></i>
					{{ i18n.ts.import }}</MkButton
				>
			</FormFolder>
		</FormSection>
		<FormSection>
			<template #label>{{
				i18n.ts._exportOrImport.blockingList
			}}</template>
			<FormFolder class="_formBlock">
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon
					><i :class="icon('ph-download-simple')"></i
				></template>
				<MkButton
					primary
					:class="$style.button"
					inline
					@click="exportBlocking()"
					><i :class="icon('ph-download-simple')"></i>
					{{ i18n.ts.export }}</MkButton
				>
			</FormFolder>
			<FormFolder class="_formBlock">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon
					><i :class="icon('ph-upload-simple')"></i
				></template>
				<MkButton
					primary
					:class="$style.button"
					inline
					@click="importBlocking($event)"
					><i :class="icon('ph-upload-simple')"></i>
					{{ i18n.ts.import }}</MkButton
				>
			</FormFolder>
		</FormSection>
	</div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import MkButton from "@/components/MkButton.vue";
import FormSection from "@/components/form/section.vue";
import FormFolder from "@/components/form/folder.vue";
import FormSwitch from "@/components/form/switch.vue";
import FormRadios from "@/components/form/radios.vue";
import * as os from "@/os";
import { selectFile } from "@/scripts/select-file";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const excludeMutingUsers = ref(false);
const importType = ref("fedired");
const excludeInactiveUsers = ref(false);

const onExportSuccess = () => {
	os.alert({
		type: "info",
		text: i18n.ts.exportRequested,
	});
};

const onImportSuccess = () => {
	os.alert({
		type: "info",
		text: i18n.ts.importRequested,
	});
};

const onError = (ev) => {
	os.alert({
		type: "error",
		text: ev.message,
	});
};

const exportNotes = () => {
	os.api("i/export-notes", {}).then(onExportSuccess).catch(onError);
};

const importPosts = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api("i/import-posts", {
		fileId: file.id,
		signatureCheck: false,
	})
		.then(onImportSuccess)
		.catch(onError);
};

const exportFollowing = () => {
	os.api("i/export-following", {
		excludeMuting: excludeMutingUsers.value,
		excludeInactive: excludeInactiveUsers.value,
	})
		.then(onExportSuccess)
		.catch(onError);
};

const exportFollowers = () => {
	os.api("i/export-followers", {
		excludeMuting: excludeMutingUsers.value,
		excludeInactive: excludeInactiveUsers.value,
	})
		.then(onExportSuccess)
		.catch(onError);
};

const exportBlocking = () => {
	os.api("i/export-blocking", {}).then(onExportSuccess).catch(onError);
};

const exportUserLists = () => {
	os.api("i/export-user-lists", {}).then(onExportSuccess).catch(onError);
};

const exportMuting = () => {
	os.api("i/export-mute", {}).then(onExportSuccess).catch(onError);
};

const importFollowing = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api("i/import-following", { fileId: file.id })
		.then(onImportSuccess)
		.catch(onError);
};

const importUserLists = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api("i/import-user-lists", { fileId: file.id })
		.then(onImportSuccess)
		.catch(onError);
};

const importMuting = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api("i/import-muting", { fileId: file.id })
		.then(onImportSuccess)
		.catch(onError);
};

const importBlocking = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api("i/import-blocking", { fileId: file.id })
		.then(onImportSuccess)
		.catch(onError);
};

definePageMetadata({
	title: i18n.ts.importAndExport,
	icon: `${icon("ph-package")}`,
});
</script>

<style module>
.button {
	margin-inline-end: 16px;
}
</style>
