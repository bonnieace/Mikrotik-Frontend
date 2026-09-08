<template>
  <article class="metric-card" :data-tone="tone" :aria-busy="loading">
    <div class="metric-top">
      <span class="metric-icon"
        ><span class="material-symbols-outlined" aria-hidden="true">{{ icon }}</span></span
      ><span class="badge">{{ tag }}</span>
    </div>
    <p class="metric-label">{{ label }}</p>
    <p class="metric">
      <span v-if="loading" class="material-symbols-outlined animate-spin" aria-label="Loading"
        >progress_activity</span
      ><template v-else>{{ value ?? '—' }}</template>
    </p>
    <p class="metric-note">{{ note }}</p>
  </article>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value?: string | number | null
    icon: string
    tone?: string
    tag?: string
    note: string
    loading?: boolean
  }>(),
  { value: null, tone: 'blue', tag: 'Overview', loading: false },
)
</script>
