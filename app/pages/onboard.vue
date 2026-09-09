<script setup lang="ts">
import type { Onboarding } from '~~/shared/types'
import { dateTime } from '~/utils/format'

definePageMeta({ layout: 'app' })
useHead({ title: 'Connect Your MikroTik — Uzanet' })

const api = useApi()
const routerStore = useRouterStore()

const loading = ref(false)
const error = ref('')
const copyMessage = ref('')
const bundle = ref<Onboarding | null>(null)

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
  const url = URL.createObjectURL(new Blob([bundle.value.script], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'uzanet-' + bundle.value.router.uid + '.rsc'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function restart() {
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
  <div class="operator-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Guided onboarding</p>
        <h1>Connect your MikroTik</h1>
        <p>Generate one secure setup command, run it on RouterOS, and let Uzanet claim the router automatically.</p>
      </div>
      <NuxtLink to="/routers" class="button-link">View routers</NuxtLink>
    </div>

    <div class="metrics three">
      <MetricCard label="1 · Register" value="Router" icon="add_circle" tag="Portal" note="Name the router and customer portal." />
      <MetricCard label="2 · Install" value="1 command" icon="terminal" tag="RouterOS" note="Paste the generated command into the terminal." />
      <MetricCard label="3 · Claim" value="Automatic" icon="verified" tone="green" tag="Uzanet" note="The router phones home over the managed tunnel." />
    </div>

    <section v-if="!bundle" class="panel onboarding-panel">
      <div class="panel-heading">
        <div>
          <h2>Register your router</h2>
          <p class="muted">No public RouterOS address or existing API credentials are required for guided onboarding.</p>
        </div>
        <span class="badge">L2TP guided setup</span>
      </div>

      <p v-if="error" class="notice error" role="alert">{{ error }}</p>

      <form @submit.prevent="startOnboarding">
        <fieldset :disabled="loading" class="onboarding-fieldset">
          <div class="form-grid">
            <label class="field">
              Router name
              <input v-model.trim="form.name" required minlength="2" maxlength="125" placeholder="e.g. Westlands Core" />
            </label>
            <label class="field">
              Customer portal slug
              <input
                v-model.trim="form.portal_slug"
                required
                minlength="3"
                maxlength="60"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="e.g. westlands"
              />
            </label>
            <label class="field">
              Payment provider
              <select v-model="form.payment_provider">
                <option value="mpesa">M-Pesa</option>
                <option value="kopokopo">Kopo Kopo</option>
              </select>
            </label>
            <label class="field check-field">
              Replace an existing Uzanet-managed tunnel for this router
              <input v-model="form.replace_managed_tunnel" type="checkbox" />
            </label>
          </div>

          <div class="context-card dark onboarding-note">
            <h3>Before you start</h3>
            <p>The MikroTik needs internet access, a correct clock, and working HTTPS certificate trust. Uzanet preserves existing WAN/default-route settings and stops on managed-name conflicts instead of overwriting unrelated configuration.</p>
          </div>

          <div class="actions">
            <button class="primary" :disabled="loading">
              <span v-if="loading" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              {{ loading ? 'Generating…' : 'Generate setup command' }}
            </button>
            <NuxtLink to="/routers" class="button-link ghost-link">Use manual RouterOS API instead</NuxtLink>
          </div>
        </fieldset>
      </form>
    </section>

    <section v-else class="panel onboarding-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Setup command ready</p>
          <h2>Connect {{ bundle.router.name }}</h2>
          <p class="muted">Claim token expires {{ dateTime(bundle.expires_at) }} EAT. Treat this command like a password until the router is claimed.</p>
        </div>
        <StatusBadge :status="bundle.router.onboarding_status || 'pending'" />
      </div>

      <p v-if="!bundle.l2tp_peer.provisioned" class="notice error" role="alert">
        The control-plane L2TP peer was not provisioned automatically. Configure the peer on the Uzanet VPS before running this command.
      </p>
      <p v-else class="notice" role="status">The control-plane L2TP peer is provisioned. You can run the command now.</p>

      <div class="command-shell">
        <div class="command-shell-heading">
          <span>MikroTik terminal</span>
          <span>paste as one line</span>
        </div>
        <pre class="secret command-text">{{ bundle.install_command }}</pre>
      </div>

      <div class="actions">
        <button class="primary" :disabled="!bundle.install_command" @click="copyCommand">
          <span class="material-symbols-outlined text-[18px]">content_copy</span>
          Copy setup command
        </button>
        <button @click="downloadScript">Download fallback .rsc</button>
        <NuxtLink to="/routers" class="button-link ghost-link">Open router status</NuxtLink>
      </div>
      <p v-if="copyMessage" class="notice" role="status">{{ copyMessage }}</p>

      <div class="context-grid onboarding-context">
        <section class="context-card">
          <h3>What happens next</h3>
          <p>The script creates the managed control tunnel and scoped API user, then the router claims this record and reports its RouterOS version.</p>
        </section>
        <section class="context-card">
          <h3>Safe retry</h3>
          <p>The downloadable script remains retryable until claim or expiry. A failed import keeps the downloaded RSC on the router so you can inspect and retry it.</p>
        </section>
      </div>

      <div class="actions secondary-actions">
        <button @click="restart">Connect another router</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.onboarding-panel {
  max-width: 1040px;
}
.onboarding-fieldset {
  border: 0;
  padding: 0;
}
.onboarding-note {
  margin-top: 20px;
}
.command-shell {
  margin: 20px 0;
  border-radius: 10px;
  overflow: hidden;
  background: #0f172a;
}
.command-shell-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 14px;
  color: #cbd5e1;
  background: #020617;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.command-text {
  margin: 0;
  border-radius: 0;
  max-height: 320px;
  overflow: auto;
}
.onboarding-context {
  margin-top: 24px;
}
.secondary-actions {
  margin-top: 20px;
}
.button-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
.ghost-link {
  padding: 9px 12px;
}
</style>
