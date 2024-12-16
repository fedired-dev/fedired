<template>
    <span 
        v-if="isVerified(username)" 
        v-tooltip.noDelay="i18n.ts.profileVerified" 
        class="verified-badge"
    >
        <i :class="icon('ph-fill ph-seal-check')"></i>
    </span>
</template>

<script lang="ts" setup>
import { i18n } from "@/i18n";
import icon from "@/scripts/icon";
import { isVerified } from '@fedired/verified-users';

defineProps<{
    username: string;
}>();
</script>

<style lang="scss" scoped>
.verified-badge {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
    color: var(--accent);
    
    i {
        font-size: 1.2em;
    }

    @media screen and (max-width: 500px) {
        display: inline-flex;
        justify-content: center;
        margin: 4px auto;
    }
}
</style>