<template>
  <span class="badge" :class="tone"><span aria-hidden="true">•</span>{{ label }}</span>
</template>
<script setup lang="ts">
const props = defineProps<{ status: string }>()
const label = computed(() => props.status.replaceAll('_', ' '))
const tone = computed(() =>
  ['completed', 'provisioned', 'enabled', 'online', 'active'].includes(props.status)
    ? 'good'
    : ['offline', 'failed', 'provisioning_failed', 'error'].includes(props.status)
      ? 'bad'
      : ['pending', 'created', 'paid', 'provisioning', 'manual_review', 'warning'].includes(
            props.status,
          )
        ? 'warning'
        : '',
)
</script>
