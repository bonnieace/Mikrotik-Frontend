<!-- Restored from stitch-dashboard.html and the pre-readiness DashboardPage.
     Values remain on the hardened UUID API; the chart uses measured samples. -->
<template>
  <div class="operator-page">
    <div class="page-heading">
      <div>
        <h1>Network Overview</h1>
        <p>
          Infrastructure performance and billing for
          {{ activeRouter?.name || 'your network' }}.
        </p>
      </div>
      <div class="actions heading-actions">
        <span class="badge">Today · EAT</span
        ><button :disabled="!activeRouter || refreshing" @click="refreshAll">
          <span
            class="material-symbols-outlined text-[18px]"
            :class="{ 'animate-spin': refreshing }"
            aria-hidden="true"
            >refresh</span
          >Refresh overview
        </button>
      </div>
    </div>
    <div class="metrics">
      <MetricCard
        label="Hotspot Earnings"
        :value="earnings('hotspot')"
        icon="payments"
        tone="blue"
        tag="Today"
        :loading="paymentsLoading"
        :note="paymentsError ? 'Earnings unavailable' : 'Completed ledger entries · EAT'"
      />
      <MetricCard
        label="PPP Earnings"
        :value="earnings('pppoe')"
        icon="account_balance"
        tone="purple"
        tag="Today"
        :loading="paymentsLoading"
        :note="paymentsError ? 'Earnings unavailable' : 'Completed ledger entries · EAT'"
      />
      <MetricCard
        label="Active PPP Users"
        :value="active?.pppoe.length"
        icon="dns"
        tone="green"
        tag="Live"
        :loading="loading"
        :note="error ? 'Connections unavailable' : 'Connected sessions on this router'"
      />
      <MetricCard
        label="Active Hotspot Users"
        :value="active?.hotspot.length"
        icon="wifi"
        tone="amber"
        tag="Live"
        :loading="loading"
        :note="error ? 'Connections unavailable' : 'Connected sessions on this router'"
      />
    </div>
    <p v-if="error || paymentsError" class="notice error" role="alert">
      {{ error || paymentsError }}
      <button :disabled="refreshing" @click="refreshAll">Retry overview</button>
    </p>
    <TrafficChart
      :key="activeRouter?.uid || 'none'"
      :data="traffic"
      :loading="trafficLoading"
      :error="trafficError"
      :selected="!!activeRouter"
      @retry="refreshTraffic"
    />
    <section class="panel table-panel">
      <div class="panel-heading">
        <div>
          <h2>System Logs &amp; Events</h2>
          <p class="muted">
            Recent activity on
            {{ activeRouter?.name || 'your selected router' }}
          </p>
        </div>
        <NuxtLink to="/billing" class="action"
          >View all logs<span class="material-symbols-outlined text-[16px]" aria-hidden="true"
            >arrow_forward</span
          ></NuxtLink
        >
      </div>
      <ResourceState
        :loading="logsLoading"
        :error="logsError"
        :selected="!!activeRouter"
        label="system events"
        @retry="refreshLogs"
      >
        <RecordTable
          :rows="recentLogs"
          :columns="[
            { key: 'timestamp', label: 'Timestamp · EAT' },
            { key: 'phone_number', label: 'User' },
            { key: 'description', label: 'Description' },
            { key: 'level', label: 'Level' },
          ]"
          row-key="id"
          caption="Recent system events"
          :searchable="false"
          :paginate="false"
          empty-title="No system events yet"
          empty-description="Router activity will appear here as events are recorded."
        >
          <template #timestamp="{ row }"
            ><span class="mono">{{ dateTime(row.timestamp) }}</span></template
          >
          <template #phone_number="{ row }"
            ><span class="cell-identity"
              ><span class="material-symbols-outlined text-[16px]" aria-hidden="true">{{
                row.phone_number ? 'person' : 'smart_toy'
              }}</span
              >{{ row.phone_number || 'System' }}</span
            ></template
          >
          <template #level="{ row }"><StatusBadge :status="row.level.toLowerCase()" /></template>
        </RecordTable>
      </ResourceState>
    </section>
    <section class="panel table-panel">
      <div class="panel-heading">
        <h2>Recent Payments</h2>
        <NuxtLink to="/billing" class="muted">Open billing →</NuxtLink>
      </div>
      <ResourceState
        :loading="paymentsLoading"
        :error="paymentsError"
        :selected="!!activeRouter"
        label="payments"
        @retry="refreshPayments"
      >
        <RecordTable
          :rows="recent"
          :columns="[
            { key: 'invoice', label: 'Invoice' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
            { key: 'created_at', label: 'Created · EAT' },
          ]"
          row-key="uid"
          caption="Recent ledger entries"
          :searchable="false"
          :paginate="false"
        >
          <template #invoice="{ row }"
            ><span class="mono">{{ row.invoice }}</span></template
          ><template #amount="{ row }"
            ><span class="amount">{{ money(row.amount) }}</span></template
          ><template #status="{ row }"><StatusBadge :status="row.status" /></template
          ><template #created_at="{ row }">{{ dateTime(row.created_at) }}</template>
        </RecordTable>
      </ResourceState>
    </section>
  </div>
</template>
<script setup lang="ts">
import type { ActiveUsers, Payment, AuditLog } from '~~/shared/types'
import { money, dateTime } from '~/utils/format'
import { todayEarnings } from '~/utils/overview'
const { activeRouter } = useRouterStore()
const { data: active, loading, error, refresh } = useRouterData<ActiveUsers>('active-users')
const {
  data: payments,
  loading: paymentsLoading,
  error: paymentsError,
  refresh: refreshPayments,
} = useRouterData<Payment[]>('payments')
const {
  data: traffic,
  loading: trafficLoading,
  error: trafficError,
  refresh: refreshTraffic,
} = useRouterData<{ rx_bits_per_second: number; tx_bits_per_second: number }>('traffic')
const {
  data: logs,
  loading: logsLoading,
  error: logsError,
  refresh: refreshLogs,
} = useRouterData<AuditLog[]>('logs')
const recent = computed(() =>
  [...(payments.value || [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
)
const recentLogs = computed(() =>
  [...(logs.value || [])].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5),
)
const refreshing = computed(
  () => loading.value || paymentsLoading.value || trafficLoading.value || logsLoading.value,
)
function earnings(service: 'hotspot' | 'pppoe') {
  const total = todayEarnings(payments.value, service)
  return total === null ? '—' : money(total)
}
async function refreshAll() {
  if (!refreshing.value)
    await Promise.all([refresh(), refreshPayments(), refreshTraffic(), refreshLogs()])
}
let timer: ReturnType<typeof setInterval> | undefined
function resume() {
  if (!document.hidden && activeRouter.value) void refreshAll()
}
onMounted(() => {
  timer = setInterval(resume, 30000)
  document.addEventListener('visibilitychange', resume)
})
onUnmounted(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', resume)
})
</script>
