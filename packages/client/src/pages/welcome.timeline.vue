<template>
	<div class="civpbkhh">
		<div ref="scroll" class="scrollbox" :class="{ scroll: isScrolling }">
			<div v-for="note in notes" class="note">
				<div v-if="note.cw == null" class="content _panel">
					<div class="body">
						<MkA
							v-if="note.replyId"
							class="reply"
							:to="`/notes/${note.replyId}`"
							><i :class="icon('ph-arrow-bend-up-left')"></i
						></MkA>
						<Mfm
							v-if="note.text"
							:text="note.text"
							:author="note.user"
							:i="me"
							:custom-emojis="note.emojis"
						/>
						<!-- <MkA v-if="note.renoteId" class="rp" :to="`/notes/${note.renoteId}`">RN: ...</MkA> -->
					</div>
					<div v-if="note.files.length > 0" class="richcontent">
						<XMediaList :media-list="note.files" />
					</div>
					<div v-if="note.poll">
						<XPoll :note="note" :read-only="true" />
					</div>
				</div>
				<XReactionsViewer ref="reactionsViewer" :note="note" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import XReactionsViewer from "@/components/MkReactionsViewer.vue";
import XMediaList from "@/components/MkMediaList.vue";
import XPoll from "@/components/MkPoll.vue";
import * as os from "@/os";
import icon from "@/scripts/icon";

export default defineComponent({
	components: {
		XReactionsViewer,
		XMediaList,
		XPoll,
	},

	data() {
		return {
			notes: [],
			isScrolling: false,
		};
	},

	created() {
		os.api("notes/featured").then((notes) => {
			this.notes = notes;
		});
	},

	updated() {
		if (this.$refs.scroll.clientHeight > window.innerHeight) {
			this.isScrolling = true;
		}
	},
});
</script>

<style lang="scss" scoped>
@keyframes scroll {
	0% {
		transform: translate3d(0, 0, 0);
	}
	5% {
		transform: translate3d(0, 0, 0);
	}
	75% {
		transform: translate3d(0, calc(-100% + 90vb), 0);
	}
	90% {
		transform: translate3d(0, calc(-100% + 90vb), 0);
	}
}

.civpbkhh {
	text-align: end;

	> .scrollbox {
		&.scroll {
			animation: scroll 45s linear infinite;
		}

		> .note {
			margin-block-start: 16px;
			margin-inline-end: 0;
			margin-block-end: 16px;
			margin-inline-start: auto;

			> .content {
				padding: 16px;
				margin-block-start: 0;
				margin-inline-end: 0;
				margin-block-end: 0;
				margin-inline-start: auto;
				max-inline-size: max-content;
				border-radius: 16px;

				> .richcontent {
					min-inline-size: 250px;
				}
			}
		}
	}
}
</style>
