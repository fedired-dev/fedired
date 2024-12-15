<template>
    <div>
        <span>{{ user.name }} (@{{ user.username }})</span>
        <span
            v-if="isAdmin"
            v-tooltip.noDelay="'Verificado como Administrador'"
            style="color: var(--badge); margin-left: 4px;"
        >
            <i :class="icon('ph-bold ph-seal-check')"></i>
        </span>
        <span
            v-if="isModerator"
            v-tooltip.noDelay="'Verificado como Moderador'"
            style="color: var(--badge); margin-left: 4px;"
        >
            <i :class="icon('ph-bold ph-seal-check')"></i>
        </span>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'; 

defineProps<{
    user: {
        name: string;
        username: string;
    };
}>();

const verifiedUsers = ref<{ username: string; role: string }[]>([]);

onMounted(async () => {
    try {
        const response = await fetch('/api/verified-users'); // 
        if (!response.ok) {
            throw new Error('Error al cargar usuarios verificados');
        }
        const data = await response.json(); // Convierte la respuesta a JSON
        verifiedUsers.value = data;
    } catch (error) {
        console.error('Error al cargar usuarios verificados:', error);
    }
});

const isAdmin = computed(() =>
    verifiedUsers.value.some((verified) => verified.username === user.username && verified.role === 'admin')
);

const isModerator = computed(() =>
    verifiedUsers.value.some((verified) => verified.username === user.username && verified.role === 'moderator')
);
</script>
