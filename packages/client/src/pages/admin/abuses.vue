<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="900">
			<div class="lcixvhis">
				<div class="_section reports">
					<div class="_content">
						<div class="inputs" style="display: flex">
							<MkSelect
								v-model="state"
								style="margin: 0; flex: 1"
							>
								<template #label>{{ i18n.ts.state }}</template>
								<option value="all">{{ i18n.ts.all }}</option>
								<option value="unresolved">
									{{ i18n.ts.unresolved }}
								</option>
								<option value="resolved">
									{{ i18n.ts.resolved }}
								</option>
							</MkSelect>
							<MkSelect
								v-model="targetUserOrigin"
								style="margin: 0; flex: 1"
							>
								<template #label>{{
									i18n.ts.reporteeOrigin
								}}</template>
								<option value="combined">
									{{ i18n.ts.all }}
								</option>
								<option value="local">
									{{ i18n.ts.local }}
								</option>
								<option value="remote">
									{{ i18n.ts.remote }}
								</option>
							</MkSelect>
							<MkSelect
								v-model="reporterOrigin"
								style="margin: 0; flex: 1"
							>
								<template #label>{{
									i18n.ts.reporterOrigin
								}}</template>
								<option value="combined">
									{{ i18n.ts.all }}
								</option>
								<option value="local">
									{{ i18n.ts.local }}
								</option>
								<option value="remote">
									{{ i18n.ts.remote }}
								</option>
							</MkSelect>
						</div>
						<!-- TODO
			<div class="inputs" style="display: flex; padding-block-start: 1.2em;">
				<MkInput v-model="searchUsername" style="margin-block-start: 0;;
				<MkInput v-model="searchUsername" style="margin-inline: flex:;
				<MkInput v-model="searchUsername" style="margin-block-end: 1;" type="text" :spellcheck="false">
					<span>{{ i18n.ts.username }}</span>
				</MkInput>
				<MkInput v-model="searchHost" style="margin-block-start: 0;;
				<MkInput v-model="searchHost" style="margin-inline: flex:;
				<MkInput v-model="searchHost" style="margin-block-end: 1;" type="text" :spellcheck="false" :disabled="pagination.params().origin === 'local'">
					<span>{{ i18n.ts.host }}</span>
				</MkInput>
			</div>
			-->

						<MkPagination
							v-slot="{ items }"
							ref="reports"
							:pagination="pagination"
							style="margin-block-start: var(--margin)"
						>
							<XAbuseReport
								v-for="report in items"
								:key="report.id"
								:report="report"
								@resolved="resolved"
							/>
						</MkPagination>
					</div>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";

import type { entities } from "fedired-js";
import MkSelect from "@/components/form/select.vue";
import MkPagination, {
	type MkPaginationType,
} from "@/components/MkPagination.vue";
import XAbuseReport from "@/components/MkAbuseReport.vue";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

const reports = ref<MkPaginationType<typeof pagination.endpoint> | null>(null);

const state = ref("unresolved");
const reporterOrigin = ref<entities.OriginType>("combined");
const targetUserOrigin = ref<entities.OriginType>("combined");
// const searchUsername = ref("");
// const searchHost = ref("");

const pagination = {
	endpoint: "admin/abuse-user-reports" as const,
	limit: 10,
	params: computed(() => ({
		state: state.value,
		reporterOrigin: reporterOrigin.value,
		targetUserOrigin: targetUserOrigin.value,
	})),
};

function resolved(reportId) {
	reports.value?.removeItem((item) => item.id === reportId);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.abuseReports,
	icon: `${icon("ph-warning-circle")}`,
});
</script>

<style lang="scss" scoped>
.lcixvhis {
	margin: var(--margin);
}
</style>
