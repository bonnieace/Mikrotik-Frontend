<template>
  <div class="operator-page">
    <div class="page-heading"><div><h1>Service plans</h1><p>Hotspot and PPPoE pricing for {{ activeRouter?.name || 'your selected router' }}.</p></div><button :disabled="loading || busy || !activeRouter" @click="refresh">Refresh</button></div>
    <p v-if="opError" class="notice error" role="alert">{{ opError }}</p><p v-if="message" class="notice" role="status">{{ message }}</p>
    <form v-if="activeRouter" class="panel" @submit.prevent="save">
      <h2>{{ editing ? 'Edit plan' : 'Create plan' }}</h2>
      <p class="muted">The RouterOS profile must already exist on this router. Saving a plan does not configure bandwidth or create a profile.</p>
      <fieldset :disabled="busy" style="border: 0; padding: 0"><div class="form-grid">
        <label class="field">Name<input v-model.trim="form.name" required minlength="2" maxlength="125" /></label>
        <label class="field">Service<select v-model="form.service_type" :disabled="!!editing"><option value="hotspot">Hotspot</option><option value="pppoe">PPPoE</option></select></label>
        <label class="field">Price (KES)<input v-model="form.price" type="number" min="0.01" max="99999999.99" step="0.01" required /></label>
        <label class="field">Validity (minutes)<input v-model.number="form.validity_minutes" type="number" min="1" max="525600" step="1" required /></label>
        <label class="field">Existing RouterOS profile<input v-model.trim="form.router_profile" required maxlength="125" /></label>
        <label class="field">Rate limit metadata (optional)<input v-model.trim="form.rate_limit" maxlength="64" placeholder="e.g. 10M/10M" /></label>
        <label class="field">Description<input v-model.trim="form.description" maxlength="1000" /></label>
        <label class="field">Available for purchase<input v-model="form.is_active" type="checkbox" /></label>
      </div><div class="actions"><button class="primary" :disabled="busy">{{ editing ? 'Save changes' : 'Create plan' }}</button><button v-if="editing" type="button" @click="reset">Cancel edit</button></div></fieldset>
    </form>
    <section class="panel"><h2>Plan catalogue</h2>
      <ResourceState :loading="loading" :error="error" :selected="!!activeRouter" @retry="refresh">
        <RecordTable :rows="data || []" :columns="[{ key: 'name', label: 'Plan' }, { key: 'service_type', label: 'Service' }, { key: 'price', label: 'Price' }, { key: 'validity_minutes', label: 'Minutes' }, { key: 'router_profile', label: 'Profile' }, { key: 'is_active', label: 'Active' }]" row-key="uid" caption="Service plans">
          <template #price="{ row }">{{ money(row.price) }}</template>
          <template #actions="{ row }"><button :disabled="busy" @click="edit(row)">Edit</button><button v-if="row.is_active" class="danger" :disabled="busy" @click="retire(row)">Retire</button></template>
        </RecordTable>
      </ResourceState>
    </section>
  </div>
</template>
<script setup lang="ts">
import type { Plan } from '~~/shared/types'
import { money } from '~/utils/format'
const api = useApi()
const { activeRouter } = useRouterStore()
const { data, loading, error, refresh } = useRouterData<Plan[]>('packages')
const { busy, error: opError, message, run } = useOperation()
const editing = ref('')
const blank = () => ({ name: '', service_type: 'hotspot' as 'hotspot' | 'pppoe', price: '0.00', validity_minutes: 60, router_profile: 'default', rate_limit: '', description: '', is_active: true })
const form = reactive(blank())
function reset() { editing.value = ''; Object.assign(form, blank()) }
watch(() => activeRouter.value?.uid, reset)
function edit(plan: Plan) {
  editing.value = plan.uid
  Object.assign(form, { name: plan.name, service_type: plan.service_type, price: String(plan.price), validity_minutes: plan.validity_minutes, router_profile: plan.router_profile, rate_limit: plan.rate_limit || '', description: plan.description || '', is_active: plan.is_active })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
async function save() {
  const uid = activeRouter.value?.uid
  if (!uid) return
  const { service_type, ...values } = form
  const body = { ...values, price: String(form.price), rate_limit: form.rate_limit || null, description: form.description || null, ...(!editing.value ? { service_type } : {}) }
  await run(() => api('routers/' + uid + '/packages' + (editing.value ? '/' + editing.value : ''), { method: editing.value ? 'PATCH' : 'POST', body }), async () => { reset(); await refresh() })
}
async function retire(plan: Plan) {
  const uid = activeRouter.value?.uid
  if (!uid || !window.confirm('Retire ' + plan.name + '? It will no longer be available for new purchases.')) return
  await run(() => api('routers/' + uid + '/packages/' + plan.uid, { method: 'DELETE' }), async () => { if (editing.value === plan.uid) reset(); await refresh() }, 'Plan retired. Existing customer records are retained.')
}
</script>
