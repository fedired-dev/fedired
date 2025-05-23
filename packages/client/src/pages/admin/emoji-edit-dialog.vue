<template>
	<XModalWindow
		ref="dialog"
		:width="370"
		:with-ok-button="true"
		@close="$refs.dialog.close()"
		@closed="$emit('closed')"
		@ok="ok()"
	>
		<template #header>:{{ emoji.name }}:</template>

		<div class="_monolithic_">
			<div class="yigymqpb _section">
				<img :src="emoji.url" class="img" />
				<MkInput v-model="name" class="_formBlock">
					<template #label>{{ i18n.ts.name }}</template>
				</MkInput>
				<MkInput
					v-model="category"
					class="_formBlock"
					:datalist="categories"
				>
					<template #label>{{ i18n.ts.category }}</template>
				</MkInput>
				<MkInput v-model="aliases" class="_formBlock">
					<template #label>{{ i18n.ts.tags }}</template>
					<template #caption>{{
						i18n.ts.setMultipleBySeparatingWithSpace
					}}</template>
				</MkInput>
				<MkTextarea v-model="license" class="_formBlock">
					<template #label>{{ i18n.ts.license }}</template>
				</MkTextarea>
				<MkButton danger @click="del()"
					><i :class="icon('ph-trash')"></i>
					{{ i18n.ts.delete }}</MkButton
				>
			</div>
		</div>
	</XModalWindow>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import XModalWindow from "@/components/MkModalWindow.vue";
import MkButton from "@/components/MkButton.vue";
import MkInput from "@/components/form/input.vue";
import MkTextarea from "@/components/form/textarea.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { emojiCategories } from "@/instance";
import icon from "@/scripts/icon";

const props = defineProps<{
	emoji: any;
}>();

const dialog = ref<any>(null);
const name = ref<string>(props.emoji.name);
const category = ref<string>(props.emoji.category);
const aliases = ref<string>(props.emoji.aliases.join(" "));
const categories = ref(emojiCategories);
const license = ref<string>(props.emoji.license ?? "");

const emit = defineEmits<{
	(ev: "done", v: { deleted?: boolean; updated?: any }): void;
	(ev: "closed"): void;
}>();

function ok() {
	update();
}

async function update() {
	await os.apiWithDialog("admin/emoji/update", {
		id: props.emoji.id,
		name: name.value,
		category: category.value,
		aliases: aliases.value.split(" "),
		license: license.value === "" ? null : license.value,
	});

	emit("done", {
		updated: {
			id: props.emoji.id,
			name: name.value,
			category: category.value,
			aliases: aliases.value.split(" "),
			license: license.value === "" ? null : license.value,
		},
	});

	dialog.value.close();
}

async function del() {
	const { canceled } = await os.confirm({
		type: "warning",
		text: i18n.t("removeAreYouSure", { x: name.value }),
	});
	if (canceled) return;

	os.api("admin/emoji/delete", {
		id: props.emoji.id,
	}).then(() => {
		emit("done", {
			deleted: true,
		});
		dialog.value.close();
	});
}
</script>

<style lang="scss" scoped>
.yigymqpb {
	> .img {
		position: relative;
		display: block;
		block-size: 64px;
		margin-block: 0;
		margin-inline: auto;
	}
}
</style>
