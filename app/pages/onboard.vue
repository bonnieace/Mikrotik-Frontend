<script setup lang="ts">
import { createOnboardingMonitor, onboardingExpired } from '~~/shared/onboarding-monitor'
import type { Router, Onboarding } from '~~/shared/types'
import { dateTime } from '~/utils/format'

definePageMeta({ layout: 'app' })
useHead({ title: 'Connect Your MikroTik — Uzanet' })

const api = useApi()
const routerStore = useRouterStore()

const loading = ref(false)
const error = ref('')
const copyMessage = ref('')
const bundle = ref<Onboarding | null>(null)
const statusError = ref('')
const checkingStatus = ref(false)
const expired = ref(false)
let disposed = false
const claimed = computed(() => bundle.value?.router.onboarding_status === 'claimed')

const currentStep = computed(() => (claimed.value ? 3 : bundle.value ? 2 : 1))
const steps = ['Router details', 'Connect router', 'Ready to use']

const monitor = createOnboardingMonitor<Router[]>({
  load: async (signal) => {
    checkingStatus.value = true
    return await api<Router[]>('routers', { signal })
  },
  accept: (routers) => {
    checkingStatus.value = false
    expired.value = Boolean(bundle.value && onboardingExpired(bundle.value.expires_at))
    const router = routers.find((item) => item.uid === bundle.value?.router.uid)
    if (!router || !bundle.value) {
      statusError.value = 'This router record was not found. Open router status to check it.'
      return
    }
    bundle.value.router = router
    statusError.value = ''
    if (router.onboarding_status === 'claimed') {
      // The command and script contain credentials and are no longer needed.
      bundle.value.script = ''
      bundle.value.install_command = ''
      bundle.value.l2tp_peer.password = ''
      routerStore.routers.value = routers
      routerStore.setActiveRouter(router)
    }
  },
  error: (err) => {
    checkingStatus.value = false
    statusError.value = apiError(err)
    expired.value = Boolean(bundle.value && onboardingExpired(bundle.value.expires_at))
  },
  pending: () => Boolean(bundle.value && !claimed.value && !expired.value && !document.hidden),
})

function checkStatus() {
  if (!disposed && bundle.value && !claimed.value && !document.hidden) void monitor.check()
}

function onVisibilityChange() {
  if (document.hidden) {
    monitor.stop()
    checkingStatus.value = false
  } else checkStatus()
}

onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
onUnmounted(() => {
  disposed = true
  monitor.stop()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

const form = reactive({
  name: '',
  portal_slug: '',
  payment_provider: 'mpesa',
  replace_managed_tunnel: false,
})

async function startOnboarding() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  copyMessage.value = ''
  try {
    bundle.value = await api<Onboarding>('routers/onboarding', {
      method: 'POST',
      body: {
        name: form.name,
        portal_slug: form.portal_slug,
        payment_provider: form.payment_provider,
        replace_managed_tunnel: form.replace_managed_tunnel,
      },
    })
    await routerStore.fetchRouters()
    checkStatus()
  } catch (err: unknown) {
    error.value = apiError(err)
  } finally {
    loading.value = false
  }
}

async function copyCommand() {
  const command = bundle.value?.install_command || ''
  if (!command) return
  try {
    await navigator.clipboard.writeText(command)
    copyMessage.value = 'Copied. Paste the whole command into the MikroTik terminal.'
  } catch {
    copyMessage.value = 'Copy is unavailable in this browser. Select and copy the command below.'
  }
}

function downloadScript() {
  if (!bundle.value) return
  const url = URL.createObjectURL(
    new Blob([bundle.value.script], { type: 'text/plain;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = 'uzanet-' + bundle.value.router.uid + '.rsc'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function restart() {
  monitor.stop()
  statusError.value = ''
  checkingStatus.value = false
  expired.value = false
  bundle.value = null
  error.value = ''
  copyMessage.value = ''
  form.name = ''
  form.portal_slug = ''
  form.payment_provider = 'mpesa'
  form.replace_managed_tunnel = false
}
</script>

<template>
  <div class="operator-page setup-page">
    <header class="setup-heading">
      <p class="eyebrow">Router setup</p>
      <h1>Let’s connect your MikroTik.</h1>
      <p>We’ll guide you from router details to your first connection.</p>
    </header>

    <nav class="setup-progress" aria-label="Router setup progress">
      <ol>
        <li
          v-for="(step, index) in steps"
          :key="step"
          :class="{
            current: currentStep === index + 1,
            complete: currentStep > index + 1 || claimed,
          }"
          :aria-current="currentStep === index + 1 ? 'step' : undefined"
        >
          <span class="step-number" aria-hidden="true">{{
            currentStep > index + 1 || claimed ? '✓' : index + 1
          }}</span>
          <span
            >{{ step
            }}<span class="sr-only">{{
              currentStep > index + 1 || claimed
                ? ', complete'
                : currentStep === index + 1
                  ? ', current step'
                  : ', upcoming'
            }}</span></span
          >
        </li>
      </ol>
    </nav>

    <section v-if="!bundle" class="setup-panel" aria-labelledby="details-heading">
      <p class="eyebrow">Step 1 of 3</p>
      <h2 id="details-heading">Tell us about your router</h2>
      <p class="setup-intro">
        Give it a name you’ll recognise. We’ll prepare the command you need to connect it.
      </p>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>
      <form @submit.prevent="startOnboarding">
        <fieldset :disabled="loading" class="onboarding-fieldset">
          <div class="setup-fields">
            <label class="field" for="router-name"
              >Router name
              <input
                id="router-name"
                v-model.trim="form.name"
                required
                minlength="2"
                maxlength="125"
                placeholder="e.g. Westlands Core"
                autocomplete="off"
              />
            </label>
            <label class="field" for="portal-slug"
              >Customer portal link
              <input
                id="portal-slug"
                v-model.trim="form.portal_slug"
                required
                minlength="3"
                maxlength="60"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="e.g. westlands"
                aria-describedby="portal-help"
                autocomplete="off"
                autocapitalize="none"
                spellcheck="false"
              />
              <span id="portal-help" class="field-help"
                >Choose a short name for this router’s customer page. Use lowercase letters, numbers
                and hyphens.</span
              >
            </label>
            <label class="field" for="provider"
              >Payment provider
              <select id="provider" v-model="form.payment_provider">
                <option value="mpesa">M-Pesa</option>
                <option value="kopokopo">Kopo Kopo</option>
              </select>
            </label>
            <label class="field check-field replacement-choice">
              <input v-model="form.replace_managed_tunnel" type="checkbox" />
              <span
                >Replace an existing Uzanet-managed tunnel for this router<span class="field-help"
                  >Select this if this MikroTik was connected to an earlier Uzanet router record.
                  Its previous Uzanet connection will be replaced.</span
                ></span
              >
            </label>
          </div>
          <aside class="setup-tip">
            <strong>Before you continue</strong>
            <p>
              Keep the MikroTik online and have WinBox ready. Your router’s clock and HTTPS
              certificates must be working.
            </p>
          </aside>
          <button class="primary setup-primary" :disabled="loading" type="submit">
            {{ loading ? 'Preparing your command…' : 'Generate setup command' }}
            <span aria-hidden="true">→</span>
          </button>
        </fieldset>
      </form>
      <details class="setup-details">
        <summary>Prefer manual setup?</summary>
        <p><NuxtLink to="/routers">Use manual RouterOS API instead →</NuxtLink></p>
      </details>
    </section>

    <section v-else-if="claimed" class="setup-panel setup-success" aria-live="polite">
      <span class="success-symbol" aria-hidden="true">✓</span>
      <p class="eyebrow">Step 3 of 3 · Setup complete</p>
      <h2>Router connected successfully</h2>
      <p role="status">
        <strong>{{ bundle.router.name }}</strong> has completed setup and checked in with Uzanet.
      </p>
      <p class="setup-intro">Your router is selected and ready to manage.</p>
      <NuxtLink to="/dashboard" class="setup-primary button-link"
        >Continue to dashboard <span aria-hidden="true">→</span></NuxtLink
      >
      <div class="setup-secondary">
        <NuxtLink to="/routers">View routers</NuxtLink
        ><button class="ghost" @click="restart">Connect another router</button>
      </div>
    </section>

    <section v-else class="setup-panel" aria-labelledby="install-heading">
      <p class="eyebrow">Step 2 of 3</p>
      <h2 id="install-heading">Connect {{ bundle.router.name }}</h2>
      <p class="setup-intro">
        Run this command on your MikroTik. Keep this page open—we’ll confirm when setup is complete.
      </p>
      <p v-if="!bundle.l2tp_peer.provisioned" class="notice error" role="alert">
        Uzanet could not prepare the management connection automatically. An administrator needs to
        configure the L2TP peer on the Uzanet VPS before you run the command.
      </p>
      <template v-if="!expired">
        <ol class="install-instructions">
          <li>Open <strong>WinBox</strong> and connect to this MikroTik.</li>
          <li>Open <strong>New Terminal</strong>.</li>
          <li>Paste the whole command below and press <strong>Enter</strong>.</li>
        </ol>
        <div class="command-shell">
          <div class="command-shell-heading">Your setup command · paste as one line</div>
          <pre class="secret command-text" tabindex="0" aria-label="MikroTik setup command">{{
            bundle.install_command
          }}</pre>
        </div>
        <button
          class="primary setup-primary"
          :disabled="!bundle.install_command || !bundle.l2tp_peer.provisioned"
          @click="copyCommand"
        >
          <span class="material-symbols-outlined" aria-hidden="true">content_copy</span>Copy setup
          command
        </button>
        <p v-if="copyMessage" class="notice" role="status">{{ copyMessage }}</p>
        <p class="command-expiry">
          Keep this command private. It expires {{ dateTime(bundle.expires_at) }} EAT.
        </p>
      </template>
      <div class="setup-waiting" aria-live="polite">
        <p v-if="statusError" role="status">
          <strong>We couldn’t check your router yet.</strong
          ><span>{{ statusError }} You can check again below.</span>
        </p>
        <p v-else-if="expired" role="status">
          <strong>This setup command has expired.</strong
          ><span>Check the router’s status before starting another setup.</span>
        </p>
        <p v-else role="status">
          <strong>Waiting for your router…</strong
          ><span
            >After you run the command, we’ll check automatically and show your confirmation
            here.</span
          >
        </p>
        <button :disabled="checkingStatus" @click="checkStatus">
          {{ checkingStatus ? 'Checking…' : 'Check status now' }}
        </button>
      </div>
      <details class="setup-details">
        <summary>Need help connecting?</summary>
        <p>
          If setup stops in WinBox, read the terminal’s error before retrying. For an “existing
          tunnel belongs to another router record” error, the replacement option must be enabled
          when preparing setup.
        </p>
        <p>
          If the command import fails, the downloaded script stays on the router for inspection.
          Retry it only before it expires and before the router completes setup.
        </p>
        <button :disabled="expired || !bundle.l2tp_peer.provisioned" @click="downloadScript">
          Download fallback .rsc
        </button>
      </details>
      <div class="setup-secondary">
        <NuxtLink to="/routers">Open router status →</NuxtLink
        ><button class="ghost" @click="restart">Set up a different router</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.setup-page {
  max-width: 900px;
  margin: 0 auto;
  color: #101b34;
}
.setup-heading {
  margin: 0 0 28px;
}
.setup-heading h1 {
  font-size: clamp(24px, 3vw, 32px);
  line-height: 1.2;
  letter-spacing: -0.035em;
  margin: 8px 0 12px;
}
.setup-heading > p:last-child,
.setup-intro {
  color: #526079;
  line-height: 1.6;
  font-size: 14px;
}
.setup-progress {
  margin-bottom: 28px;
}
.setup-progress ol {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}
.setup-progress li {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #526079;
  font-size: 13px;
  position: relative;
}
.step-number {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #cbd5e1;
  background: #f5f8ff;
  font-weight: 600;
}
.setup-progress li.current {
  color: #2563eb;
  font-weight: 600;
}
.current .step-number {
  color: white;
  background: #2563eb;
  border-color: #2563eb;
}
.complete .step-number {
  color: #2563eb;
  border-color: #2563eb;
  background: #edf3ff;
}
.setup-progress li:not(:last-child)::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #dce4f2;
  margin: 0 14px 0 4px;
}
.setup-panel {
  padding: clamp(24px, 4vw, 40px);
  background: white;
  border: 1px solid #dce4f2;
  border-radius: 12px;
  min-width: 0;
}
.setup-panel > h2 {
  font-size: clamp(23px, 3vw, 28px);
  line-height: 1.25;
  letter-spacing: -0.025em;
  margin: 8px 0 12px;
  overflow-wrap: anywhere;
}
.setup-page .eyebrow {
  color: #2563eb;
  font-size: 11px;
  letter-spacing: 0.08em;
}
.onboarding-fieldset {
  border: 0;
  padding: 0;
  margin: 24px 0 0;
}
.setup-fields {
  display: grid;
  gap: 20px;
}
.setup-page .field {
  font-size: 14px;
}
.setup-page input,
.setup-page select {
  min-height: 46px;
  font-size: 16px !important;
  border-radius: 6px;
}
.field-help {
  display: block;
  color: #526079;
  font-weight: 400;
  font-size: 12px;
  line-height: 1.6;
}
.replacement-choice {
  align-items: flex-start !important;
  padding-top: 4px;
}
.replacement-choice input {
  min-height: 0;
  flex-shrink: 0;
  margin: 3px 0 0;
}
.replacement-choice .field-help {
  margin-top: 5px;
}
.setup-tip {
  background: #f5f8ff;
  border-left: 3px solid #2563eb;
  padding: 16px 20px;
  margin: 24px 0;
  font-size: 13px;
}
.setup-tip p {
  margin: 6px 0 0;
  line-height: 1.6;
  color: #526079;
}
.setup-page button.setup-primary,
.setup-page a.setup-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 12px 22px;
  background: #2563eb;
  border: 1px solid #2563eb;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}
.setup-page button.setup-primary:hover,
.setup-page a.setup-primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}
.setup-secondary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 24px;
  font-size: 13px;
}
.setup-secondary a,
.setup-details a {
  color: #2563eb;
}
.setup-secondary a {
  padding: 10px 0;
}
.setup-details {
  border-top: 1px solid #e4eaf5;
  padding-top: 20px;
  margin-top: 24px;
  font-size: 13px;
  color: #526079;
  line-height: 1.7;
}
.setup-details summary {
  cursor: pointer;
  color: #101b34;
  padding: 4px 0;
  font-weight: 500;
}
.install-instructions {
  padding-left: 22px;
  font-size: 14px;
  line-height: 1.7;
  margin: 24px 0;
}
.install-instructions li {
  padding: 4px 0 4px 5px;
}
.command-shell {
  min-width: 0;
  max-width: 100%;
  margin: 20px 0;
  border-radius: 8px;
  overflow: hidden;
  background: #101b34;
}
.command-shell-heading {
  font-size: 11px;
  color: #c1cee4;
  padding: 12px 16px;
  border-bottom: 1px solid #ffffff20;
}
.command-text {
  padding: 16px;
  margin: 0;
  white-space: pre;
  overflow: auto;
  max-height: 180px;
  font-size: 12px;
  color: white;
}
.command-expiry {
  font-size: 12px;
  color: #526079;
  line-height: 1.6;
}
.setup-waiting {
  border: 1px solid #dce4f2;
  border-left: 3px solid #2563eb;
  padding: 16px 20px;
  border-radius: 6px;
  margin-top: 24px;
}
.setup-waiting p {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.setup-waiting span {
  display: block;
  color: #526079;
  font-size: 13px;
  margin-top: 6px;
}
.setup-success {
  text-align: center;
}
.setup-success .setup-secondary {
  justify-content: center;
}
.setup-success > p {
  line-height: 1.6;
}
.success-symbol {
  display: grid;
  place-items: center;
  margin: 0 auto 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #edf3ff;
  color: #2563eb;
  font-size: 30px;
}
@media (max-width: 640px) {
  .setup-page {
    padding: 24px 16px;
  }
  .setup-heading {
    margin-bottom: 24px;
  }
  .setup-panel {
    padding: 24px 20px;
  }
  .setup-progress li {
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
    font-size: 11px;
  }
  .setup-progress li:not(:last-child)::after {
    position: absolute;
    top: 16px;
    left: calc(50% + 23px);
    width: calc(100% - 46px);
    margin: 0;
  }
  .setup-page button.setup-primary,
  .setup-page a.setup-primary {
    width: 100%;
  }
  .setup-secondary {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    text-align: center;
  }
  .setup-waiting {
    padding: 16px;
  }
}
</style>
