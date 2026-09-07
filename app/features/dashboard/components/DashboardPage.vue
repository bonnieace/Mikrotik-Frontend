<template>
  <div class="operator-page">
    <div class="page-heading"><div><h1>Network overview</h1><p>{{ activeRouter?.name || 'Select a router to view live data' }}</p></div><button :disabled="!activeRouter || loading || paymentsLoading || trafficLoading" @click="refreshAll">Refresh overview</button></div>
    <section class="panel">
      <h2>Live connections</h2>
      <ResourceState :loading="loading" :error="error" :selected="!!activeRouter" @retry="refresh">
        <div class="metrics"><div><p class="muted">Connected hotspot users</p><p class="metric">{{ active?.hotspot.length ?? '—' }}</p></div><div><p class="muted">Connected PPPoE subscribers</p><p class="metric">{{ active?.pppoe.length ?? '—' }}</p></div></div>
        <p class="muted">Snapshot: {{ dateTime(active?.generated_at) }} EAT. Refresh to update; these are not cumulative customer counts.</p>
      </ResourceState>
    </section>
    <section class="panel">
      <h2>Bridge traffic snapshot</h2>
      <ResourceState :loading="trafficLoading" :error="trafficError" :selected="!!activeRouter" @retry="refreshTraffic">
        <div class="metrics"><div><p class="muted">Receive</p><p class="metric">{{ mbps(traffic?.rx_bits_per_second) }} <small>Mbps</small></p></div><div><p class="muted">Transmit</p><p class="metric">{{ mbps(traffic?.tx_bits_per_second) }} <small>Mbps</small></p></div></div>
        <p class="muted">The backend monitors the interface named “bridge”. An unavailable interface is reported as an error, not zero usage.</p>
      </ResourceState>
    </section>
    <section class="panel">
      <h2>Recent ledger entries</h2>
      <ResourceState :loading="paymentsLoading" :error="paymentsError" :selected="!!activeRouter" @retry="refreshPayments">
        <p class="muted">Latest ten entries from the returned ledger. Visit Billing for payment attempts and provisioning status.</p>
        <RecordTable :rows="recent" :columns="[{ key: 'invoice', label: 'Invoice' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }, { key: 'created_at', label: 'Created · EAT' }]" row-key="uid" caption="Recent ledger entries">
          <template #amount="{ row }">{{ money(row.amount) }}</template><template #created_at="{ row }">{{ dateTime(row.created_at) }}</template>
        </RecordTable>
      </ResourceState>
    </section>
  </div>
</template>
<script setup lang="ts">
import type { ActiveUsers, Payment } from '~~/shared/types'
import { money, dateTime } from '~/utils/format'
const { activeRouter } = useRouterStore()
const { data: active, loading, error, refresh } = useRouterData<ActiveUsers>('active-users')
const { data: payments, loading: paymentsLoading, error: paymentsError, refresh: refreshPayments } = useRouterData<Payment[]>('payments')
const { data: traffic, loading: trafficLoading, error: trafficError, refresh: refreshTraffic } = useRouterData<{ rx_bits_per_second: number; tx_bits_per_second: number }>('traffic')
const recent = computed(() => [...(payments.value || [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10))
function mbps(value?: number) { return value === undefined ? '—' : (Number(value) / 1000000).toFixed(2) }
async function refreshAll() { await Promise.all([refresh(), refreshPayments(), refreshTraffic()]) }
</script>
