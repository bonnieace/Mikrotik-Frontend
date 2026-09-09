<!--
  AdminLoginPage.vue — 1:1 from Stitch export "Admin Login"
  Source: projects/13247784430269981727/screens/dd157b619c504293beb0bfe2580534e7
  DO NOT redesign. Pixel-perfect match required.
-->
<template>
  <!-- body: bg-surface font-body-md text-on-surface antialiased min-h-screen flex items-center justify-center relative overflow-hidden -->
  <div class="bg-surface font-body-md text-on-surface antialiased min-h-screen flex items-center justify-center relative overflow-hidden">

    <!-- Technical Background -->
    <div class="absolute inset-0 technical-grid opacity-30 z-0"></div>
    <div class="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-secondary-fixed-dim/20 rounded-full blur-3xl z-0"></div>
    <div class="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary-fixed/20 rounded-full blur-3xl z-0"></div>

    <!-- Login Shell -->
    <main class="relative z-10 w-full max-w-[420px] px-6">

      <!-- Brand Header -->
      <div class="text-center mb-xl">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary text-on-primary rounded-xl mb-md shadow-sm">
          <span class="material-symbols-outlined text-display" data-icon="router">router</span>
        </div>
        <h1 class="font-display text-display text-primary tracking-tighter">Uzanet</h1>
        <p class="font-body-md text-on-surface-variant mt-xs">Infrastructure Management Console</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white border border-outline-variant p-xl rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <form class="space-y-lg" @submit.prevent="handleLogin">

          <!-- Field: Identifier -->
          <div class="space-y-xs">
            <label class="font-table-header text-table-header text-outline block uppercase tracking-wider" for="admin-id">Operator username</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="material-symbols-outlined text-outline group-focus-within:text-secondary transition-colors" data-icon="account_circle">account_circle</span>
              </div>
              <input
                id="admin-id"
                v-model="form.identifier"
                class="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none"
                name="admin-id"
                placeholder="Your username"
                autocomplete="username"
                required
                type="text"
              />
            </div>
          </div>

          <!-- Field: Password -->
          <div class="space-y-xs">
            <div class="flex justify-between items-center">
              <label class="font-table-header text-table-header text-outline block uppercase tracking-wider" for="admin-password">Secure Password</label>
            </div>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="material-symbols-outlined text-outline group-focus-within:text-secondary transition-colors" data-icon="lock">lock</span>
              </div>
              <input
                id="admin-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full pl-10 pr-10 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none"
                name="admin-password"
                autocomplete="current-password"
                placeholder="••••••••"
                required
              />
              <button
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors"
                type="button"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <span class="material-symbols-outlined text-body-lg" data-icon="visibility">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <p class="font-body-sm text-on-surface-variant">For access or a password reset, contact your system administrator.</p>
          <p v-if="error" class="text-red-700 text-sm" role="alert">{{ error }}</p>

          <!-- Action -->
          <button
            :disabled="loading"
            class="w-full bg-primary text-on-primary py-3 px-4 rounded-md font-h3 text-h3 hover:bg-on-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            type="submit"
          >
            <span v-if="loading" class="material-symbols-outlined text-body-lg animate-spin">progress_activity</span>
            <template v-else>
              Authenticate Session
              <span class="material-symbols-outlined text-body-lg" data-icon="arrow_forward">arrow_forward</span>
            </template>
          </button>

        </form>
      </div>

      <p class="mt-lg text-center font-body-sm text-on-surface-variant">Uzanet · Authorized operators only</p>
    </main>
  </div>
</template>

<script setup lang="ts">
const { login } = useAuth()
const snackbar = useSnackbar()
const route = useRoute()

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const form = reactive({
  identifier: '',
  password: '',
})

function destinationAfterLogin() {
  const next = typeof route.query.next === 'string' ? route.query.next : ''
  if (next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login')) return next
  return '/dashboard'
}

async function handleLogin() {
  if (loading.value) return
  error.value = ''
  loading.value = true
  try {
    await login(form.identifier, form.password)
    snackbar.show('Authenticated successfully', 'success')
    await navigateTo(destinationAfterLogin())
  } catch (err: unknown) {
    error.value = apiError(err)
  } finally {
    loading.value = false
    form.password = ''
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
