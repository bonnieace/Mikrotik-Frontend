<template>
  <div class="bg-surface font-body-md text-on-surface antialiased min-h-screen flex items-center justify-center relative overflow-hidden py-10">
    <div class="absolute inset-0 technical-grid opacity-30 z-0"></div>
    <main class="relative z-10 w-full max-w-[460px] px-6">
      <div class="bg-white border border-outline-variant p-xl rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary text-on-primary rounded-xl mb-lg shadow-sm">
          <span v-if="verifying" class="material-symbols-outlined text-display animate-spin">progress_activity</span>
          <span v-else class="material-symbols-outlined text-display">mark_email_read</span>
        </div>

        <template v-if="verifying">
          <h1 class="font-display text-h1 text-primary">Verifying your email</h1>
          <p class="font-body-md text-on-surface-variant mt-sm">Activating your ISP account…</p>
        </template>

        <template v-else-if="error">
          <h1 class="font-display text-h1 text-primary">Verification failed</h1>
          <p class="font-body-md text-red-700 mt-sm" role="alert">{{ error }}</p>
          <NuxtLink
            class="mt-lg inline-flex items-center justify-center bg-primary text-on-primary py-3 px-5 rounded-md font-h3 text-h3"
            to="/signup"
          >
            Return to signup
          </NuxtLink>
        </template>

        <template v-else>
          <h1 class="font-display text-h1 text-primary">Check your email</h1>
          <p class="font-body-md text-on-surface-variant mt-sm">
            We sent a verification link<span v-if="email"> to <strong>{{ email }}</strong></span>.
          </p>
          <p class="font-body-sm text-on-surface-variant mt-md">Open the link to activate your account and continue to router onboarding.</p>

          <button
            v-if="email"
            class="mt-lg text-secondary font-semibold hover:underline disabled:opacity-60 disabled:no-underline"
            type="button"
            :disabled="resending"
            @click="resend"
          >
            {{ resending ? 'Sending…' : 'Resend verification email' }}
          </button>
          <p v-if="resendMessage" class="font-body-sm mt-sm" :class="resendError ? 'text-red-700' : 'text-on-surface-variant'" role="status">
            {{ resendMessage }}
          </p>
        </template>
      </div>

      <p class="mt-lg text-center font-body-sm text-on-surface-variant">
        <NuxtLink class="text-secondary font-semibold hover:underline" to="/login">Back to sign in</NuxtLink>
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Verify Email — Uzanet' })

const route = useRoute()
const { verifyEmail, resendVerification } = useAuth()
const snackbar = useSnackbar()

const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')
const email = computed(() => typeof route.query.email === 'string' ? route.query.email : '')
const verifying = ref(Boolean(token.value))
const error = ref('')
const resending = ref(false)
const resendMessage = ref('')
const resendError = ref(false)

const nextPath = computed(() => {
  const next = typeof route.query.next === 'string' ? route.query.next : ''
  if (
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !next.startsWith('/login') &&
    !next.startsWith('/signup') &&
    !next.startsWith('/verify-email')
  ) return next
  return '/onboard'
})

async function verify() {
  if (!token.value) return
  verifying.value = true
  error.value = ''
  try {
    await verifyEmail(token.value)
    snackbar.show('Email verified. Your ISP account is active.', 'success')
    await navigateTo(nextPath.value)
  } catch (err: unknown) {
    error.value = apiError(err)
  } finally {
    verifying.value = false
  }
}

async function resend() {
  if (!email.value || resending.value) return
  resending.value = true
  resendMessage.value = ''
  resendError.value = false
  try {
    await resendVerification(email.value)
    resendMessage.value = 'Verification email sent.'
  } catch (err: unknown) {
    resendError.value = true
    resendMessage.value = apiError(err)
  } finally {
    resending.value = false
  }
}

onMounted(verify)
</script>

<style scoped>
.technical-grid {
  background-image:
    linear-gradient(#e2e8f0 1px, transparent 1px),
    linear-gradient(90deg, #e2e8f0 1px, transparent 1px);
  background-size: 40px 40px;
}
</style>
