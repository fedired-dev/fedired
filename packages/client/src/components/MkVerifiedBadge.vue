<template>
    <span 
        v-if="isVerified(user?.username || note?.username || username)" 
        v-tooltip.noDelay="'Una insignia de verificación confirma que se trata de una página/perfil auténtico para esta empresa, organización o persona.'" 
        class="verified-badge"
    >
        <i :class="icon('ph-fill ph-seal-check')"></i>
    </span>
</template>

<script lang="ts" setup>
import icon from "@/scripts/icon";
import { isVerified } from '@fedired/verified-users';
import type { entities } from "fedired-js";

defineProps<{
    username?: string;
    user?: entities.User;
    note?: entities.Note;
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