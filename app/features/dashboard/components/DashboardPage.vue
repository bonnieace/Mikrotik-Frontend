<!--
  DashboardPage.vue — 1:1 from Stitch export "Dashboard"
  Source: projects/13247784430269981727/screens/5d657f2b035845f1a67d8d91edbb30fc
  DO NOT redesign. Pixel-perfect match required.
-->
<template>
  <div class="p-lg max-w-container-max mx-auto space-y-lg">

    <!-- Header -->
    <div class="flex items-end justify-between">
      <div>
        <h2 class="font-h1 text-h1 text-on-background">Network Overview</h2>
        <p class="text-on-surface-variant font-body-md">Real-time infrastructure performance and billing metrics</p>
      </div>
      <div class="flex space-x-2">
        <button class="px-4 py-2 bg-white border border-outline-variant text-on-surface font-body-md rounded-lg hover:bg-surface-container transition-colors flex items-center">
          <span class="material-symbols-outlined mr-2 text-[18px]">calendar_month</span>
          Today
        </button>
        <button class="px-4 py-2 bg-primary text-on-primary font-body-md rounded-lg hover:opacity-90 transition-opacity flex items-center shadow-sm">
          <span class="material-symbols-outlined mr-2 text-[18px]">download</span>
          Export Report
        </button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">

      <!-- Hotspot Earnings -->
      <div class="bg-white border border-slate-200 p-md rounded-xl shadow-sm hover:border-slate-300 transition-colors">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
            <span class="material-symbols-outlined">payments</span>
          </div>
          <span class="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold">Today</span>
        </div>
        <p class="text-slate-500 font-table-header uppercase tracking-wider text-[10px] mb-1">Hotspot Earnings</p>
        <h3 class="text-2xl font-bold text-slate-900 tracking-tight">
          <span v-if="earningsLoading" class="material-symbols-outlined animate-spin text-blue-400 text-[22px]">progress_activity</span>
          <span v-else>{{ formatCurrency(hotspotEarnings) }}</span>
        </h3>
        <div class="mt-4 h-8 w-full">
          <div class="flex items-end gap-1 h-full">
            <div class="bg-blue-200 w-full h-[40%] rounded-sm"></div>
            <div class="bg-blue-200 w-full h-[60%] rounded-sm"></div>
            <div class="bg-blue-200 w-full h-[45%] rounded-sm"></div>
            <div class="bg-blue-200 w-full h-[75%] rounded-sm"></div>
            <div class="bg-blue-200 w-full h-[55%] rounded-sm"></div>
            <div class="bg-blue-600 w-full h-[90%] rounded-sm"></div>
          </div>
        </div>
      </div>

      <!-- PPP earnings -->
      <div class="bg-white border border-slate-200 p-md rounded-xl shadow-sm hover:border-slate-300 transition-colors">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-purple-50 rounded-lg text-purple-600">
            <span class="material-symbols-outlined">account_balance</span>
          </div>
          <span class="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold">Today</span>
        </div>
        <p class="text-slate-500 font-table-header uppercase tracking-wider text-[10px] mb-1">PPP Earnings</p>
        <h3 class="text-2xl font-bold text-slate-900 tracking-tight">
          <span v-if="earningsLoading" class="material-symbols-outlined animate-spin text-purple-400 text-[22px]">progress_activity</span>
          <span v-else>{{ formatCurrency(pppoeEarnings) }}</span>
        </h3>
        <div class="mt-4 h-8 w-full">
          <div class="flex items-end gap-1 h-full">
            <div class="bg-purple-200 w-full h-[70%] rounded-sm"></div>
            <div class="bg-purple-200 w-full h-[80%] rounded-sm"></div>
            <div class="bg-purple-200 w-full h-[65%] rounded-sm"></div>
            <div class="bg-purple-200 w-full h-[75%] rounded-sm"></div>
            <div class="bg-purple-200 w-full h-[85%] rounded-sm"></div>
            <div class="bg-purple-600 w-full h-[95%] rounded-sm"></div>
          </div>
        </div>
      </div>

      <!-- Active PPP Users -->
      <div class="bg-white border border-slate-200 p-md rounded-xl shadow-sm hover:border-slate-300 transition-colors">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <span class="material-symbols-outlined">dns</span>
          </div>
          <span class="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold">Live</span>
        </div>
        <p class="text-slate-500 font-table-header uppercase tracking-wider text-[10px] mb-1">Active PPP Users</p>
        <h3 class="text-2xl font-bold text-slate-900 tracking-tight">
          <span v-if="activeUsersLoading" class="material-symbols-outlined animate-spin text-emerald-400 text-[22px]">progress_activity</span>
          <span v-else>{{ pppCount.toLocaleString() }}</span>
        </h3>
        <div class="mt-4 h-8 w-full">
          <div class="flex items-end gap-1 h-full">
            <div class="bg-emerald-200 w-full h-[85%] rounded-sm"></div>
            <div class="bg-emerald-200 w-full h-[88%] rounded-sm"></div>
            <div class="bg-emerald-200 w-full h-[84%] rounded-sm"></div>
            <div class="bg-emerald-200 w-full h-[86%] rounded-sm"></div>
            <div class="bg-emerald-200 w-full h-[87%] rounded-sm"></div>
            <div class="bg-emerald-600 w-full h-[86%] rounded-sm"></div>
          </div>
        </div>
      </div>

      <!-- Active Hotspot Users -->
      <div class="bg-white border border-slate-200 p-md rounded-xl shadow-sm hover:border-slate-300 transition-colors">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-orange-50 rounded-lg text-orange-600">
            <span class="material-symbols-outlined">wifi</span>
          </div>
          <span class="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold">Live</span>
        </div>
        <p class="text-slate-500 font-table-header uppercase tracking-wider text-[10px] mb-1">Active Hotspot Users</p>
        <h3 class="text-2xl font-bold text-slate-900 tracking-tight">
          <span v-if="activeUsersLoading" class="material-symbols-outlined animate-spin text-orange-400 text-[22px]">progress_activity</span>
          <span v-else>{{ hotspotCount.toLocaleString() }}</span>
        </h3>
        <div class="mt-4 h-8 w-full">
          <div class="flex items-end gap-1 h-full">
            <div class="bg-orange-200 w-full h-[60%] rounded-sm"></div>
            <div class="bg-orange-200 w-full h-[55%] rounded-sm"></div>
            <div class="bg-orange-200 w-full h-[45%] rounded-sm"></div>
            <div class="bg-orange-200 w-full h-[40%] rounded-sm"></div>
            <div class="bg-orange-200 w-full h-[35%] rounded-sm"></div>
            <div class="bg-orange-600 w-full h-[30%] rounded-sm"></div>
          </div>
        </div>
      </div>

    </div>

    <!-- Network Traffic Chart -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="p-lg border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="font-h3 text-h3 text-slate-900">Aggregate Network Traffic</h3>
          <p class="text-body-sm text-slate-500">Core switch traffic monitoring in real-time (Mbps)</p>
        </div>
        <div class="flex items-center space-x-6">
          <div class="flex items-center">
            <span class="w-3 h-3 rounded-full bg-blue-600 mr-2"></span>
            <span class="text-xs font-semibold text-slate-700">Download (Rx)</span>
          </div>
          <div class="flex items-center">
            <span class="w-3 h-3 rounded-full bg-secondary mr-2"></span>
            <span class="text-xs font-semibold text-slate-700">Upload (Tx)</span>
          </div>
        </div>
      </div>
      <div class="p-lg h-[400px] relative bg-slate-50/30">
        <!-- Grid lines -->
        <div class="absolute inset-x-lg inset-y-lg flex flex-col justify-between pointer-events-none">
          <div class="w-full h-px bg-slate-200"></div>
          <div class="w-full h-px bg-slate-200"></div>
          <div class="w-full h-px bg-slate-200"></div>
          <div class="w-full h-px bg-slate-200"></div>
          <div class="w-full h-px bg-slate-200"></div>
        </div>
        <div class="relative w-full h-full">
          <svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
            <path d="M0 250 Q 100 240, 200 180 T 400 120 T 600 160 T 800 80 T 1000 100" fill="none" stroke="#2563eb" stroke-linecap="round" stroke-width="3" />
            <path d="M0 280 Q 100 270, 200 220 T 400 180 T 600 210 T 800 140 T 1000 160" fill="none" stroke="#006591" stroke-dasharray="8 4" stroke-linecap="round" stroke-width="3" />
          </svg>
          <div class="absolute inset-x-0 bottom-0 flex justify-between px-2 pt-2 text-[10px] font-mono text-slate-400">
            <span>08:00</span>
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
            <span>20:00</span>
            <span>22:00</span>
          </div>
        </div>
      </div>
    </div>

    <!-- System Logs Table -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="px-lg py-md border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-h3 text-h3 text-slate-900">System Logs &amp; Events</h3>
        <div class="flex items-center space-x-2">
          <span class="text-xs text-slate-500">Auto-refresh every 30s</span>
          <button class="text-slate-400 hover:text-slate-600 transition-colors" :class="{ 'animate-spin': logsLoading }" @click="fetchLogs">
            <span class="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <!-- Loading state -->
        <div v-if="logsLoading && logs.length === 0" class="flex items-center justify-center py-12 text-slate-400">
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          <span class="text-sm">Loading logs…</span>
        </div>
        <!-- No router selected -->
        <div v-else-if="!activeRouter" class="flex items-center justify-center py-12 text-slate-400">
          <span class="material-symbols-outlined mr-2">router</span>
          <span class="text-sm">Select a router to view logs</span>
        </div>
        <table v-else class="w-full text-left border-collapse table-fixed">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-200">
              <th class="w-44 px-lg py-3 text-table-header text-slate-500 uppercase tracking-wider">Timestamp</th>
              <th class="w-36 px-lg py-3 text-table-header text-slate-500 uppercase tracking-wider">User</th>
              <th class="px-lg py-3 text-table-header text-slate-500 uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-slate-50 transition-colors">
              <td class="w-44 px-lg py-3 text-body-sm text-slate-600 font-mono whitespace-nowrap">{{ formatTimestamp(log.timestamp) }}</td>
              <td class="w-36 px-lg py-3 text-body-sm">
                <span
                  class="inline-flex items-center gap-1 min-w-0"
                  :class="log.phone_number ? 'text-slate-900 font-semibold' : 'text-slate-400 italic'"
                >
                  <span class="material-symbols-outlined text-[14px] shrink-0">{{ log.phone_number ? 'person' : 'smart_toy' }}</span>
                  <span class="truncate">{{ log.phone_number ?? 'System User' }}</span>
                </span>
              </td>
              <td class="px-lg py-3 text-body-sm text-slate-600 break-words">{{ log.description }}</td>
            </tr>
            <tr v-if="logs.length === 0 && !logsLoading">
              <td colspan="3" class="px-lg py-8 text-center text-sm text-slate-400">No logs found for this router</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-lg py-3 border-t border-slate-100 bg-slate-50/50">
        <button class="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center">
          View All Logs
          <span class="material-symbols-outlined text-[14px] ml-1">arrow_forward</span>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
interface LogEntry {
  id: number
  description: string
  phone_number: string | null
  timestamp: string
}

interface HotspotResponse {
  router_id: number
  generated_at: string
  hotspot_active: unknown[]
}

interface PppoeResponse {
  router_id: number
  generated_at: string
  pppoe_active: unknown[]
}

interface PaymentTotalResponse {
  total_payment: number
}

const { token } = useAuth()
const config = useRuntimeConfig()
const { activeRouter } = useRouterStore()

const logs = ref<LogEntry[]>([])
const logsLoading = ref(false)
const hotspotCount = ref(0)
const pppCount = ref(0)
const activeUsersLoading = ref(false)
const hotspotEarnings = ref(0)
const pppoeEarnings = ref(0)
const earningsLoading = ref(false)

async function fetchLogs() {
  if (!activeRouter.value || !token.value) return
  logsLoading.value = true
  try {
    const data = await $fetch<LogEntry[]>(`${config.public.apiBase}/logs`, {
      params: { router_id: activeRouter.value.id },
      headers: { Authorization: `Bearer ${token.value}` },
    })
    logs.value = data
  } catch {
    logs.value = []
  } finally {
    logsLoading.value = false
  }
}

async function fetchActiveUsers() {
  if (!activeRouter.value || !token.value) return
  activeUsersLoading.value = true
  try {
    const [hotspot, pppoe] = await Promise.all([
      $fetch<HotspotResponse>(`${config.public.apiBase}/active_users/${activeRouter.value.id}/hotspot`, {
        headers: { Authorization: `Bearer ${token.value}` },
      }),
      $fetch<PppoeResponse>(`${config.public.apiBase}/active_users/${activeRouter.value.id}/pppoe`, {
        headers: { Authorization: `Bearer ${token.value}` },
      }),
    ])
    hotspotCount.value = hotspot.hotspot_active.length
    pppCount.value = pppoe.pppoe_active.length
  } catch {
    hotspotCount.value = 0
    pppCount.value = 0
  } finally {
    activeUsersLoading.value = false
  }
}

async function fetchEarnings() {
  if (!activeRouter.value || !token.value) return
  earningsLoading.value = true
  try {
    const [hotspot, pppoe] = await Promise.all([
      $fetch<PaymentTotalResponse>(`${config.public.apiBase}/payments/today/total/hotspot`, {
        params: { router_id: activeRouter.value.id },
        headers: { Authorization: `Bearer ${token.value}` },
      }),
      $fetch<PaymentTotalResponse>(`${config.public.apiBase}/payments/today/total/pppoe`, {
        params: { router_id: activeRouter.value.id },
        headers: { Authorization: `Bearer ${token.value}` },
      }),
    ])
    hotspotEarnings.value = hotspot.total_payment
    pppoeEarnings.value = pppoe.total_payment
  } catch {
    hotspotEarnings.value = 0
    pppoeEarnings.value = 0
  } finally {
    earningsLoading.value = false
  }
}

function formatCurrency(amount: number) {
  return `Ksh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatTimestamp(ts: string) {
  return ts.replace('T', ' ').slice(0, 19)
}

// Fetch all data whenever active router changes
watch(activeRouter, () => {
  fetchLogs()
  fetchActiveUsers()
  fetchEarnings()
}, { immediate: true })
</script>
