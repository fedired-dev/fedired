<template>
	<div class="voxdxuby">
		<XNote
			v-if="note && !block.detailed"
			:key="note.id + ':normal'"
			v-model:note="note"
		/>
		<XNoteDetailed
			v-if="note && block.detailed"
			:key="note.id + ':detail'"
			v-model:note="note"
		/>
	</div>
</template>

<script lang="ts">
import type { PropType, Ref } from "vue";
import { defineComponent, onMounted, ref } from "vue";
import XNote from "@/components/MkNote.vue";
import XNoteDetailed from "@/components/MkNoteDetailed.vue";
import * as os from "@/os";
import type { NoteBlock } from "@/scripts/hpml/block";

export default defineComponent({
	components: {
		XNote,
		XNoteDetailed,
	},
	props: {
		block: {
			type: Object as PropType<NoteBlock>,
			required: true,
		},
	},
	setup(props, ctx) {
		const note: Ref<Record<string, any> | null> = ref(null);

		onMounted(() => {
			os.api("notes/show", { noteId: props.block.note }).then((result) => {
				note.value = result;
			});
		});

		return {
			note,
		};
	},
});
</script>

<style lang="scss" scoped>
.voxdxuby {
	margin-block: 1em;
	margin-inline: 0;
}
</style>
