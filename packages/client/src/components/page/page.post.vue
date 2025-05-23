<template>
	<div class="ngbfujlo">
		<MkTextarea :model-value="text" readonly style="margin: 0"></MkTextarea>
		<MkButton
			class="button"
			primary
			:disabled="posting || posted"
			@click="post()"
		>
			<i v-if="posted" :class="icon('ph-check')"></i>
			<i v-else :class="icon('ph-paper-plane-tilt')"></i>
		</MkButton>
	</div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";
import MkTextarea from "../form/textarea.vue";
import MkButton from "../MkButton.vue";
import { apiUrl } from "@/config";
import * as os from "@/os";
import type { PostBlock } from "@/scripts/hpml/block";
import type { Hpml } from "@/scripts/hpml/evaluator";
import icon from "@/scripts/icon";

export default defineComponent({
	components: {
		MkTextarea,
		MkButton,
	},
	props: {
		block: {
			type: Object as PropType<PostBlock>,
			required: true,
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true,
		},
	},
	data() {
		return {
			text: this.hpml.interpolate(this.block.text),
			posted: false,
			posting: false,
			icon,
		};
	},
	watch: {
		"hpml.vars": {
			handler() {
				this.text = this.hpml.interpolate(this.block.text);
			},
			deep: true,
		},
	},
	methods: {
		upload() {
			const promise = new Promise((ok) => {
				const canvas = this.hpml.canvases[this.block.canvasId];
				canvas.toBlob((blob) => {
					const formData = new FormData();
					formData.append("file", blob);
					if (this.defaultStore.state.uploadFolder) {
						formData.append("folderId", this.defaultStore.state.uploadFolder);
					}

					fetch(apiUrl + "/drive/files/create", {
						method: "POST",
						body: formData,
						headers: {
							authorization: `Bearer ${this.me.token}`,
						},
					})
						.then((response) => response.json())
						.then((f) => {
							ok(f);
						});
				});
			});
			os.promiseDialog(promise);
			return promise;
		},
		async post() {
			this.posting = true;
			const file = this.block.attachCanvasImage ? await this.upload() : null;
			os.apiWithDialog("notes/create", {
				text: this.text === "" ? null : this.text,
				fileIds: file ? [file.id] : undefined,
			}).then(() => {
				this.posted = true;
			});
		},
	},
});
</script>

<style lang="scss" scoped>
.ngbfujlo {
	position: relative;
	padding: 32px;
	border-radius: 6px;
	box-shadow: 0 2px 8px var(--shadow);
	z-index: 1;

	> .button {
		margin-block-start: 32px;
	}

	@media (max-inline-size: 600px) {
		padding: 16px;

		> .button {
			margin-block-start: 16px;
		}
	}
}
</style>
