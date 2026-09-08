<!-- Layout reference: stitch-service-plans.html. -->
<template>
  <div class="operator-page">
    <div class="page-heading">
      <div>
        <h1>Service Plans</h1>
        <p>
          Manage pricing and access duration for
          {{ activeRouter?.name || 'your selected router' }}.
        </p>
      </div>
      <div class="actions heading-actions">
        <button :disabled="loading || busy || !activeRouter" @click="refresh">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span
          >Refresh</button
        ><button class="primary" :disabled="!activeRouter || busy" @click="openCreate">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>Create
          New Plan
        </button>
      </div>
    </div>
    <p v-if="opError && !formOpen" class="notice error" role="alert">
      {{ opError }}
    </p>
    <p v-if="message" class="notice" role="status">{{ message }}</p>
    <div class="metrics three">
      <MetricCard
        label="Total Plans"
        :value="data?.length"
        icon="receipt_long"
        :loading="loading"
        note="All plans on this router"
      /><MetricCard
        label="Hotspot Plans"
        :value="data?.filter((p) => p.service_type === 'hotspot' && p.is_active).length"
        icon="wifi"
        tone="amber"
        tag="Active"
        :loading="loading"
        note="Available for hotspot purchases"
      /><MetricCard
        label="PPP Plans"
        :value="data?.filter((p) => p.service_type === 'pppoe' && p.is_active).length"
        icon="cable"
        tone="purple"
        tag="Active"
        :loading="loading"
        note="Available for subscriber renewals"
      />
    </div>
    <section class="panel table-panel">
      <ResourceState
        :loading="loading"
        :error="error"
        :selected="!!activeRouter"
        label="service plans"
        @retry="refresh"
      >
        <RecordTable
          :rows="filteredPlans"
          :columns="[
            { key: 'name', label: 'Plan Name' },
            { key: 'description', label: 'Description' },
            { key: 'service_type', label: 'Type' },
            { key: 'price', label: 'Price (KES)' },
            { key: 'validity_minutes', label: 'Validity' },
            { key: 'is_active', label: 'Status' },
          ]"
          row-key="uid"
          caption="Service plans"
          placeholder="Search service plans…"
          record-label="plans"
          empty-title="No service plans found"
          empty-description="Create a plan or change your filters to see more plans."
        >
          <template #filters
            ><label class="table-filter"
              ><span class="sr-only">Plan service filter</span
              ><select v-model="serviceFilter">
                <option value="all">All types</option>
                <option value="hotspot">Hotspot</option>
                <option value="pppoe">PPPoE</option>
              </select></label
            ><label class="table-filter"
              ><span class="sr-only">Plan status filter</span
              ><select v-model="stateFilter">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="retired">Retired</option>
              </select></label
            ></template
          >
          <template #name="{ row }"
            ><div class="cell-identity">
              <span class="cell-icon" :class="{ amber: row.service_type === 'hotspot' }"
                ><span class="material-symbols-outlined" aria-hidden="true">{{
                  row.service_type === 'hotspot' ? 'wifi' : 'cable'
                }}</span></span
              >
              <div>
                <strong>{{ row.name }}</strong
                ><small>Profile: {{ row.router_profile }}</small>
              </div>
            </div></template
          >
          <template #description="{ row }"
            ><span class="plan-description">{{ row.description || '—' }}</span></template
          >
          <template #service_type="{ row }"
            ><span class="badge" :class="row.service_type === 'hotspot' ? 'warning' : 'blue'">{{
              row.service_type
            }}</span></template
          >
          <template #price="{ row }"
            ><span class="amount">{{ money(row.price) }}</span></template
          >
          <template #validity_minutes="{ row }"
            ><span class="whitespace-nowrap">{{
              planDuration(row.validity_minutes)
            }}</span></template
          >
          <template #is_active="{ row }"
            ><StatusBadge :status="row.is_active ? 'active' : 'retired'"
          /></template>
          <template #actions="{ row }"
            ><button
              class="ghost"
              :disabled="busy"
              :aria-label="'Edit ' + row.name"
              @click="edit(row)"
            >
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span
              >Edit</button
            ><button
              v-if="row.is_active"
              class="danger ghost"
              :disabled="busy"
              @click="retire(row)"
            >
              Retire
            </button></template
          >
        </RecordTable>
      </ResourceState>
    </section>
    <div class="context-grid">
      <section class="context-card dark">
        <h2>Infrastructure Alignment</h2>
        <p>
          Each plan uses an existing RouterOS profile. Configure the profile on the router to apply
          its bandwidth limits.
        </p>
        <NuxtLink to="/routers"
          >Manage infrastructure<span
            class="material-symbols-outlined text-[16px]"
            aria-hidden="true"
            >arrow_forward</span
          ></NuxtLink
        >
      </section>
      <section class="context-card">
        <h2>Retiring a plan</h2>
        <p>
          Retired plans stop appearing for new purchases. Existing customer and payment records stay
          available.
        </p>
      </section>
    </div>
    <AppDrawer
      :open="formOpen"
      :title="editing ? 'Edit Service Plan' : 'Create Service Plan'"
      :busy="busy"
      @close="closeForm"
      ><p v-if="opError" class="notice error" role="alert">{{ opError }}</p>
      <form @submit.prevent="save">
        <p class="muted">
          The RouterOS profile must already exist on this router. Saving a plan does not configure
          bandwidth or create a profile.
        </p>
        <fieldset :disabled="busy" style="border: 0; padding: 0">
          <div class="form-grid">
            <label class="field"
              >Name<input v-model.trim="form.name" required minlength="2" maxlength="125"
            /></label>
            <label class="field"
              >Service<select v-model="form.service_type" :disabled="!!editing">
                <option value="hotspot">Hotspot</option>
                <option value="pppoe">PPPoE</option>
              </select></label
            >
            <label class="field"
              >Price (KES)<input
                v-model="form.price"
                type="number"
                min="0.01"
                max="99999999.99"
                step="0.01"
                required
            /></label>
            <label class="field"
              >Validity (minutes)<input
                v-model.number="form.validity_minutes"
                type="number"
                min="1"
                max="525600"
                step="1"
                required
            /></label>
            <label class="field"
              >Existing RouterOS profile<input
                v-model.trim="form.router_profile"
                required
                maxlength="125"
            /></label>
            <label class="field"
              >Advertised speed (optional)<input
                v-model.trim="form.rate_limit"
                maxlength="64"
                placeholder="e.g. 10M/10M"
            /></label>
            <label class="field"
              >Description<input v-model.trim="form.description" maxlength="1000"
            /></label>
            <label class="field check-field"
              >Available for purchase<input v-model="form.is_active" type="checkbox"
            /></label>
          </div>
          <div class="actions">
            <button class="primary" :disabled="busy">
              {{ editing ? 'Save changes' : 'Create plan' }}</button
            ><button type="button" @click="closeForm">Cancel</button>
          </div>
        </fieldset>
      </form></AppDrawer
    >
  </div>
</template>
<script setup lang="ts">
import type { Plan } from '~~/shared/types'
import { money } from '~/utils/format'
import { planDuration } from '~/utils/overview'
const api = useApi()
const { activeRouter } = useRouterStore()
const { data, loading, error, refresh } = useRouterData<Plan[]>('packages')
const { busy, error: opError, message, run } = useOperation()
const editing = ref('')
const formOpen = ref(false),
  serviceFilter = ref('all'),
  stateFilter = ref('all')
const filteredPlans = computed(() =>
  (data.value || []).filter(
    (p) =>
      (serviceFilter.value === 'all' || p.service_type === serviceFilter.value) &&
      (stateFilter.value === 'all' || p.is_active === (stateFilter.value === 'active')),
  ),
)
function closeForm() {
  formOpen.value = false
  reset()
}
function openCreate() {
  reset()
  opError.value = ''
  message.value = ''
  formOpen.value = true
}
const blank = () => ({
  name: '',
  service_type: 'hotspot' as 'hotspot' | 'pppoe',
  price: '0.00',
  validity_minutes: 60,
  router_profile: 'default',
  rate_limit: '',
  description: '',
  is_active: true,
})
const form = reactive(blank())
function reset() {
  editing.value = ''
  Object.assign(form, blank())
}
watch(
  () => activeRouter.value?.uid,
  () => {
    closeForm()
    serviceFilter.value = 'all'
    stateFilter.value = 'all'
  },
)
function edit(plan: Plan) {
  opError.value = ''
  editing.value = plan.uid
  Object.assign(form, {
    name: plan.name,
    service_type: plan.service_type,
    price: String(plan.price),
    validity_minutes: plan.validity_minutes,
    router_profile: plan.router_profile,
    rate_limit: plan.rate_limit || '',
    description: plan.description || '',
    is_active: plan.is_active,
  })
  formOpen.value = true
}
async function save() {
  const uid = activeRouter.value?.uid
  if (!uid) return
  const { service_type, ...values } = form
  const body = {
    ...values,
    price: String(form.price),
    rate_limit: form.rate_limit || null,
    description: form.description || null,
    ...(!editing.value ? { service_type } : {}),
  }
  await run(
    () =>
      api('routers/' + uid + '/packages' + (editing.value ? '/' + editing.value : ''), {
        method: editing.value ? 'PATCH' : 'POST',
        body,
      }),
    async () => {
      closeForm()
      await refresh()
    },
  )
}
async function retire(plan: Plan) {
  const uid = activeRouter.value?.uid
  if (
    !uid ||
    !window.confirm('Retire ' + plan.name + '? It will no longer be available for new purchases.')
  )
    return
  await run(
    () => api('routers/' + uid + '/packages/' + plan.uid, { method: 'DELETE' }),
    async () => {
      if (editing.value === plan.uid) reset()
      await refresh()
    },
    'Plan retired. Existing customer records are retained.',
  )
}
</script>

<style scoped>
.plan-description {
  display: block;
  min-width: 140px;
  max-width: 240px;
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
</style>
