<template>
  <LegacyPortalPage />
</template>

<script setup lang="ts">
import LegacyPortalPage from '../[portalSlug].vue'

definePageMeta({
  layout: 'default',
  customerPortal: true,
  key: (route) => route.path,
})
</script>
