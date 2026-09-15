<template>
  <div class="bg-surface font-body-md text-on-surface antialiased min-h-screen flex items-center justify-center relative overflow-hidden py-10">
    <div class="absolute inset-0 technical-grid opacity-30 z-0"></div>
    <div class="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-secondary-fixed-dim/20 rounded-full blur-3xl z-0"></div>
    <div class="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary-fixed/20 rounded-full blur-3xl z-0"></div>

    <main class="relative z-10 w-full max-w-[520px] px-6">
      <div class="text-center mb-xl">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary text-on-primary rounded-xl mb-md shadow-sm">
          <span class="material-symbols-outlined text-display" data-icon="router">router</span>
        </div>
        <h1 class="font-display text-display text-primary tracking-tighter">Create your Uzanet ISP</h1>
        <p class="font-body-md text-on-surface-variant mt-xs">Create the operator account, then connect your first MikroTik.</p>
      </div>

      <div class="bg-white border border-outline-variant p-xl rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <form class="space-y-lg" @submit.prevent="handleSignup">
          <div class="space-y-xs">
            <label class="font-table-header text-table-header text-outline block uppercase tracking-wider" for="isp-id">ISP identifier</label>
            <input
              id="isp-id"
              v-model="form.username"
              class="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none"
              name="isp-id"
              placeholder="example-net"
              autocomplete="username"
              minlength="3"
              maxlength="60"
              pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
              required
            />
            <p class="font-body-sm text-on-surface-variant">Lowercase letters, numbers and hyphens. This becomes the stable identifier in your customer portal links.</p>
          </div>

          <div class="space-y-xs">
            <label class="font-table-header text-table-header text-outline block uppercase tracking-wider" for="email">Owner email</label>
            <input
              id="email"
              v-model="form.email"
              class="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none"
              name="email"
              type="email"
              autocomplete="email"
              maxlength="255"
              placeholder="owner@example.com"
              required
            />
          </div>

          <div class="grid sm:grid-cols-2 gap-md">
            <div class="space-y-xs">
              <label class="font-table-header text-table-header text-outline block uppercase tracking-wider" for="password">Password</label>
              <input
                id="password"
                v-model="form.password"
                class="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none"
                name="password"
                type="password"
                autocomplete="new-password"
                minlength="12"
                maxlength="128"
                required
              />
            </div>
            <div class="space-y-xs">
              <label class="font-table-header text-table-header text-outline block uppercase tracking-wider" for="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                v-model="form.confirm"
                class="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none"
                name="confirm-password"
                type="password"
                autocomplete="new-password"
                minlength="12"
                maxlength="128"
                required
              />
            </div>
          </div>

          <p v-if="error" class="text-red-700 text-sm" role="alert">{{ error }}</p>

          <button
            :disabled="loading"
            class="w-full bg-primary text-on-primary py-3 px-4 rounded-md font-h3 text-h3 hover:bg-on-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            type="submit"
          >
            <span v-if="loading" class="material-symbols-outlined text-body-lg animate-spin">progress_activity</span>
            <template v-else>
              Create ISP account
              <span class="material-symbols-outlined text-body-lg" data-icon="arrow_forward">arrow_forward</span>
            </template>
          </button>
        </form>
      </div>

      <p class="mt-lg text-center font-body-sm text-on-surface-variant">
        Already have an operator account?
        <NuxtLink class="text-secondary font-semibold hover:underline" :to="loginDestination">Sign in</NuxtLink>
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Create ISP Account — Uzanet' })

const { register } = useAuth()
const snackbar = useSnackbar()
const route = useRoute()
const loading = ref(false)
const error = ref('')
const form = reactive({ username: '', email: '', password: '', confirm: '' })

const nextPath = computed(() => {
  const next = typeof route.query.next === 'string' ? route.query.next : ''
  if (next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') && !next.startsWith('/signup')) return next
  return '/onboard'
})
const loginDestination = computed(() => ({ path: '/login', query: { next: nextPath.value } }))

async function handleSignup() {
  if (loading.value) return
  error.value = ''
  const username = form.username.trim().toLowerCase()
  if (form.password !== form.confirm) {
    error.value = 'The passwords do not match.'
    return
  }
  loading.value = true
  try {
    await register(username, form.email.trim().toLowerCase(), form.password)
    snackbar.show('ISP account created. Connect your first MikroTik.', 'success')
    await navigateTo(nextPath.value)
  } catch (err: unknown) {
    error.value = apiError(err)
  } finally {
    loading.value = false
    form.password = ''
    form.confirm = ''
  }
}
</script>

<style scoped>
.technical-grid {
  background-image:
    linear-gradient(#e2e8f0 1px, transparent 1px),
    linear-gradient(90deg, #e2e8f0 1px, transparent 1px);
  background-size: 40px 40px;
}
</style>
