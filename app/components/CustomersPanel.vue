<template>
  <div class="operator-page">
    <div class="page-heading"><div><h1>{{ hotspot ? 'Hotspot users' : 'PPPoE subscribers' }}</h1><p>Customer access on {{ activeRouter?.name || 'your selected router' }}. Times shown in East Africa Time.</p></div><button :disabled="loading || busy || !activeRouter" @click="refresh">Refresh</button></div>
    <p v-if="opError" class="notice error" role="alert">{{ opError }}</p><p v-if="message" class="notice" role="status">{{ message }}</p>
    <section v-if="credentials" class="panel">
      <h2>Save these customer credentials</h2><p class="muted">Shown once. Share privately with the customer; they are cleared when you leave this page or switch routers.</p>
      <pre class="secret">Username: {{ credentials.username }}
Password: {{ credentials.password }}</pre>
      <button @click="credentials = null">I have saved them — dismiss</button>
    </section>
    <section v-if="activeRouter" class="panel">
      <h2>Add {{ hotspot ? 'hotspot customer' : 'PPPoE subscriber' }}</h2>
      <p class="muted">This provisions access immediately without collecting a payment. The selected plan's RouterOS profile must already exist.</p>
      <ResourceState :loading="plansLoading" :error="plansError" :selected="true" @retry="refreshPlans">
        <p v-if="!eligiblePlans.length" class="notice">Create an active {{ service }} plan under Service Plans first.</p>
        <form v-else @submit.prevent="create">
          <fieldset :disabled="busy" style="border: 0; padding: 0; margin: 0"><div class="form-grid">
            <label v-if="!hotspot" class="field">Customer name<input v-model.trim="form.name" required minlength="2" maxlength="125" /></label>
            <label class="field">Mobile number<input v-model.trim="form.phone" type="tel" required minlength="10" maxlength="20" placeholder="2547…" /></label>
            <label class="field">Plan<select v-model="form.package_uid" required><option value="" disabled>Select a plan</option><option v-for="plan in eligiblePlans" :key="plan.uid" :value="plan.uid">{{ plan.name }} · {{ money(plan.price) }}</option></select></label>
            <label v-if="!hotspot" class="field">PPPoE username<input v-model.trim="form.username" autocomplete="off" required minlength="3" maxlength="125" /></label>
            <label v-if="!hotspot" class="field">PPPoE password<input v-model="form.password" type="password" autocomplete="new-password" required minlength="8" maxlength="128" /></label>
            <label v-if="!hotspot" class="field">Email (optional)<input v-model.trim="form.email" type="email" maxlength="254" /></label>
            <label v-if="!hotspot" class="field">Location (optional)<input v-model.trim="form.location" maxlength="125" /></label>
            <label v-if="!hotspot" class="field">Apartment (optional)<input v-model.trim="form.apartment" maxlength="125" /></label>
          </div><div class="actions"><button class="primary" :disabled="busy">{{ busy ? 'Working…' : 'Create and provision access' }}</button></div></fieldset>
        </form>
      </ResourceState>
    </section>
    <section class="panel">
      <h2>Customer accounts</h2><p class="muted">Enabled is the account's stored access state, not proof of a current connection.</p>
      <ResourceState :loading="loading" :error="error" :selected="!!activeRouter" @retry="refresh">
        <RecordTable :rows="data || []" :columns="columns" row-key="uid" :caption="service + ' customer accounts'">
          <template #is_active="{ row }"><span class="badge" :class="{ good: row.is_active }">{{ row.is_active ? 'Enabled' : 'Disabled' }}</span></template>
          <template #expires_at="{ row }">{{ dateTime(row.expires_at) }}</template>
          <template #expires_on="{ row }">{{ dateTime(row.expires_on) }}</template>
          <template #actions="{ row }">
            <button :disabled="busy" @click="change(row, row.is_active ? 'disable' : 'enable')">{{ row.is_active ? 'Disable' : 'Enable' }}</button>
            <button class="danger" :disabled="busy" @click="change(row, 'delete')">Delete</button>
          </template>
        </RecordTable>
      </ResourceState>
    </section>
    <section class="panel">
      <div class="page-heading"><h2>Live connections</h2><button :disabled="activeLoading || !activeRouter" @click="refreshActive">Refresh connections</button></div>
      <ResourceState :loading="activeLoading" :error="activeError" :selected="!!activeRouter" @retry="refreshActive">
        <p class="muted">Snapshot: {{ dateTime(active?.generated_at) }} EAT</p>
        <RecordTable :rows="connections" :columns="[{ key: 'user', label: 'User' }, { key: 'address', label: 'IP address' }, { key: 'uptime', label: 'Uptime' }]" row-key="_key" caption="Live router connections" />
      </ResourceState>
    </section>
  </div>
</template>
<script setup lang="ts">
import type { Customer, Plan, ActiveUsers } from '~~/shared/types'
import { money, dateTime } from '~/utils/format'
const props = defineProps<{ service: 'hotspot' | 'pppoe' }>()
const hotspot = computed(() => props.service === 'hotspot')
const resource = props.service + '-users'
const api = useApi()
const { activeRouter } = useRouterStore()
const { data, loading, error, refresh } = useRouterData<Customer[]>(resource)
const { data: plans, loading: plansLoading, error: plansError, refresh: refreshPlans } = useRouterData<Plan[]>('packages')
const { data: active, loading: activeLoading, error: activeError, refresh: refreshActive } = useRouterData<ActiveUsers>('active-users')
const { busy, error: opError, message, run } = useOperation()
const credentials = ref<{ username: string; password: string } | null>(null)
const blank = () => ({ name: '', phone: '', package_uid: '', username: '', password: '', email: '', location: '', apartment: '' })
const form = reactive(blank())
watch(() => activeRouter.value?.uid, () => { Object.assign(form, blank()); credentials.value = null })
const eligiblePlans = computed(() => (plans.value || []).filter(plan => plan.service_type === props.service && plan.is_active))
const columns = computed<{ key: keyof Customer & string; label: string }[]>(() => [
  { key: hotspot.value ? 'username' : 'pppoe_username', label: 'Username' },
  ...(!hotspot.value ? [{ key: 'name' as const, label: 'Name' }] : []),
  { key: hotspot.value ? 'phone_number' : 'mobile_number', label: 'Mobile' },
  { key: 'is_active', label: 'Access' },
  { key: hotspot.value ? 'expires_at' : 'expires_on', label: 'Expires · EAT' },
])
const connections = computed(() => (active.value?.[props.service] || []).map((row, i) => ({ ...row, user: String(row.user || row.name || '—'), address: String(row.address || '—'), uptime: String(row.uptime || '—'), _key: String(row['.id'] || i) })))
async function create() {
  const uid = activeRouter.value?.uid
  if (!uid || !eligiblePlans.value.some(p => p.uid === form.package_uid)) return
  const body = hotspot.value ? { phone_number: form.phone, package_uid: form.package_uid } : { name: form.name, mobile_number: form.phone, package_uid: form.package_uid, pppoe_username: form.username, pppoe_password: form.password, ...(form.email ? { email: form.email } : {}), ...(form.location ? { location: form.location } : {}), ...(form.apartment ? { apartment: form.apartment } : {}) }
  credentials.value = null
  await run(() => api<Customer>('routers/' + uid + '/' + resource, { method: 'POST', body }), async result => {
    credentials.value = result.credentials || null
    Object.assign(form, blank())
    await Promise.all([refresh(), refreshActive()])
  }, 'Customer access provisioned.')
}
async function change(row: Customer, action: 'enable' | 'disable' | 'delete') {
  const uid = activeRouter.value?.uid
  if (!uid || !window.confirm(action.toUpperCase() + ' ' + (row.username || row.pppoe_username) + '? This changes live router access.')) return
  await run(() => api('routers/' + uid + '/' + resource + '/' + row.uid + (action === 'delete' ? '' : '/' + action), { method: action === 'delete' ? 'DELETE' : 'POST', ...(action === 'delete' ? {} : { body: {} }) }), async () => { await Promise.all([refresh(), refreshActive()]) }, 'Customer access updated.')
}
</script>
