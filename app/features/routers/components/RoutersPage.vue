<template>
  <div class="operator-page">
    <div class="page-heading"><div><h1>Infrastructure</h1><p>Connect and manage your MikroTik routers.</p></div><button :disabled="loading || busy" @click="fetchRouters">Refresh routers</button></div>
    <p v-if="opError" class="notice error" role="alert">{{ opError }}</p><p v-if="message" class="notice" role="status">{{ message }}</p>
    <section v-if="bundle" class="panel">
      <h2>Onboarding script · {{ bundle.router.name }}</h2>
      <p class="notice">Contains credentials and a one-time claim token. Download and store privately. Claim expires {{ dateTime(bundle.expires_at) }} EAT.</p>
      <p>{{ bundle.l2tp_peer.provisioned ? 'The VPS agent provisioned the L2TP account.' : 'The L2TP account was NOT provisioned automatically. Configure the peer on the VPS before running the script.' }}</p>
      <p class="muted">Review the script and back up your router. Run it in the intended router's RouterOS terminal, then select that router and check its connection. Generating a script alone does not connect the router.</p>
      <pre v-if="showScript" class="secret">{{ bundle.script }}</pre>
      <pre v-if="showScript && !bundle.l2tp_peer.provisioned" class="secret">L2TP user: {{ bundle.l2tp_peer.username }}
L2TP password: {{ bundle.l2tp_peer.password }}
Assigned IP: {{ bundle.l2tp_peer.ip_address }}</pre>
      <div class="actions"><button class="primary" @click="download">Download .rsc script</button><button @click="showScript = !showScript">{{ showScript ? 'Hide' : 'Reveal' }} script</button><button @click="dismissBundle">Dismiss credentials</button></div>
    </section>
    <form class="panel" @submit.prevent="save">
      <h2>{{ editing ? 'Edit router' : 'Add a router' }}</h2>
      <fieldset :disabled="busy" style="border: 0; padding: 0">
        <label v-if="!editing" class="field" style="max-width: 420px; margin-bottom: 16px">Connection method<select v-model="mode"><option value="onboarding">Guided L2TP onboarding</option><option value="manual">Existing reachable RouterOS API</option></select></label>
        <div class="form-grid">
          <label class="field">Router name<input v-model.trim="form.name" required minlength="2" maxlength="125" /></label>
          <label class="field">Customer portal slug<input v-model.trim="form.portal_slug" required minlength="3" maxlength="60" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="e.g. westlands" /></label>
          <label class="field">Payment provider<select v-model="form.payment_provider"><option value="mpesa">M-Pesa</option><option value="kopokopo">Kopo Kopo</option></select></label>
          <template v-if="mode === 'manual' || editing">
            <label class="field">Router address<input v-model.trim="form.ip_address" required maxlength="255" placeholder="Private VPN IP or reachable hostname" /></label>
            <label class="field">API port<input v-model.number="form.port" type="number" min="1" max="65535" step="1" required /></label>
            <label class="field">API username<input v-model.trim="form.username" required maxlength="125" autocomplete="off" /></label>
            <label class="field">{{ editing ? 'New API password (blank keeps current)' : 'API password' }}<input v-model="form.password" type="password" :required="!editing" minlength="8" maxlength="256" autocomplete="new-password" /></label>
            <label class="field">Customer portal enabled<input v-model="form.portal_enabled" type="checkbox" /></label>
          </template>
        </div>
        <p class="muted">Provider credentials and callbacks must be configured in the backend. Selecting a provider here does not configure or test it.</p>
        <div class="actions"><button class="primary" :disabled="busy">{{ busy ? 'Working…' : editing ? 'Save changes' : mode === 'onboarding' ? 'Provision peer & generate script' : 'Register router' }}</button><button v-if="editing" type="button" @click="reset">Cancel edit</button></div>
      </fieldset>
    </form>
    <section class="panel"><h2>Routers</h2>
      <ResourceState :loading="loading" :error="error" :selected="true" @retry="fetchRouters">
        <RecordTable :rows="routers || []" :columns="[{ key: 'name', label: 'Router' }, { key: 'ip_address', label: 'Address' }, { key: 'portal_slug', label: 'Portal slug' }, { key: 'payment_provider', label: 'Provider' }, { key: 'onboarding_status', label: 'Onboarding' }, { key: 'last_seen_at', label: 'Last seen · EAT' }]" row-key="uid" caption="Managed routers">
          <template #last_seen_at="{ row }">{{ dateTime(row.last_seen_at) }}</template>
          <template #actions="{ row }"><button :disabled="busy" @click="setActiveRouter(row)">Select</button><button :disabled="busy" @click="check(row)">Check connection</button><button :disabled="busy" @click="edit(row)">Edit</button><button class="danger" :disabled="busy" @click="remove(row)">Delete</button></template>
        </RecordTable>
        <p v-if="statusMessage" class="notice" role="status">{{ statusMessage }}</p>
      </ResourceState>
    </section>
  </div>
</template>
<script setup lang="ts">
import type { Router, Onboarding } from '~~/shared/types'
import { dateTime } from '~/utils/format'
const api = useApi()
const { routers, activeRouter, loading, error, fetchRouters, setActiveRouter } = useRouterStore()
const { busy, error: opError, message, run } = useOperation()
const mode = ref('onboarding'), editing = ref(''), statusMessage = ref(''), showScript = ref(false)
const bundle = ref<Onboarding | null>(null)
const blank = () => ({ name: '', portal_slug: '', payment_provider: 'mpesa', ip_address: '', port: 8728, username: '', password: '', portal_enabled: true })
const form = reactive(blank())
function reset() { editing.value = ''; Object.assign(form, blank()) }
function dismissBundle() { bundle.value = null; showScript.value = false }
watch(() => activeRouter.value?.uid, () => { reset(); dismissBundle(); statusMessage.value = '' })
function edit(router: Router) {
  editing.value = router.uid
  Object.assign(form, { name: router.name, portal_slug: router.portal_slug, payment_provider: router.payment_provider, ip_address: router.ip_address, port: router.port, username: router.username, password: '', portal_enabled: router.portal_enabled })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
async function save() {
  if (!editing.value && mode.value === 'onboarding') {
    if (bundle.value && !window.confirm('Replace the displayed onboarding bundle? Save its script first; its credentials cannot be retrieved again.')) return
    await run(() => api<Onboarding>('routers/onboarding', { method: 'POST', body: { name: form.name, portal_slug: form.portal_slug, payment_provider: form.payment_provider } }), async result => {
      reset(); await fetchRouters(); await nextTick(); bundle.value = result
    }, 'Onboarding bundle created. Run the script to complete the connection.')
  } else {
    const { password, ...rest } = form
    await run(() => api('routers' + (editing.value ? '/' + editing.value : ''), { method: editing.value ? 'PATCH' : 'POST', body: { ...rest, ...(password ? { password } : {}) } }), async () => { reset(); await fetchRouters() })
  }
}
async function remove(router: Router) {
  if (!window.confirm('Delete ' + router.name + '? This may remove linked records and revoke its managed VPN peer. Back up and review dependencies first.')) return
  await run(() => api('routers/' + router.uid, { method: 'DELETE' }), async () => { reset(); await fetchRouters() }, 'Router removed.')
}
async function check(router: Router) {
  statusMessage.value = ''
  await run(() => api<{ status: string; version?: string }>('routers/' + router.uid + '/status'), result => {
    statusMessage.value = router.name + ': ' + result.status + (result.version ? ' · RouterOS ' + result.version : '')
  }, 'Connection check completed.')
}
function download() {
  if (!bundle.value) return
  const url = URL.createObjectURL(new Blob([bundle.value.script], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = 'uzanet-' + bundle.value.router.uid + '.rsc'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>
