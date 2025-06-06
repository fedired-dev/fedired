<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				v-model:tab="tab"
				:actions="headerActions"
				:tabs="headerTabs"
		/></template>
		<MkSpacer :content-max="700">
			<div class="jqqmcavi">
				<MkButton
					v-if="pageId"
					class="button"
					inline
					link
					:to="`/@${author.username}/pages/${currentName}`"
					><i :class="icon('ph-arrow-square-out')"></i>
					{{ i18n.ts._pages.viewPage }}</MkButton
				>
				<MkButton
					v-if="!readonly"
					inline
					primary
					class="button"
					@click="save"
					><i :class="icon('ph-floppy-disk-back')"></i>
					{{ i18n.ts.save }}</MkButton
				>
				<MkButton v-if="pageId" inline class="button" @click="duplicate"
					><i :class="icon('ph-clipboard-text')"></i>
					{{ i18n.ts.duplicate }}</MkButton
				>
				<MkButton
					v-if="pageId && !readonly"
					inline
					class="button"
					danger
					@click="del"
					><i :class="icon('ph-trash')"></i>
					{{ i18n.ts.delete }}</MkButton
				>
			</div>

			<div v-if="tab === 'settings'">
				<div class="_formRoot">
					<MkInput v-model="title" class="_formBlock">
						<template #label>{{ i18n.ts._pages.title }}</template>
					</MkInput>

					<MkInput v-model="summary" class="_formBlock">
						<template #label>{{ i18n.ts._pages.summary }}</template>
					</MkInput>

					<MkInput v-model="name" class="_formBlock">
						<template #prefix
							>{{ url }}/@{{ author.username }}/pages/</template
						>
						<template #label>{{ i18n.ts._pages.url }}</template>
					</MkInput>

					<MkSwitch v-model="isPublic" class="_formBlock">{{
						i18n.ts.public
					}}</MkSwitch>
					<MkSwitch v-model="alignCenter" class="_formBlock">{{
						i18n.ts._pages.alignCenter
					}}</MkSwitch>

					<MkSelect v-model="font" class="_formBlock">
						<template #label>{{ i18n.ts._pages.font }}</template>
						<option value="serif">
							{{ i18n.ts._pages.fontSerif }}
						</option>
						<option value="sans-serif">
							{{ i18n.ts._pages.fontSansSerif }}
						</option>
					</MkSelect>

					<MkSwitch
						v-model="hideTitleWhenPinned"
						class="_formBlock"
						>{{ i18n.ts._pages.hideTitleWhenPinned }}</MkSwitch
					>

					<div class="eyeCatch">
						<MkButton
							v-if="eyeCatchingImageId == null && !readonly"
							@click="setEyeCatchingImage"
							><i :class="icon('ph-plus')"></i>
							{{ i18n.ts._pages.eyeCatchingImageSet }}</MkButton
						>
						<div v-else-if="eyeCatchingImage">
							<img
								:src="eyeCatchingImage.url"
								:alt="eyeCatchingImage.name"
								style="max-inline-size: 100%"
							/>
							<MkButton
								v-if="!readonly"
								@click="removeEyeCatchingImage()"
								><i :class="icon('ph-trash')"></i>
								{{
									i18n.ts._pages.eyeCatchingImageRemove
								}}</MkButton
							>
						</div>
					</div>
				</div>
			</div>

			<div v-else-if="tab === 'contents'">
				<div>
					<XBlocks v-model="content" class="content" :hpml="hpml" />
					<MkButton v-if="!readonly" @click="add()"
						><i :class="icon('ph-plus')"></i
					></MkButton>
				</div>
			</div>

			<div v-else-if="tab === 'variables'">
				<div class="qmuvgica">
					<VueDraggable
						v-show="variables.length > 0"
						v-model="variables"
						tag="div"
						class="variables"
						handle=".drag-handle"
						:group="{ name: 'variables' }"
						:animation="150"
						:swap-threshold="0.5"
					>
						<XVariable
							v-for="element in variables"
							:key="element.name"
							:model-value="element"
							:removable="true"
							:hpml="hpml"
							:name="element.name"
							:title="element.name"
							:draggable="true"
							@remove="() => removeVariable(element)"
						/>
					</VueDraggable>

					<MkButton
						v-if="!readonly"
						class="add"
						@click="addVariable()"
						><i :class="icon('ph-plus')"></i
					></MkButton>
				</div>
			</div>

			<div v-else-if="tab === 'script'">
				<div>
					<MkTextarea v-model="script" class="_code" />
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, provide, ref, watch } from "vue";
import { v4 as uuid } from "uuid";
import { VueDraggable } from "vue-draggable-plus";
import XVariable from "./page-editor.script-block.vue";
import XBlocks from "./page-editor.blocks.vue";
import MkTextarea from "@/components/form/textarea.vue";
import MkButton from "@/components/MkButton.vue";
import MkSelect from "@/components/form/select.vue";
import MkSwitch from "@/components/form/switch.vue";
import MkInput from "@/components/form/input.vue";
import { blockDefs } from "@/scripts/hpml/index";
import { HpmlTypeChecker } from "@/scripts/hpml/type-checker";
import { url } from "@/config";
import { collectPageVars } from "@/scripts/collect-page-vars";
import * as os from "@/os";
import { selectFile } from "@/scripts/select-file";
import { mainRouter } from "@/router";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { me } from "@/me";
import icon from "@/scripts/icon";

const props = defineProps<{
	initPageId?: string;
	initPageName?: string;
	initUser?: string;
}>();

const tab = ref("settings");
const author = ref(me);
const readonly = ref(false);
const page = ref(null);
const pageId = ref(null);
const currentName = ref(null);
const title = ref("");
const summary = ref(null);
const name = ref(Date.now().toString());
const eyeCatchingImage = ref(null);
const eyeCatchingImageId = ref(null);
const font = ref("sans-serif");
const content = ref([]);
const alignCenter = ref(false);
const isPublic = ref(true);
const hideTitleWhenPinned = ref(false);
const variables = ref([]);
const hpml = ref(null);
const script = ref("");

provide("readonly", readonly.value);
provide("getScriptBlockList", getScriptBlockList);
provide("getPageBlockList", getPageBlockList);

watch(eyeCatchingImageId, async () => {
	if (eyeCatchingImageId.value == null) {
		eyeCatchingImage.value = null;
	} else {
		eyeCatchingImage.value = await os.api("drive/files/show", {
			fileId: eyeCatchingImageId.value,
		});
	}
});

function getSaveOptions() {
	return {
		title: title.value.trim(),
		name: name.value.trim(),
		summary: summary.value,
		font: font.value,
		script: script.value,
		hideTitleWhenPinned: hideTitleWhenPinned.value,
		alignCenter: alignCenter.value,
		isPublic: isPublic.value,
		content: content.value,
		variables: variables.value,
		eyeCatchingImageId: eyeCatchingImageId.value,
	};
}

function save() {
	const options = getSaveOptions();

	const onError = (err) => {
		if (err.id === "3d81ceae-475f-4600-b2a8-2bc116157532") {
			if (err.info.param === "name") {
				os.alert({
					type: "error",
					title: i18n.ts._pages.invalidNameTitle,
					text: i18n.ts._pages.invalidNameText,
				});
			}
		} else if (err.code === "NAME_ALREADY_EXISTS") {
			os.alert({
				type: "error",
				text: i18n.ts._pages.nameAlreadyExists,
			});
		}
	};

	if (pageId.value) {
		options.pageId = pageId.value;
		os.api("pages/update", options)
			.then((page) => {
				currentName.value = name.value.trim();
				os.alert({
					type: "success",
					text: i18n.ts._pages.updated,
				});
			})
			.catch(onError);
	} else {
		os.api("pages/create", options)
			.then((created) => {
				pageId.value = created.id;
				currentName.value = name.value.trim();
				os.alert({
					type: "success",
					text: i18n.ts._pages.created,
				});
				mainRouter.push(`/pages/edit/${pageId.value}`);
			})
			.catch(onError);
	}
}

function del() {
	os.confirm({
		type: "warning",
		text: i18n.t("removeAreYouSure", { x: title.value.trim() }),
	}).then(({ canceled }) => {
		if (canceled) return;
		os.api("pages/delete", {
			pageId: pageId.value,
		}).then(() => {
			os.alert({
				type: "success",
				text: i18n.ts._pages.deleted,
			});
			mainRouter.push("/pages");
		});
	});
}

function duplicate() {
	title.value = title.value + " - copy";
	name.value = name.value + "-copy";
	os.api("pages/create", getSaveOptions()).then((created) => {
		pageId.value = created.id;
		currentName.value = name.value.trim();
		os.alert({
			type: "success",
			text: i18n.ts._pages.created,
		});
		mainRouter.push(`/pages/edit/${pageId.value}`);
	});
}

async function add() {
	const { canceled, result: type } = await os.select({
		type: null,
		title: i18n.ts._pages.chooseBlock,
		groupedItems: getPageBlockList(),
	});
	if (canceled) return;

	const id = uuid();
	content.value.push({ id, type });
}

async function addVariable() {
	let { canceled, result: name } = await os.inputText({
		title: i18n.ts._pages.enterVariableName,
	});
	if (canceled) return;

	name = name.trim();

	if (hpml.value.isUsedName(name)) {
		os.alert({
			type: "error",
			text: i18n.ts._pages.variableNameIsAlreadyUsed,
		});
		return;
	}

	const id = uuid();
	variables.value.push({ id, name, type: null });
}

function removeVariable(v) {
	variables.value = variables.value.filter((x) => x.name !== v.name);
}

function getPageBlockList() {
	return [
		{
			label: i18n.ts._pages.contentBlocks,
			items: [
				{ value: "section", text: i18n.ts._pages.blocks.section },
				{ value: "text", text: i18n.ts._pages.blocks.text },
				{ value: "image", text: i18n.ts._pages.blocks.image },
				{ value: "textarea", text: i18n.ts._pages.blocks.textarea },
				{ value: "note", text: i18n.ts._pages.blocks.note },
				{ value: "canvas", text: i18n.ts._pages.blocks.canvas },
			],
		},
		{
			label: i18n.ts._pages.inputBlocks,
			items: [
				{ value: "button", text: i18n.ts._pages.blocks.button },
				{
					value: "radioButton",
					text: i18n.ts._pages.blocks.radioButton,
				},
				{ value: "textInput", text: i18n.ts._pages.blocks.textInput },
				{
					value: "textareaInput",
					text: i18n.ts._pages.blocks.textareaInput,
				},
				{
					value: "numberInput",
					text: i18n.ts._pages.blocks.numberInput,
				},
				{ value: "switch", text: i18n.ts._pages.blocks.switch },
				{ value: "counter", text: i18n.ts._pages.blocks.counter },
			],
		},
		{
			label: i18n.ts._pages.specialBlocks,
			items: [
				{ value: "if", text: i18n.ts._pages.blocks.if },
				{ value: "post", text: i18n.ts._pages.blocks.post },
			],
		},
	];
}

function getScriptBlockList(type: string = null) {
	const list = [];

	const blocks = blockDefs.filter(
		(block) =>
			type == null ||
			block.out == null ||
			block.out === type ||
			typeof block.out === "number",
	);

	for (const block of blocks) {
		const category = list.find((x) => x.category === block.category);
		if (category) {
			category.items.push({
				value: block.type,
				text: i18n.t(`_pages.script.blocks.${block.type}`),
			});
		} else {
			list.push({
				category: block.category,
				label: i18n.t(`_pages.script.categories.${block.category}`),
				items: [
					{
						value: block.type,
						text: i18n.t(`_pages.script.blocks.${block.type}`),
					},
				],
			});
		}
	}

	const userFns = variables.value.filter((x) => x.type === "fn");
	if (userFns.length > 0) {
		list.unshift({
			label: i18n.ts._pages.script.categories.fn,
			items: userFns.map((v) => ({
				value: "fn:" + v.name,
				text: v.name,
			})),
		});
	}

	return list;
}

function setEyeCatchingImage(img) {
	selectFile(img.currentTarget ?? img.target, null).then((file) => {
		eyeCatchingImageId.value = file.id;
	});
}

function removeEyeCatchingImage() {
	eyeCatchingImageId.value = null;
}

async function init() {
	hpml.value = new HpmlTypeChecker();

	watch(
		variables,
		() => {
			hpml.value.variables = variables.value;
		},
		{ deep: true },
	);

	watch(
		content,
		() => {
			hpml.value.pageVars = collectPageVars(content.value);
		},
		{ deep: true },
	);

	if (props.initPageId) {
		page.value = await os.api("pages/show", {
			pageId: props.initPageId,
		});
	} else if (props.initPageName && props.initUser) {
		page.value = await os.api("pages/show", {
			name: props.initPageName,
			username: props.initUser,
		});
		readonly.value = true;
	}

	if (page.value) {
		author.value = page.value.user;
		pageId.value = page.value.id;
		title.value = page.value.title;
		name.value = page.value.name;
		currentName.value = page.value.name;
		summary.value = page.value.summary;
		font.value = page.value.font;
		script.value = page.value.script;
		hideTitleWhenPinned.value = page.value.hideTitleWhenPinned;
		alignCenter.value = page.value.alignCenter;
		isPublic.value = page.value.isPublic;
		content.value = page.value.content;
		variables.value = page.value.variables;
		eyeCatchingImageId.value = page.value.eyeCatchingImageId;
	} else {
		const id = uuid();
		content.value = [
			{
				id,
				type: "text",
				text: "",
			},
		];
	}
}

init();

const headerActions = computed(() => []);

const headerTabs = computed(() => [
	{
		key: "settings",
		title: i18n.ts._pages.pageSetting,
		icon: `${icon("ph-gear-six")}`,
	},
	{
		key: "contents",
		title: i18n.ts._pages.contents,
		icon: `${icon("ph-sticker")}`,
	},
	{
		key: "variables",
		title: i18n.ts._pages.variables,
		icon: `${icon("ph-magic-wand")}`,
	},
	{
		key: "script",
		title: i18n.ts.script,
		icon: `${icon("ph-code")}`,
	},
]);

definePageMetadata(
	computed(() => {
		let title = i18n.ts._pages.newPage;
		if (props.initPageId) {
			title = i18n.ts._pages.editPage;
		} else if (props.initPageName && props.initUser) {
			title = i18n.ts._pages.readPage;
		}
		return {
			title,
			icon: `${icon("ph-pencil")}`,
		};
	}),
);
</script>

<style lang="scss" scoped>
.jqqmcavi {
	> .button {
		& + .button {
			margin: 4px;
		}
	}
}

.gwbmwxkm {
	position: relative;

	> header {
		> .title {
			z-index: 1;
			margin: 0;
			padding-block: 0;
			padding-inline: 16px;
			line-height: 42px;
			font-size: 0.9em;
			font-weight: bold;
			box-shadow: 0 1px rgba(#000, 0.07);

			> i {
				margin-inline-end: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> .buttons {
			position: absolute;
			z-index: 2;
			inset-block-start: 0;
			inset-inline-end: 0;

			> button {
				padding: 0;
				inline-size: 42px;
				font-size: 0.9em;
				line-height: 42px;
			}
		}
	}

	> section {
		padding-block-start: 0;
		padding-inline-end: 32px;
		padding-block-end: 32px;
		padding-inline-start: 32px;

		@media (max-inline-size: 500px) {
			padding-block-start: 0;
			padding-inline-end: 16px;
			padding-block-end: 16px;
			padding-inline-start: 16px;
		}

		> .view {
			display: inline-block;
			margin-block-start: 16px;
			margin-inline-end: 0;
			margin-block-end: 0;
			margin-inline-start: 0;
			font-size: 14px;
		}

		> .content {
			margin-block-end: 16px;
		}

		> .eyeCatch {
			margin-block-end: 16px;

			> div {
				> img {
					max-inline-size: 100%;
				}
			}
		}
	}
}

.qmuvgica {
	padding: 16px;

	> .variables {
		margin-block-end: 16px;
	}

	> .add {
		margin-block-end: 16px;
	}
}
</style>
