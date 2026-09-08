<!-- Layout reference: stitch-payments-logs.html. -->
<template>
  <div class="operator-page">
    <div class="page-heading">
      <div>
        <h1>Payments &amp; Logs</h1>
        <p>
          Billing activity and transaction records for
          {{ activeRouter?.name || 'your selected router' }}.
        </p>
      </div>
      <div class="actions heading-actions">
        <span class="badge">KES · East Africa Time</span
        ><button
          :disabled="busy || !activeRouter || loading || attemptsLoading || logsLoading"
          @click="refreshAll"
        >
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span
          >Refresh all
        </button>
      </div>
    </div>
    <p v-if="opError" class="notice error" role="alert">{{ opError }}</p>
    <p v-if="message" class="notice" role="status">{{ message }}</p>
    <div class="metrics">
      <MetricCard
        label="Today — Hotspot"
        :value="earnings('hotspot')"
        icon="wifi"
        tone="amber"
        tag="Today"
        :loading="loading"
        note="Completed ledger entries"
      /><MetricCard
        label="Today — PPPoE"
        :value="earnings('pppoe')"
        icon="cable"
        tag="Today"
        :loading="loading"
        note="Completed ledger entries"
      /><MetricCard
        label="Today — Combined"
        :value="combined"
        icon="payments"
        tone="green"
        tag="Today"
        :loading="loading"
        note="Completed payments · EAT"
      /><MetricCard
        label="Ledger Records"
        :value="payments?.length"
        icon="receipt_long"
        tone="purple"
        tag="All dates"
        :loading="loading"
        note="Records returned for this router"
      />
    </div>
    <section class="panel billing-filters" aria-label="Payment filters">
      <label class="field">Date · EAT<input v-model="dateFilter" type="date" /></label
      ><label class="field"
        >Service type<select v-model="serviceFilter">
          <option value="all">All types</option>
          <option value="hotspot">Hotspot</option>
          <option value="pppoe">PPPoE</option>
        </select></label
      ><label class="field"
        >Payment status<select v-model="statusFilter">
          <option value="all">All statuses</option>
          <option v-for="status in statuses" :key="status" :value="status">
            {{ status.replaceAll('_', ' ') }}
          </option>
        </select></label
      ><button class="ghost" @click="clearFilters">Clear filters</button>
    </section>
    <section class="panel table-panel">
      <div class="tabs" aria-label="Billing views">
        <button :aria-pressed="tab === 'ledger'" @click="tab = 'ledger'">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">receipt_long</span
          >Transactions<span class="badge">{{ payments?.length ?? '—' }}</span></button
        ><button :aria-pressed="tab === 'attempts'" @click="tab = 'attempts'">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">sync_alt</span
          >Payment attempts<span class="badge">{{ attempts?.length ?? '—' }}</span>
        </button>
      </div>
      <ResourceState
        v-if="tab === 'ledger'"
        :loading="loading"
        :error="error"
        :selected="!!activeRouter"
        label="transactions"
        @retry="refresh"
      >
        <RecordTable
          :rows="filteredPayments"
          :columns="[
            { key: 'created_at', label: 'Date / Time · EAT' },
            { key: 'invoice', label: 'Invoice / Receipt' },
            { key: 'provider', label: 'Provider' },
            { key: 'user_type', label: 'Type' },
            { key: 'amount', label: 'Amount (KES)' },
            { key: 'status', label: 'Status' },
          ]"
          row-key="uid"
          caption="Payment ledger"
          placeholder="Search invoices, providers or amounts…"
          empty-title="No transactions found"
          empty-description="Try clearing the filters, or check again after a completed payment."
        >
          <template #created_at="{ row }"
            ><span class="mono">{{ dateTime(row.created_at) }}</span></template
          >
          <template #invoice="{ row }"
            ><div class="cell-identity">
              <span class="cell-icon"
                ><span class="material-symbols-outlined" aria-hidden="true"
                  >receipt_long</span
                ></span
              >
              <div>
                <strong class="mono">{{ row.invoice }}</strong
                ><small>{{ row.provider_receipt || 'No provider receipt' }}</small>
              </div>
            </div></template
          >
          <template #provider="{ row }"
            ><span class="badge">{{
              row.provider === 'mpesa'
                ? 'M-Pesa'
                : row.provider === 'kopokopo'
                  ? 'Kopo Kopo'
                  : row.provider
            }}</span></template
          >
          <template #user_type="{ row }"
            ><span class="badge" :class="row.user_type === 'hotspot' ? 'warning' : 'blue'">{{
              row.user_type
            }}</span></template
          >
          <template #amount="{ row }"
            ><span class="amount">{{ money(row.amount) }}</span></template
          ><template #status="{ row }"><StatusBadge :status="row.status" /></template>
        </RecordTable>
      </ResourceState>
      <ResourceState
        v-else
        :loading="attemptsLoading"
        :error="attemptsError"
        :selected="!!activeRouter"
        label="payment attempts"
        @retry="refreshAttempts"
      >
        <RecordTable
          :rows="filteredAttempts"
          :columns="[
            { key: 'payment_id', label: 'Reference / Provider' },
            { key: 'phone_number', label: 'Mobile' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'State' },
            { key: 'message', label: 'Detail' },
            { key: 'created_at', label: 'Created · EAT' },
          ]"
          row-key="payment_id"
          caption="Payment attempts"
          placeholder="Search payment attempts…"
          empty-title="No payment attempts found"
          empty-description="Payment requests will appear here when customers start checkout."
        >
          <template #payment_id="{ row }"
            ><div class="cell-identity">
              <span class="cell-icon"
                ><span class="material-symbols-outlined" aria-hidden="true">payments</span></span
              >
              <div>
                <strong class="mono">{{ row.payment_id }}</strong
                ><small>{{ row.provider }}</small>
              </div>
            </div></template
          >
          <template #amount="{ row }"
            ><span class="amount">{{ money(row.amount, row.currency) }}</span></template
          ><template #status="{ row }"><StatusBadge :status="row.status" /></template>
          <template #created_at="{ row }"
            ><span class="mono">{{ dateTime(row.created_at) }}</span></template
          ><template #message="{ row }"
            ><span class="payment-detail">{{ row.message || '—' }}</span></template
          >
          <template #actions="{ row }"
            ><button v-if="row.can_retry" :disabled="busy" @click="retry(row)">
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">refresh</span
              >Retry access</button
            ><span v-else class="muted">—</span></template
          >
        </RecordTable>
        <p class="billing-note">
          <span class="material-symbols-outlined text-[16px]" aria-hidden="true">info</span>Retry
          access restores provisioning after payment. It does not charge the customer again.
        </p>
      </ResourceState>
    </section>
    <section class="panel table-panel">
      <div class="panel-heading">
        <div>
          <h2>System Billing Audit Logs</h2>
          <p class="muted">Recorded events and operational activity</p>
        </div>
        <button class="ghost" :disabled="logsLoading || !activeRouter" @click="refreshLogs">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span
          >Refresh logs
        </button>
      </div>
      <ResourceState
        :loading="logsLoading"
        :error="logsError"
        :selected="!!activeRouter"
        label="audit events"
        @retry="refreshLogs"
      >
        <RecordTable
          :rows="logs || []"
          :columns="[
            { key: 'timestamp', label: 'Time · EAT' },
            { key: 'event_type', label: 'Event' },
            { key: 'description', label: 'Description' },
            { key: 'level', label: 'Level' },
          ]"
          row-key="id"
          caption="Router audit events"
          placeholder="Search audit events…"
          empty-title="No audit events yet"
        >
          <template #timestamp="{ row }"
            ><span class="mono">{{ dateTime(row.timestamp) }}</span></template
          ><template #event_type="{ row }"
            ><div class="cell-identity">
              <span
                class="material-symbols-outlined text-[18px] text-slate-400"
                aria-hidden="true"
                >{{ row.level.toLowerCase() === 'error' ? 'error_outline' : 'history' }}</span
              ><strong>{{ row.event_type.replaceAll('_', ' ') }}</strong>
            </div></template
          ><template #level="{ row }"><StatusBadge :status="row.level.toLowerCase()" /></template>
        </RecordTable>
      </ResourceState>
    </section>
  </div>
</template>
<script setup lang="ts">
import type { Payment, PaymentAttempt, AuditLog } from '~~/shared/types'
import { money, dateTime } from '~/utils/format'
import { todayEarnings, eatDateKey } from '~/utils/overview'
const api = useApi()
const { activeRouter } = useRouterStore()
const { data: payments, loading, error, refresh } = useRouterData<Payment[]>('payments')
const {
  data: attempts,
  loading: attemptsLoading,
  error: attemptsError,
  refresh: refreshAttempts,
} = useRouterData<PaymentAttempt[]>('payment-sessions')
const {
  data: logs,
  loading: logsLoading,
  error: logsError,
  refresh: refreshLogs,
} = useRouterData<AuditLog[]>('logs')
const { busy, error: opError, message, run } = useOperation()
const tab = ref('ledger'),
  serviceFilter = ref('all'),
  statusFilter = ref('all'),
  dateFilter = ref('')
const filteredPayments = computed(() =>
  (payments.value || []).filter(
    (row) =>
      (serviceFilter.value === 'all' || row.user_type === serviceFilter.value) &&
      (statusFilter.value === 'all' || row.status === statusFilter.value) &&
      (!dateFilter.value || eatDateKey(row.created_at) === dateFilter.value),
  ),
)
const filteredAttempts = computed(() =>
  (attempts.value || []).filter(
    (row) =>
      (serviceFilter.value === 'all' || row.service_type === serviceFilter.value) &&
      (statusFilter.value === 'all' || row.status === statusFilter.value) &&
      (!dateFilter.value || eatDateKey(row.created_at) === dateFilter.value),
  ),
)
const statuses = computed(() =>
  [
    ...new Set(
      (tab.value === 'ledger' ? payments.value || [] : attempts.value || []).map(
        (row) => row.status,
      ),
    ),
  ].sort(),
)
function clearFilters() {
  serviceFilter.value = 'all'
  statusFilter.value = 'all'
  dateFilter.value = ''
}
watch(tab, () => {
  statusFilter.value = 'all'
})
watch(() => activeRouter.value?.uid, clearFilters)
function earnings(service: 'hotspot' | 'pppoe') {
  const value = todayEarnings(payments.value, service)
  return value === null ? '—' : money(value)
}
const combined = computed(() => {
  const a = todayEarnings(payments.value, 'hotspot')
  const b = todayEarnings(payments.value, 'pppoe')
  return a === null || b === null ? '—' : money(a + b)
})
async function refreshAll() {
  await Promise.all([refresh(), refreshAttempts(), refreshLogs()])
}
async function retry(attempt: PaymentAttempt) {
  if (
    !attempt.can_retry ||
    !window.confirm(
      'Retry access provisioning for payment ' +
        attempt.payment_id +
        '? No new charge will be initiated.',
    )
  )
    return
  await run(
    () =>
      api('payments/' + attempt.payment_id + '/retry-provisioning', {
        method: 'POST',
        body: {},
      }),
    refreshAll,
    'Retry request completed. Check the updated payment state.',
  )
}
</script>

<style scoped>
.billing-filters {
  display: flex;
  gap: 16px;
  align-items: end;
  flex-wrap: wrap;
  padding: 16px;
}
.billing-filters .field {
  flex: 1 1 150px;
}
.billing-filters button {
  margin-left: auto;
}
.billing-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
}
.payment-detail {
  display: block;
  width: 200px;
  font-size: 12px;
  overflow-wrap: anywhere;
}
</style>
