<template>
	<div>
		<MkButton class="kudkigyw" :primary="block.primary" @click="click()">{{
			hpml.interpolate(block.text)
		}}</MkButton>
	</div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent, unref } from "vue";
import MkButton from "../MkButton.vue";
import * as os from "@/os";
import type { ButtonBlock } from "@/scripts/hpml/block";
import type { Hpml } from "@/scripts/hpml/evaluator";

export default defineComponent({
	components: {
		MkButton,
	},
	props: {
		block: {
			type: Object as PropType<ButtonBlock>,
			required: true,
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true,
		},
	},
	methods: {
		click() {
			if (this.block.action === "dialog") {
				this.hpml.eval();
				os.alert({
					text: this.hpml.interpolate(this.block.content),
				});
			} else if (this.block.action === "resetRandom") {
				this.hpml.updateRandomSeed(Math.random());
				this.hpml.eval();
			} else if (this.block.action === "pushEvent") {
				os.api("page-push", {
					pageId: this.hpml.page.id,
					event: this.block.event,
					...(this.block.var
						? {
								var: unref(this.hpml.vars)[this.block.var],
							}
						: {}),
				});

				os.alert({
					type: "success",
					text: this.hpml.interpolate(this.block.message),
				});
			} else if (this.block.action === "callAiScript") {
				this.hpml.callAiScript(this.block.fn);
			}
		},
	},
});
</script>

<style lang="scss" scoped>
.kudkigyw {
	display: inline-block;
	min-inline-size: 200px;
	max-inline-size: 450px;
	margin-block: 8px;
	margin-inline: 0;
}
</style>
