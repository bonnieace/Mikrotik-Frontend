<template>
  <p v-if="loading" class="notice" role="status">Loading…</p>
  <div v-else-if="error" class="notice error" role="alert">{{ error }} <button @click="$emit('retry')">Retry</button></div>
  <p v-else-if="!selected" class="notice">Select a router above, or add one in Infrastructure.</p>
  <slot v-else />
</template>
<script setup lang="ts">
defineProps<{ loading: boolean; error: string; selected?: boolean }>()
defineEmits<{ retry: [] }>()
</script>
