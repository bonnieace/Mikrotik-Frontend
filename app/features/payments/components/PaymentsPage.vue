<template>
  <div class="operator-page">
    <div class="page-heading"><div><h1>Billing & payment logs</h1><p>{{ activeRouter?.name || 'Select a router' }} · Amounts in KES; timestamps in East Africa Time.</p></div><button :disabled="busy || !activeRouter || loading || attemptsLoading || logsLoading" @click="refreshAll">Refresh all</button></div>
    <p v-if="opError" class="notice error" role="alert">{{ opError }}</p><p v-if="message" class="notice" role="status">{{ message }}</p>
    <section class="panel"><h2>Payment attempts</h2><p class="muted">Provider payment and router provisioning are separate states. Retry access only appears when the backend allows it; it does not charge the customer again. No refunds or manual payment approval are performed here.</p>
      <ResourceState :loading="attemptsLoading" :error="attemptsError" :selected="!!activeRouter" @retry="refreshAttempts">
        <RecordTable :rows="attempts || []" :columns="[{ key: 'payment_id', label: 'Reference' }, { key: 'provider', label: 'Provider' }, { key: 'phone_number', label: 'Mobile' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'State' }, { key: 'message', label: 'Detail' }, { key: 'created_at', label: 'Created · EAT' }]" row-key="payment_id" caption="Payment attempts">
          <template #amount="{ row }">{{ money(row.amount, row.currency) }}</template>
          <template #created_at="{ row }">{{ dateTime(row.created_at) }}</template>
          <template #actions="{ row }"><button v-if="row.can_retry" :disabled="busy" @click="retry(row)">Retry access</button><span v-else class="muted">—</span></template>
        </RecordTable>
      </ResourceState>
    </section>
    <section class="panel"><h2>Payment ledger</h2>
      <ResourceState :loading="loading" :error="error" :selected="!!activeRouter" @retry="refresh">
        <RecordTable :rows="payments || []" :columns="[{ key: 'invoice', label: 'Invoice' }, { key: 'provider_receipt', label: 'Receipt' }, { key: 'provider', label: 'Provider' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }, { key: 'user_type', label: 'Service' }, { key: 'created_at', label: 'Created · EAT' }]" row-key="uid" caption="Payment ledger">
          <template #amount="{ row }">{{ money(row.amount) }}</template><template #created_at="{ row }">{{ dateTime(row.created_at) }}</template>
        </RecordTable>
      </ResourceState>
    </section>
    <section class="panel"><h2>Router audit log</h2>
      <ResourceState :loading="logsLoading" :error="logsError" :selected="!!activeRouter" @retry="refreshLogs">
        <RecordTable :rows="logs || []" :columns="[{ key: 'timestamp', label: 'Time · EAT' }, { key: 'level', label: 'Level' }, { key: 'event_type', label: 'Event' }, { key: 'description', label: 'Description' }]" row-key="id" caption="Router audit events">
          <template #timestamp="{ row }">{{ dateTime(row.timestamp) }}</template>
        </RecordTable>
      </ResourceState>
    </section>
  </div>
</template>
<script setup lang="ts">
import type { Payment, PaymentAttempt, AuditLog } from '~~/shared/types'
import { money, dateTime } from '~/utils/format'
const api = useApi()
const { activeRouter } = useRouterStore()
const { data: payments, loading, error, refresh } = useRouterData<Payment[]>('payments')
const { data: attempts, loading: attemptsLoading, error: attemptsError, refresh: refreshAttempts } = useRouterData<PaymentAttempt[]>('payment-sessions')
const { data: logs, loading: logsLoading, error: logsError, refresh: refreshLogs } = useRouterData<AuditLog[]>('logs')
const { busy, error: opError, message, run } = useOperation()
async function refreshAll() { await Promise.all([refresh(), refreshAttempts(), refreshLogs()]) }
async function retry(attempt: PaymentAttempt) {
  if (!attempt.can_retry || !window.confirm('Retry access provisioning for payment ' + attempt.payment_id + '? No new charge will be initiated.')) return
  await run(() => api('payments/' + attempt.payment_id + '/retry-provisioning', { method: 'POST', body: {} }), refreshAll, 'Retry request completed. Check the updated payment state.')
}
</script>
