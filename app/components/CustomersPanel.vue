<!-- Layout reference: stitch-hotspot-users.html and stitch-ppp-users.html. -->
<template>
  <div class="operator-page">
    <div class="page-heading">
      <div>
        <h1>{{ hotspot ? 'Hotspot User Sessions' : 'PPP User Management' }}</h1>
        <p>
          {{
            hotspot
              ? 'Monitor hotspot connections and manage customer access.'
              : 'Manage subscribers and monitor active PPP sessions.'
          }}
        </p>
      </div>
      <div class="actions heading-actions">
        <button
          :disabled="loading || activeLoading || busy || !activeRouter"
          @click="
            refresh()
            refreshActive()
          "
        >
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span
          >Refresh</button
        ><button class="primary" :disabled="!activeRouter || busy" @click="openForm">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">person_add</span
          >{{ hotspot ? 'Add customer' : 'Add subscriber' }}
        </button>
      </div>
    </div>
    <p v-if="opError && !formOpen" class="notice error" role="alert">
      {{ opError }}
    </p>
    <p v-if="message" class="notice" role="status">{{ message }}</p>
    <div class="metrics">
      <MetricCard
        :label="hotspot ? 'Customer Accounts' : 'Total Subscribers'"
        :value="data?.length"
        icon="group"
        tag="Accounts"
        :loading="loading"
        note="On your selected router"
      />
      <MetricCard
        label="Active Sessions"
        :value="active ? connections.length : null"
        :icon="hotspot ? 'wifi' : 'cable'"
        tone="green"
        tag="Live"
        :loading="activeLoading"
        note="Connected to the router now"
      />
      <MetricCard
        label="Enabled Access"
        :value="enabled"
        icon="verified_user"
        tone="purple"
        tag="Accounts"
        :loading="loading"
        note="Stored account access state"
      />
      <MetricCard
        label="Disabled Access"
        :value="data ? data.length - (enabled || 0) : null"
        icon="person_off"
        tone="amber"
        tag="Accounts"
        :loading="loading"
        note="Accounts with access disabled"
      />
    </div>
    <section class="panel table-panel">
      <div class="panel-heading">
        <div>
          <h2>
            {{ hotspot ? 'Active Hotspot Sessions' : 'Active PPP Sessions' }}
          </h2>
          <p class="muted">
            {{
              active
                ? 'Snapshot: ' + dateTime(active.generated_at) + ' EAT'
                : 'Live connections on your selected router'
            }}
          </p>
        </div>
        <span class="badge good"><span aria-hidden="true">•</span>Live sessions</span>
      </div>
      <ResourceState
        :loading="activeLoading"
        :error="activeError"
        :selected="!!activeRouter"
        label="active sessions"
        @retry="refreshActive"
      >
        <RecordTable
          :rows="connections"
          :columns="[
            { key: 'user', label: 'User / Session' },
            { key: 'address', label: 'IP address' },
            { key: 'uptime', label: 'Uptime' },
          ]"
          row-key="_key"
          caption="Live router connections"
          placeholder="Search live sessions…"
          empty-title="No active sessions"
          empty-description="Connected customers appear here when the router reports an active session."
        >
          <template #user="{ row }"
            ><div class="cell-identity">
              <span class="cell-icon" :class="{ amber: hotspot }"
                ><span class="material-symbols-outlined" aria-hidden="true">{{
                  hotspot ? 'wifi' : 'cable'
                }}</span></span
              ><strong>{{ row.user }}</strong>
            </div></template
          >
          <template #address="{ row }"
            ><code>{{ row.address }}</code></template
          ><template #uptime="{ row }"
            ><span class="mono">{{ row.uptime }}</span></template
          >
        </RecordTable>
      </ResourceState>
    </section>
    <section class="panel table-panel">
      <div class="panel-heading">
        <div>
          <h2>{{ hotspot ? 'Hotspot Customers' : 'PPP Subscribers' }}</h2>
          <p class="muted">Manage account access. Enabled accounts may be disconnected.</p>
        </div>
      </div>
      <ResourceState
        :loading="loading"
        :error="error"
        :selected="!!activeRouter"
        label="customer accounts"
        @retry="refresh"
      >
        <RecordTable
          :rows="filteredCustomers"
          :columns="columns"
          row-key="uid"
          :caption="service + ' customer accounts'"
          placeholder="Search customers, usernames or mobile…"
          empty-title="No customers found"
          empty-description="Add a customer or change your access filter to get started."
        >
          <template #filters
            ><label class="table-filter"
              ><span class="sr-only">Account access filter</span
              ><select v-model="accessFilter">
                <option value="all">All access states</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select></label
            ></template
          >
          <template #name="{ row }"
            ><div class="cell-identity">
              <span class="cell-icon">{{
                (row.name || row.pppoe_username || '?').slice(0, 2).toUpperCase()
              }}</span
              ><strong>{{ row.name || row.pppoe_username }}</strong>
            </div></template
          >
          <template #username="{ row }"
            ><div class="cell-identity">
              <span class="cell-icon amber"
                ><span class="material-symbols-outlined" aria-hidden="true">person</span></span
              ><strong>{{ row.username }}</strong>
            </div></template
          >
          <template #pppoe_username="{ row }"
            ><span class="mono">{{ row.pppoe_username }}</span></template
          >
          <template #is_active="{ row }"
            ><StatusBadge :status="row.is_active ? 'enabled' : 'disabled'"
          /></template>
          <template #expires_at="{ row }">{{ dateTime(row.expires_at) }}</template
          ><template #expires_on="{ row }">{{ dateTime(row.expires_on) }}</template>
          <template #actions="{ row }"
            ><button :disabled="busy" @click="change(row, row.is_active ? 'disable' : 'enable')">
              {{ row.is_active ? 'Disable' : 'Enable' }}</button
            ><button
              class="danger ghost"
              :disabled="busy"
              :aria-label="'Delete ' + (row.username || row.pppoe_username)"
              @click="change(row, 'delete')"
            >
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
            </button></template
          >
        </RecordTable>
      </ResourceState>
    </section>
    <div class="context-grid">
      <section class="context-card dark">
        <h2>
          {{ hotspot ? 'Flexible access for your customers' : 'Manage Your Service Profiles' }}
        </h2>
        <p>Keep pricing and access duration up to date with service plans for this router.</p>
        <NuxtLink to="/service-plans"
          >Manage service plans<span
            class="material-symbols-outlined text-[16px]"
            aria-hidden="true"
            >arrow_forward</span
          ></NuxtLink
        >
      </section>
      <section class="context-card">
        <h2>Connection snapshots</h2>
        <p>
          Use Refresh to see the latest sessions. Account access and live connection status are
          shown separately.
        </p>
      </section>
    </div>
    <AppDrawer
      :open="formOpen"
      :title="hotspot ? 'Add Hotspot Customer' : 'Add PPP Subscriber'"
      :busy="busy"
      @close="closeForm"
      ><p v-if="opError" class="notice error" role="alert">{{ opError }}</p>
      <p class="muted">This provisions access immediately without collecting a payment.</p>
      <ResourceState
        :loading="plansLoading"
        :error="plansError"
        :selected="true"
        @retry="refreshPlans"
      >
        <p v-if="!eligiblePlans.length" class="notice">
          Create an active {{ service }} plan under Service Plans first.
        </p>
        <form v-else @submit.prevent="create">
          <fieldset :disabled="busy" style="border: 0; padding: 0; margin: 0">
            <div class="form-grid">
              <label v-if="!hotspot" class="field"
                >Customer name<input
                  v-model.trim="form.name"
                  required
                  minlength="2"
                  maxlength="125"
              /></label>
              <label class="field"
                >Mobile number<input
                  v-model.trim="form.phone"
                  type="tel"
                  required
                  minlength="10"
                  maxlength="20"
                  placeholder="2547…"
              /></label>
              <label class="field"
                >Plan<select v-model="form.package_uid" required>
                  <option value="" disabled>Select a plan</option>
                  <option v-for="plan in eligiblePlans" :key="plan.uid" :value="plan.uid">
                    {{ plan.name }} · {{ money(plan.price) }}
                  </option>
                </select></label
              >
              <label v-if="!hotspot" class="field"
                >PPPoE username<input
                  v-model.trim="form.username"
                  autocomplete="off"
                  required
                  minlength="3"
                  maxlength="125"
              /></label>
              <label v-if="!hotspot" class="field"
                >PPPoE password<input
                  v-model="form.password"
                  type="password"
                  autocomplete="new-password"
                  required
                  minlength="8"
                  maxlength="128"
              /></label>
              <label v-if="!hotspot" class="field"
                >Email (optional)<input v-model.trim="form.email" type="email" maxlength="254"
              /></label>
              <label v-if="!hotspot" class="field"
                >Location (optional)<input v-model.trim="form.location" maxlength="125"
              /></label>
              <label v-if="!hotspot" class="field"
                >Apartment (optional)<input v-model.trim="form.apartment" maxlength="125"
              /></label>
            </div>
            <div class="actions">
              <button type="button" @click="closeForm">Cancel</button
              ><button class="primary" :disabled="busy">
                {{ busy ? 'Working…' : 'Create and provision access' }}
              </button>
            </div>
          </fieldset>
        </form>
      </ResourceState>
    </AppDrawer>
    <AppDrawer :open="!!credentials" title="Customer Credentials" @close="credentials = null"
      ><template v-if="credentials"
        ><p class="muted">Shown once. Save and share privately with the customer.</p>
        <pre class="secret">
Username: {{ credentials.username }}
Password: {{ credentials.password }}</pre
        >
        <div class="actions">
          <button class="primary" @click="credentials = null">I have saved the credentials</button>
        </div></template
      ></AppDrawer
    >
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
const {
  data: plans,
  loading: plansLoading,
  error: plansError,
  refresh: refreshPlans,
} = useRouterData<Plan[]>('packages')
const {
  data: active,
  loading: activeLoading,
  error: activeError,
  refresh: refreshActive,
} = useRouterData<ActiveUsers>('active-users')
const { busy, error: opError, message, run } = useOperation()
const formOpen = ref(false)
const accessFilter = ref('all')
const filteredCustomers = computed(() =>
  (data.value || []).filter(
    (row) => accessFilter.value === 'all' || row.is_active === (accessFilter.value === 'enabled'),
  ),
)
const enabled = computed(() => data.value?.filter((row) => row.is_active).length)
const credentials = ref<{ username: string; password: string } | null>(null)
const blank = () => ({
  name: '',
  phone: '',
  package_uid: '',
  username: '',
  password: '',
  email: '',
  location: '',
  apartment: '',
})
const form = reactive(blank())
function closeForm() {
  formOpen.value = false
  Object.assign(form, blank())
  opError.value = ''
}
function openForm() {
  closeForm()
  formOpen.value = true
}
watch(
  () => activeRouter.value?.uid,
  () => {
    Object.assign(form, blank())
    credentials.value = null
    formOpen.value = false
    accessFilter.value = 'all'
  },
)
const eligiblePlans = computed(() =>
  (plans.value || []).filter((plan) => plan.service_type === props.service && plan.is_active),
)
const columns = computed<{ key: keyof Customer & string; label: string }[]>(() => [
  {
    key: hotspot.value ? 'username' : 'name',
    label: hotspot.value ? 'Customer' : 'Subscriber',
  },
  ...(!hotspot.value ? [{ key: 'pppoe_username' as const, label: 'Username' }] : []),
  { key: hotspot.value ? 'phone_number' : 'mobile_number', label: 'Mobile' },
  { key: 'is_active', label: 'Access' },
  {
    key: hotspot.value ? 'expires_at' : 'expires_on',
    label: 'Expires · EAT',
  },
])
const connections = computed(() =>
  (active.value?.[props.service] || []).map((row, i) => ({
    ...row,
    user: String(row.user || row.name || '—'),
    address: String(row.address || '—'),
    uptime: String(row.uptime || '—'),
    _key: String(row['.id'] || i),
  })),
)
async function create() {
  const uid = activeRouter.value?.uid
  if (!uid || !eligiblePlans.value.some((p) => p.uid === form.package_uid)) return
  const body = hotspot.value
    ? { phone_number: form.phone, package_uid: form.package_uid }
    : {
        name: form.name,
        mobile_number: form.phone,
        package_uid: form.package_uid,
        pppoe_username: form.username,
        pppoe_password: form.password,
        ...(form.email ? { email: form.email } : {}),
        ...(form.location ? { location: form.location } : {}),
        ...(form.apartment ? { apartment: form.apartment } : {}),
      }
  credentials.value = null
  await run(
    () =>
      api<Customer>('routers/' + uid + '/' + resource, {
        method: 'POST',
        body,
      }),
    async (result) => {
      formOpen.value = false
      credentials.value = result.credentials || null
      Object.assign(form, blank())
      await Promise.all([refresh(), refreshActive()])
    },
    'Customer access provisioned.',
  )
}
async function change(row: Customer, action: 'enable' | 'disable' | 'delete') {
  const uid = activeRouter.value?.uid
  if (
    !uid ||
    !window.confirm(
      action.toUpperCase() +
        ' ' +
        (row.username || row.pppoe_username) +
        '? This changes live router access.',
    )
  )
    return
  await run(
    () =>
      api(
        'routers/' +
          uid +
          '/' +
          resource +
          '/' +
          row.uid +
          (action === 'delete' ? '' : '/' + action),
        {
          method: action === 'delete' ? 'DELETE' : 'POST',
          ...(action === 'delete' ? {} : { body: {} }),
        },
      ),
    async () => {
      await Promise.all([refresh(), refreshActive()])
    },
    'Customer access updated.',
  )
}
</script>
