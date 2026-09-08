<template>
  <div v-if="loading" class="empty-state" role="status">
    <span class="state-icon"
      ><span class="material-symbols-outlined animate-spin" aria-hidden="true"
        >progress_activity</span
      ></span
    ><strong>Loading {{ label }}…</strong>
    <p class="muted">Getting the latest data for this router.</p>
  </div>
  <div v-else-if="error" class="empty-state" role="alert">
    <span class="state-icon"
      ><span class="material-symbols-outlined text-red-500" aria-hidden="true"
        >cloud_off</span
      ></span
    ><strong>Unable to load {{ label }}</strong>
    <p class="muted">{{ error }}</p>
    <button @click="$emit('retry')">
      <span class="material-symbols-outlined text-[16px]" aria-hidden="true">refresh</span>Try again
    </button>
  </div>
  <div v-else-if="!selected" class="empty-state">
    <span class="state-icon"
      ><span class="material-symbols-outlined" aria-hidden="true">router</span></span
    ><strong>Select a router to get started</strong>
    <p class="muted">Choose a router in the top bar to view its {{ label }}.</p>
    <NuxtLink to="/routers" class="action"
      >Manage routers<span class="material-symbols-outlined text-[16px]" aria-hidden="true"
        >arrow_forward</span
      ></NuxtLink
    >
  </div>
  <slot v-else />
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    loading: boolean
    error: string
    selected?: boolean
    label?: string
  }>(),
  { label: 'records', selected: true },
)
defineEmits<{ retry: [] }>()
</script>
