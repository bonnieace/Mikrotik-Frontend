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
        <h1 class="font-display text-display text-primary tracking-tighter">CoreNet ISP</h1>
        <p class="font-body-md text-on-surface-variant mt-xs">Infrastructure Management Console</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white border border-outline-variant p-xl rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <form class="space-y-lg" @submit.prevent="handleLogin">

          <!-- Field: Identifier -->
          <div class="space-y-xs">
            <label class="font-table-header text-table-header text-outline block uppercase tracking-wider" for="admin-id">Admin Email or ID</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="material-symbols-outlined text-outline group-focus-within:text-secondary transition-colors" data-icon="account_circle">account_circle</span>
              </div>
              <input
                id="admin-id"
                v-model="form.identifier"
                class="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none"
                name="admin-id"
                placeholder="admin@corenet.isp"
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
                placeholder="••••••••"
                required
              />
              <button
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors"
                type="button"
                @click="showPassword = !showPassword"
              >
                <span class="material-symbols-outlined text-body-lg" data-icon="visibility">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Utilities -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="form.rememberMe"
                class="h-4 w-4 text-secondary focus:ring-secondary border-outline-variant rounded-sm transition-all"
                name="remember-me"
                type="checkbox"
              />
              <label class="ml-2 block font-body-sm text-on-surface-variant cursor-pointer" for="remember-me">Remember device</label>
            </div>
            <div class="text-body-sm">
              <a class="font-medium text-secondary hover:text-on-secondary-fixed-variant transition-colors" href="#">Forgot password?</a>
            </div>
          </div>

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

      <!-- Footer Actions -->
      <div class="mt-lg text-center space-y-md">
        <p class="font-body-sm text-on-surface-variant">
          New network administrator?
          <a class="font-semibold text-primary hover:underline underline-offset-4" href="#">Request access credentials</a>
        </p>
        <div class="flex items-center justify-center gap-xl opacity-60 grayscale hover:opacity-100 transition-opacity">
          <div class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-body-sm" data-icon="verified_user">verified_user</span>
            <span class="font-mono-label text-mono-label">SECURE AES-256</span>
          </div>
          <div class="flex items-center gap-xs">
            <span class="material-symbols-outlined text-body-sm" data-icon="dns">dns</span>
            <span class="font-mono-label text-mono-label">NODE 04-DX</span>
          </div>
        </div>
      </div>

    </main>

    <!-- Decorative Illustration Segment -->
    <div class="hidden lg:block absolute bottom-12 right-12 w-64 h-64 overflow-hidden rounded-xl border border-outline-variant/30">
      <img
        alt="Network Infrastructure"
        class="w-full h-full object-cover opacity-80"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAG34MaW2lj_34OopbIUFsMbZehV9ZyJcqiBys57jbA4A77RkWy03d5dsP0p4WiZGDd4zjag2ucETSj_JHTd7Y9FBtao3o2H3uqioFhGiAxC9Ll2qgRFsS10t9L1m6p3KvYZPO14nWAR37fzLX-lsPVAIMTgVmcYDEQc7CLKcF45FFnv9VBgTWmBuIexiLIPv7wM0m_iFR_F6zSnOIxPNLfpVpdyVuxZfFIGgbqLhg2wBkGLk7g_9XjwzSlUaO0MyRfrF11J_D65RFX"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
const { login } = useAuth()
const snackbar = useSnackbar()

const showPassword = ref(false)
const loading = ref(false)

const form = reactive({
  identifier: '',
  password: '',
  rememberMe: false,
})

async function handleLogin() {
  loading.value = true
  try {
    await login(form.identifier, form.password)
    snackbar.show('Authenticated successfully', 'success')
    await navigateTo('/dashboard')
  } catch (err: unknown) {
    const fetchError = err as { data?: { detail?: string }; message?: string }
    const message =
      fetchError?.data?.detail ??
      fetchError?.message ??
      'Authentication failed. Please check your credentials.'
    snackbar.show(message, 'error')
  } finally {
    loading.value = false
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
