<template>
	<div class="_formRoot">
		<FormSlot>
			<VueDraggable v-model="items" animation="150" delay="50">
				<div
					v-for="(element, index) in items"
					:key="index"
					class="item"
				>
					<i class="itemHandle ph-list ph-lg"></i>
					<i
						:class="
							icon(
								`${
									navbarItemDef[element]?.icon ??
									'ph-arrows-out-line-vertical'
								}`,
							)
						"
					></i>
					<span class="itemText">{{
						i18n.ts[navbarItemDef[element]?.title] ??
						i18n.ts.divider
					}}</span>
					<button
						class="_button itemRemove"
						@click="removeItem(index)"
					>
						<i :class="icon('ph-x')"></i>
					</button>
				</div>
			</VueDraggable>
			<FormSection>
				<div style="display: flex; gap: var(--margin); flex-wrap: wrap">
					<FormButton primary @click="addItem">
						<i :class="icon('ph-plus')"></i>
						{{ i18n.ts.addItem }}
					</FormButton>
					<FormButton @click="reloadAsk">
						<i :class="icon('ph-floppy-disk-back')"></i>
						{{ i18n.ts.apply }}
					</FormButton>
				</div>
			</FormSection>
		</FormSlot>

		<FormRadios v-model="menuDisplay" class="_formBlock">
			<template #label>{{ i18n.ts.display }}</template>
			<option value="sideFull">
				{{ i18n.ts._menuDisplay.sideFull }}
			</option>
			<option value="sideIcon">
				{{ i18n.ts._menuDisplay.sideIcon }}
			</option>
			<!-- <option value="top">{{ i18n.ts._menuDisplay.top }}</option> -->
			<!-- <MkRadio v-model="menuDisplay" value="hide" disabled>{{ i18n.ts._menuDisplay.hide }}</MkRadio>-->
			<!-- TODO: サイドバーを完全に隠せるようにすると、別途ハンバーガーボタンのようなものをUIに表示する必要があり面倒 -->
		</FormRadios>

		<FormButton danger class="_formBlock" @click="reset()"
			><i :class="icon('ph-arrow-clockwise')"></i>
			{{ i18n.ts.default }}</FormButton
		>
	</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import FormSlot from "@/components/form/slot.vue";
import FormRadios from "@/components/form/radios.vue";
import FormButton from "@/components/MkButton.vue";
import FormSection from "@/components/form/section.vue";
import * as os from "@/os";
import { navbarItemDef } from "@/navbar";
import { defaultStore } from "@/store";
import { unisonReload } from "@/scripts/unison-reload";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const items = ref(defaultStore.state.menu);

const menuDisplay = computed(defaultStore.makeGetterSetter("menuDisplay"));

async function reloadAsk() {
	const { canceled } = await os.confirm({
		type: "info",
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

async function addItem() {
	const menu = Object.keys(navbarItemDef).filter(
		(k) => !defaultStore.state.menu.includes(k),
	);
	const { canceled, result: item } = await os.select({
		title: i18n.ts.addItem,
		items: [
			...menu.map((k) => ({
				value: k,
				text: i18n.ts[navbarItemDef[k].title],
			})),
			{
				value: "-",
				text: i18n.ts.divider,
			},
		],
	});
	if (canceled) return;
	items.value = [...items.value, item];
}

async function removeItem(index) {
	items.value = items.value.filter((_, i) => i !== index);
}

async function save() {
	defaultStore.set("menu", items.value);
}

function reset() {
	defaultStore.reset("menu");
	items.value = defaultStore.state.menu;
}

watch(items, async () => {
	await save();
});

watch(menuDisplay, async () => {
	await reloadAsk();
});

definePageMetadata({
	title: i18n.ts.navbar,
	icon: `${icon("ph-list-bullets ph-dir")}`,
});
</script>

<style lang="scss" scoped>
.item {
	position: relative;
	display: block;
	line-height: 2.85rem;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
	border-radius: var(--radius);
	margin-block-end: 0.5rem;
	color: var(--navFg);
	background-color: var(--panel);

	> .itemIcon {
		position: relative;
	}

	> .itemText {
		position: relative;
		font-size: 0.9em;
		margin-inline-start: 1rem;
	}

	> .itemRemove {
		position: absolute;
		z-index: 10000;
		inline-size: 32px;
		block-size: 32px;
		color: var(--error);
		inset-block-start: 4px;
		inset-inline-end: 8px;
		opacity: 0.8;
	}

	> .itemHandle {
		cursor: move;
		inline-size: 32px;
		block-size: 32px;
		margin-block: 0;
		margin-inline: 1rem;
		opacity: 0.5;
	}
}
</style>
