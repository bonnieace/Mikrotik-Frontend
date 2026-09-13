<!-- Restores the pre-readiness RoutersPage hardware table and focused editor. -->
<template>
  <div class="operator-page">
    <div class="page-heading">
      <div>
        <h1>Routers &amp; Configuration</h1>
        <p>Manage your infrastructure, connectivity and customer portals.</p>
      </div>
      <div class="actions heading-actions">
        <button :disabled="loading || busy" @click="fetchRouters">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span
          >Refresh routers</button
        ><button class="primary" :disabled="busy" @click="openCreate">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>Add
          Router
        </button>
      </div>
    </div>
    <p v-if="opError && !formOpen" class="notice error" role="alert">
      {{ opError }}
    </p>
    <p v-if="message" class="notice" role="status">{{ message }}</p>
    <div class="metrics three">
      <MetricCard
        label="Registered Routers"
        :value="error ? null : routers.length"
        icon="router"
        tag="Infrastructure"
        :loading="loading"
        note="Routers in your account"
      /><MetricCard
        label="Customer Portals"
        :value="error ? null : routers.filter((r) => r.portal_enabled).length"
        icon="language"
        tone="green"
        tag="Enabled"
        :loading="loading"
        note="Portals enabled for customers"
      /><MetricCard
        label="L2TP Routers"
        :value="error ? null : routers.filter((r) => r.connection_mode === 'l2tp').length"
        icon="vpn_lock"
        tone="purple"
        tag="Connection"
        :loading="loading"
        note="Routers configured to use L2TP"
      />
    </div>
    <section class="panel table-panel">
      <div class="panel-heading">
        <div>
          <h2>Connected Hardware</h2>
          <p class="muted">Select a router to manage its customers, plans and billing. Use the sync action after captive portal design or branding changes.</p>
        </div>
        <span class="badge">{{ routers.length }} routers</span>
      </div>
      <ResourceState
        :loading="loading"
        :error="error"
        :selected="true"
        label="routers"
        @retry="fetchRouters"
      >
        <RecordTable
          :rows="routers"
          :columns="[
            { key: 'name', label: 'Router Name' },
            { key: 'ip_address', label: 'Address / Port' },
            { key: 'portal_slug', label: 'Customer Portal' },
            { key: 'payment_provider', label: 'Provider' },
            { key: 'onboarding_status', label: 'Onboarding' },
            { key: 'last_seen_at', label: 'Last Seen · EAT' },
          ]"
          row-key="uid"
          caption="Managed routers"
          placeholder="Search routers, addresses or portals…"
          record-label="routers"
          empty-title="Connect your first router"
          empty-description="Choose Add Router to register reachable hardware or start guided L2TP onboarding."
        >
          <template #name="{ row }"
            ><div class="cell-identity">
              <span class="cell-icon"
                ><span class="material-symbols-outlined" aria-hidden="true">router</span></span
              >
              <div>
                <strong>{{ row.name }}</strong
                ><small>{{
                  activeRouter?.uid === row.uid ? 'Selected router' : row.connection_mode
                }}</small>
              </div>
            </div></template
          >
          <template #ip_address="{ row }"
            ><code
              >{{ row.ip_address || 'Awaiting connection'
              }}{{ row.ip_address ? ':' + row.port : '' }}</code
            ></template
          >
          <template #portal_slug="{ row }"
            ><div class="cell-identity">
              <div>
                <strong>{{
                  row.isp_identifier
                    ? row.isp_identifier + '/' + row.portal_slug
                    : row.portal_slug
                }}</strong
                ><small>{{ row.portal_enabled ? 'Portal enabled' : 'Portal disabled' }}</small>
              </div>
            </div></template
          >
          <template #payment_provider="{ row }"
            ><span class="badge">{{
              row.payment_provider === 'mpesa'
                ? 'M-Pesa'
                : row.payment_provider === 'kopokopo'
                  ? 'Kopo Kopo'
                  : row.payment_provider
            }}</span></template
          >
          <template #onboarding_status="{ row }"
            ><StatusBadge :status="row.onboarding_status || 'unknown'"
          /></template>
          <template #last_seen_at="{ row }"
            ><span class="mono">{{ dateTime(row.last_seen_at) }}</span></template
          >
          <template #actions="{ row }"
            ><button
              :disabled="busy || activeRouter?.uid === row.uid"
              @click="setActiveRouter(row)"
            >
              {{ activeRouter?.uid === row.uid ? 'Selected' : 'Select' }}</button
            ><button
              class="ghost"
              :disabled="busy"
              :title="'Check ' + row.name + ' connection'"
              :aria-label="'Check ' + row.name + ' connection'"
              @click="check(row)"
            >
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
                >lan</span
              ></button
            ><button
              class="ghost"
              :disabled="busy || !row.portal_enabled"
              :aria-label="'Refresh ' + row.name + ' captive portal'"
              :title="row.portal_enabled ? 'Refresh managed captive portal' : 'Enable the customer portal before refreshing'"
              @click="refreshPortal(row)"
            >
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
                >sync</span
              ></button
            ><button
              class="ghost"
              :disabled="busy"
              :aria-label="'Edit ' + row.name"
              :title="'Edit ' + row.name"
              @click="edit(row)"
            >
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true"
                >edit</span
              ></button
            ><a
              v-if="row.portal_enabled"
              class="router-portal-link"
              :href="row.portal_path || '/portal/' + row.portal_slug"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="'Open ' + row.name + ' customer portal'"
              title="Open customer portal"
              ><span class="material-symbols-outlined text-[18px]" aria-hidden="true"
                >open_in_new</span
              ></a
            ><button
              class="danger ghost"
              :disabled="busy"
              :aria-label="'Delete ' + row.name"
              :title="'Delete ' + row.name"
              @click="remove(row)"
            >
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
            </button></template
          >
        </RecordTable>
      </ResourceState>
    </section>
    <p v-if="statusMessage" class="notice" role="status">{{ statusMessage }}</p>
    <div class="context-grid">
      <section class="context-card dark">
        <h2>Connect Your Network</h2>
        <p>
          Use guided L2TP onboarding to generate a one-time setup script, or register an existing
          reachable RouterOS API.
        </p>
        <button class="action" style="margin-top: 16px" :disabled="busy" @click="openCreate">
          Add a router<span class="material-symbols-outlined text-[16px]" aria-hidden="true"
            >arrow_forward</span
          >
        </button>
      </section>
      <section class="context-card">
        <h2>Check connectivity</h2>
        <p>
          Use the connection icon on a router to check its current status. Last seen and onboarding
          state describe recorded activity.
        </p>
      </section>
    </div>
    <AppDrawer
      :open="formOpen"
      :title="editing ? 'Edit Router' : 'Add Router'"
      :busy="busy"
      @close="closeForm"
      ><p v-if="opError" class="notice error" role="alert">{{ opError }}</p>
      <form @submit.prevent="save">
        <fieldset :disabled="busy" style="border: 0; padding: 0">
          <label v-if="!editing" class="field" style="max-width: 420px; margin-bottom: 16px"
            >Connection method<select v-model="mode">
              <option value="onboarding">Guided L2TP onboarding</option>
              <option value="manual">Existing reachable RouterOS API</option>
            </select></label
          >
          <div class="form-grid">
            <label class="field"
              >Router name<input v-model.trim="form.name" required minlength="2" maxlength="125"
            /></label>
            <label class="field"
              >Customer portal slug<input
                v-model.trim="form.portal_slug"
                required
                minlength="3"
                maxlength="60"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="e.g. westlands"
            /></label>
            <label class="field"
              >Payment provider<select v-model="form.payment_provider">
                <option value="mpesa">M-Pesa</option>
                <option value="kopokopo">Kopo Kopo</option>
              </select></label
            >
            <label v-if="mode === 'onboarding' && !editing" class="field check-field">
              Replace an existing UzaNet-managed tunnel (disconnects its previous UzaNet record)
              <input v-model="replaceManagedTunnel" type="checkbox" />
            </label>
            <template v-if="mode === 'manual' || editing">
              <label class="field"
                >Router address<input
                  v-model.trim="form.ip_address"
                  required
                  maxlength="255"
                  placeholder="Private VPN IP or reachable hostname"
              /></label>
              <label class="field"
                >API port<input
                  v-model.number="form.port"
                  type="number"
                  min="1"
                  max="65535"
                  step="1"
                  required
              /></label>
              <label class="field"
                >API username<input
                  v-model.trim="form.username"
                  required
                  maxlength="125"
                  autocomplete="off"
              /></label>
              <label class="field"
                >{{ editing ? 'New API password (blank keeps current)' : 'API password'
                }}<input
                  v-model="form.password"
                  type="password"
                  :required="!editing"
                  minlength="8"
                  maxlength="256"
                  autocomplete="new-password"
              /></label>
              <label class="field check-field"
                >Customer portal enabled<input v-model="form.portal_enabled" type="checkbox"
              /></label>
            </template>
          </div>
          <p class="muted">
            Provider credentials and callbacks must be configured in the backend. Selecting a
            provider here does not configure or test it.
          </p>
          <div class="actions">
            <button class="primary" :disabled="busy">
              {{
                busy
                  ? 'Working…'
                  : editing
                    ? 'Save changes'
                    : mode === 'onboarding'
                      ? 'Generate setup command'
                      : 'Register router'
              }}</button
            ><button type="button" @click="closeForm">Cancel</button>
          </div>
        </fieldset>
      </form></AppDrawer
    >
    <AppDrawer
      :open="!!bundle"
      :title="'Connect ' + (bundle?.router.name || 'router')"
      eyebrow="Router onboarding / Setup script"
      @close="dismissBundle"
      ><template v-if="bundle">
        <p class="notice">
          Contains credentials and a one-time claim token. Download and store privately. Claim
          expires {{ dateTime(bundle.expires_at) }} EAT.
        </p>
        <p>
          {{
            bundle.l2tp_peer.provisioned
              ? 'The VPS agent provisioned the L2TP account.'
              : 'The L2TP account was NOT provisioned automatically. Configure the peer on the VPS before running the script.'
          }}
        </p>
        <template v-if="bundle.install_command">
          <p>
            Paste the whole command into the router terminal. It downloads over HTTPS, imports the
            script and removes the downloaded file after a successful import.
          </p>
          <pre class="secret" aria-label="Router setup command">{{ bundle.install_command }}</pre>
          <button class="primary" @click="copyCommand">Copy setup command</button>
          <p role="status">{{ copyMessage }}</p>
          <p class="muted">
            The RSC download remains retryable until the router claims onboarding or the token
            expires. The router needs a correct clock and trusted HTTPS certificates.
          </p>
        </template>
        <p class="muted">
          When an enabled HotSpot exists, the script keeps the current HTML directory, creates a
          managed copy and installs the ISP-qualified Uzanet redirect there. If that optional step
          cannot be completed, the existing HotSpot portal stays active and control-plane onboarding
          continues.
        </p>
        <pre v-if="showScript" class="secret">{{ bundle.script }}</pre>
        <pre v-if="showScript && !bundle.l2tp_peer.provisioned" class="secret">
L2TP user: {{ bundle.l2tp_peer.username }}
L2TP password: {{ bundle.l2tp_peer.password }}
Assigned IP: {{ bundle.l2tp_peer.ip_address }}</pre
        >
        <div class="actions">
          <button class="primary" @click="download">Download fallback .rsc</button
          ><button @click="showScript = !showScript">
            {{ showScript ? 'Hide' : 'Reveal' }} script</button
          ><button @click="dismissBundle">Dismiss credentials</button>
        </div>
      </template></AppDrawer
    >
  </div>
</template>
<script setup lang="ts">
import type { Router, Onboarding } from '~~/shared/types'
import { dateTime } from '~/utils/format'
const api = useApi()
const { routers, activeRouter, loading, error, fetchRouters, setActiveRouter } = useRouterStore()
const { busy, error: opError, message, run } = useOperation()
const mode = ref('onboarding'),
  editing = ref(''),
  statusMessage = ref(''),
  showScript = ref(false)
const formOpen = ref(false)
const replaceManagedTunnel = ref(false)
const copyMessage = ref('')
async function copyCommand() {
  try {
    await navigator.clipboard.writeText(bundle.value?.install_command || '')
    copyMessage.value = 'Copied. Paste the whole command into the router terminal.'
  } catch {
    copyMessage.value = 'Copy unavailable. Select and copy the command below.'
  }
}
function closeForm() {
  formOpen.value = false
  reset()
}
function openCreate() {
  reset()
  opError.value = ''
  message.value = ''
  mode.value = 'onboarding'
  formOpen.value = true
}
const bundle = ref<Onboarding | null>(null)
const blank = () => ({
  name: '',
  portal_slug: '',
  payment_provider: 'mpesa',
  ip_address: '',
  port: 8728,
  username: '',
  password: '',
  portal_enabled: true,
})
const form = reactive(blank())
function reset() {
  editing.value = ''
  replaceManagedTunnel.value = false
  Object.assign(form, blank())
}
function dismissBundle() {
  copyMessage.value = ''
  bundle.value = null
  showScript.value = false
}
watch(
  () => activeRouter.value?.uid,
  () => {
    closeForm()
    dismissBundle()
    statusMessage.value = ''
  },
)
function edit(router: Router) {
  opError.value = ''
  editing.value = router.uid
  Object.assign(form, {
    name: router.name,
    portal_slug: router.portal_slug,
    payment_provider: router.payment_provider,
    ip_address: router.ip_address,
    port: router.port,
    username: router.username,
    password: '',
    portal_enabled: router.portal_enabled,
  })
  formOpen.value = true
}
async function save() {
  if (!editing.value && mode.value === 'onboarding') {
    if (
      bundle.value &&
      !window.confirm(
        'Replace the displayed onboarding bundle? Save its script first; its credentials cannot be retrieved again.',
      )
    )
      return
    await run(
      () =>
        api<Onboarding>('routers/onboarding', {
          method: 'POST',
          body: {
            name: form.name,
            portal_slug: form.portal_slug,
            payment_provider: form.payment_provider,
            replace_managed_tunnel: replaceManagedTunnel.value,
          },
        }),
      async (result) => {
        closeForm()
        await fetchRouters()
        await nextTick()
        bundle.value = result
      },
      'Onboarding bundle created. Run the script to complete the connection.',
    )
  } else {
    const { password, ...rest } = form
    await run(
      () =>
        api('routers' + (editing.value ? '/' + editing.value : ''), {
          method: editing.value ? 'PATCH' : 'POST',
          body: { ...rest, ...(password ? { password } : {}) },
        }),
      async () => {
        closeForm()
        await fetchRouters()
      },
    )
  }
}
async function remove(router: Router) {
  if (
    !window.confirm(
      'Delete ' +
        router.name +
        '? This may remove linked records and revoke its managed VPN peer. Back up and review dependencies first.',
    )
  )
    return
  await run(
    () => api('routers/' + router.uid, { method: 'DELETE' }),
    async () => {
      closeForm()
      await fetchRouters()
    },
    'Router removed.',
  )
}
async function refreshPortal(router: Router) {
  if (
    !window.confirm(
      'Refresh the Uzanet-managed captive portal on ' +
        router.name +
        '? This replaces only its managed login.html and keeps the backup and RouterOS configuration untouched.',
    )
  )
    return
  statusMessage.value = ''
  await run(
    () =>
      api<{ files_updated: number; template_version: number }>(
        'routers/' + router.uid + '/portal/refresh',
        { method: 'POST' },
      ),
    (result) => {
      statusMessage.value =
        router.name +
        ': captive portal template v' +
        result.template_version +
        ' refreshed on ' +
        result.files_updated +
        ' managed page' +
        (result.files_updated === 1 ? '' : 's') +
        '.'
    },
    'Captive portal refreshed.',
  )
}
async function check(router: Router) {
  statusMessage.value = ''
  await run(
    () => api<{ status: string; version?: string }>('routers/' + router.uid + '/status'),
    (result) => {
      statusMessage.value =
        router.name + ': ' + result.status + (result.version ? ' · RouterOS ' + result.version : '')
    },
    'Connection check completed.',
  )
}
function download() {
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
</script>

<style scoped>
.router-portal-link {
  display: inline-flex;
  padding: 6px;
  color: #64748b;
  border-radius: 4px;
}
.router-portal-link:hover {
  background: #f1f5f9;
  color: #2563eb;
}
</style>