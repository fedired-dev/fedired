<template>
	<MkStickyContainer>
		<template #header>
			<MkTab v-model="include" :class="$style.tab">
				<option :value="null">{{ i18n.ts.notes }}</option>
				<option value="replies">{{ i18n.ts.notesAndReplies }}</option>
				<option value="files">{{ i18n.ts.withFiles }}</option>
			</MkTab>
		</template>
		<XNotes :no-gap="true" :pagination="pagination" />
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import type { entities } from "fedired-js";
import XNotes from "@/components/MkNotes.vue";
import MkTab from "@/components/MkTab.vue";
import { i18n } from "@/i18n";

const props = defineProps<{
	user: entities.UserDetailed;
}>();

const include = ref<string | null>(null);

const pagination = {
	endpoint: "users/notes" as const,
	limit: 10,
	params: computed(() => ({
		userId: props.user.id,
		includeReplies: include.value === "replies",
		withFiles: include.value === "files",
	})),
};
</script>

<style lang="scss" module>
.tab {
	margin-block: calc(var(--margin) / 2);
	margin-inline: 0;
	padding-block: calc(var(--margin) / 2);
	padding-inline: 0;
	background: var(--bg);
}
</style>
