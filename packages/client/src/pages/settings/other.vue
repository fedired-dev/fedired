<template>
	<div class="_formRoot">
		<FormLink to="/settings/account-info" class="_formBlock">{{
			i18n.ts.accountInfo
		}}</FormLink>

		<FormLink to="/my/follow-requests/sent" class="_formBlock">{{
			i18n.ts.sentFollowRequests
		}}</FormLink>

		<FormLink to="/registry" class="_formBlock"
			><template #icon><i :class="icon('ph-gear-six')"></i></template
			>{{ i18n.ts.registry }}</FormLink
		>

		<FormLink to="https://help.fedired.com/report/bug/" external>
                <template #icon>
                  <i :class="icon('ph-bold ph-bug')"></i>
                </template>
                Bugs
                <template #suffix>Reportar Error</template>
              </FormLink>

		<FormLink to="/settings/delete-account" class="_formBlock"
			><template #icon><i :class="icon('ph-warning')"></i></template
			>{{ i18n.ts.closeAccount }}</FormLink
		>
	</div>
</template>

<script lang="ts" setup>
import FormLink from "@/components/form/link.vue";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";

definePageMetadata({
	title: i18n.ts.other,
	icon: `${icon("ph-dots-three-outline ph-dir")}`,
});
</script>
