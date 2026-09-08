<template>
  <AdminLoginPage />
</template>

<script setup lang="ts">
import AdminLoginPage from '~/features/admin-login/components/AdminLoginPage.vue'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Admin Login — Uzanet' })
</script>
