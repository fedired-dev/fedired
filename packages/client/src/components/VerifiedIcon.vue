<template>
    <span v-if="isVerified" v-tooltip.noDelay="'Verificado'" style="color: var(--badge); margin-left: 4px;">
        <i :class="icon('ph-bold ph-seal-check')"></i>
    </span>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';

defineProps<{ username: string }>();

const verifiedUsers = ref<string[]>([]);

onMounted(async () => {
    try {
        const response = await fetch('/api/verified-users'); // Reemplaza axios por fetch
        if (!response.ok) {
            throw new Error('Error al cargar usuarios verificados');
        }
        const data = await response.json(); // Convierte la respuesta a JSON
        verifiedUsers.value = data;
    } catch (error) {
        console.error('Error al cargar usuarios verificados:', error);
    }
});

const isVerified = computed(() => verifiedUsers.value.includes(username));
</script>
