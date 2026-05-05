<template>
  <div class="p-lg max-w-container-max mx-auto">

    <!-- Page Header -->
    <div class="flex items-end justify-between mb-xl">
      <div>
        <h2 class="font-h1 text-h1 text-on-background">Payments &amp; Logs</h2>
        <p class="font-body-md text-on-surface-variant">Real-time overview of infrastructure billing cycles and transaction records.</p>
      </div>
      <div class="flex gap-sm">
        <button class="flex items-center gap-2 bg-white border border-outline-variant px-md py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-all font-body-md text-on-surface font-medium">
          <span class="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </button>
        <button class="flex items-center gap-2 bg-primary text-on-primary px-md py-2 rounded-lg shadow-sm hover:opacity-90 transition-all font-body-md font-medium">
          <span class="material-symbols-outlined text-[18px]">add</span>
          Manual Transaction
        </button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-4 gap-lg mb-xl">

      <!-- Today Hotspot Total -->
      <div class="bg-white p-md border border-slate-200 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Today — Hotspot</span>
          <span class="material-symbols-outlined text-amber-500">wifi</span>
        </div>
        <p class="font-h1 text-h1 font-bold text-on-background">
          <template v-if="statsLoading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:24px">progress_activity</span></template>
          <template v-else>KES {{ (todayHotspot ?? 0).toLocaleString() }}</template>
        </p>
        <div class="h-1 bg-slate-100 rounded-full overflow-hidden mt-sm">
          <div class="bg-amber-400 h-full w-3/4"></div>
        </div>
      </div>

      <!-- Today PPPoE Total -->
      <div class="bg-white p-md border border-slate-200 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Today — PPPoE</span>
          <span class="material-symbols-outlined text-blue-500">cable</span>
        </div>
        <p class="font-h1 text-h1 font-bold text-on-background">
          <template v-if="statsLoading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:24px">progress_activity</span></template>
          <template v-else>KES {{ (todayPppoe ?? 0).toLocaleString() }}</template>
        </p>
        <div class="h-1 bg-slate-100 rounded-full overflow-hidden mt-sm">
          <div class="bg-blue-500 h-full w-1/2"></div>
        </div>
      </div>

      <!-- Today Combined -->
      <div class="bg-white p-md border border-slate-200 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Today — Combined</span>
          <span class="material-symbols-outlined text-secondary">payments</span>
        </div>
        <p class="font-h1 text-h1 font-bold text-on-background">
          <template v-if="statsLoading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:24px">progress_activity</span></template>
          <template v-else>KES {{ ((todayHotspot ?? 0) + (todayPppoe ?? 0)).toLocaleString() }}</template>
        </p>
        <div class="h-1 bg-slate-100 rounded-full overflow-hidden mt-sm">
          <div class="bg-secondary h-full w-2/3"></div>
        </div>
      </div>

      <!-- Total Records -->
      <div class="bg-white p-md border border-slate-200 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Total Records</span>
          <span class="material-symbols-outlined text-on-surface-variant">receipt_long</span>
        </div>
        <p class="font-h1 text-h1 font-bold text-on-background">
          <template v-if="loading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:24px">progress_activity</span></template>
          <template v-else>{{ transactions.length.toLocaleString() }}</template>
        </p>
        <div class="h-1 bg-slate-100 rounded-full overflow-hidden mt-sm">
          <div class="bg-slate-400 h-full w-full"></div>
        </div>
      </div>

    </div>

    <!-- Filters Bar -->
    <div class="bg-white border border-outline-variant p-md rounded-xl flex flex-wrap items-end gap-md mb-lg">

      <div class="flex flex-col gap-1 min-w-[180px]">
        <label class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Date Range</label>
        <div class="flex items-center border border-outline-variant rounded-lg px-3 py-2 bg-slate-50">
          <span class="material-symbols-outlined text-[16px] text-slate-400 mr-2">calendar_today</span>
          <input
            v-model="dateRange"
            class="bg-transparent border-none p-0 font-body-sm text-body-sm w-full outline-none text-on-surface"
            type="text"
            placeholder="All dates"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1 min-w-[160px]">
        <label class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">User Type</label>
        <select
          v-model="userTypeFilter"
          class="border border-outline-variant rounded-lg px-3 py-2 bg-slate-50 font-body-sm text-body-sm text-on-surface outline-none focus:border-secondary"
          @change="applyFilters"
        >
          <option value="">All Types</option>
          <option value="hotspot">Hotspot</option>
          <option value="pppoe">PPPoE</option>
        </select>
      </div>

      <div class="flex-1 flex items-end justify-end gap-sm">
        <button
          class="bg-slate-100 text-on-surface px-md py-2 rounded-lg font-body-sm font-semibold hover:bg-slate-200 transition-colors"
          @click="statusFilter = ''; userTypeFilter = ''; dateRange = ''; currentPage = 1; fetchTransactions()"
        >
          Clear Filters
        </button>
        <button
          class="bg-primary text-on-primary px-md py-2 rounded-lg font-body-sm font-semibold hover:opacity-90 transition-all"
          @click="applyFilters"
        >
          Apply Filters
        </button>
      </div>
    </div>

    <!-- Transaction Table -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-lg">
      <table class="w-full text-left border-collapse">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest">Date / Time</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest">Invoice</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest">User ID</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest text-center">Type</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest text-right">Amount (KES)</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">

          <!-- Loading skeleton -->
          <template v-if="loading">
            <tr v-for="i in 8" :key="i" class="animate-pulse">
              <td class="px-md py-3"><div class="h-4 bg-slate-100 rounded w-24"></div></td>
              <td class="px-md py-3"><div class="h-4 bg-slate-100 rounded w-48"></div></td>
              <td class="px-md py-3"><div class="h-4 bg-slate-100 rounded w-16"></div></td>
              <td class="px-md py-3"><div class="h-5 bg-slate-100 rounded w-16 mx-auto"></div></td>
              <td class="px-md py-3"><div class="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
              <td class="px-md py-3"></td>
            </tr>
          </template>

          <!-- Data rows -->
          <template v-else>
            <tr
              v-for="txn in paginatedTransactions"
              :key="txn.id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <!-- Date / Time -->
              <td class="px-md py-3">
                <p class="font-body-md text-on-surface font-medium">{{ formatDate(txn.created_at) }}</p>
                <p class="text-[11px] text-slate-500">{{ formatTime(txn.created_at) }}</p>
              </td>

              <!-- Invoice -->
              <td class="px-md py-3">
                <code class="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-600">{{ txn.invoice }}</code>
              </td>

              <!-- User ID -->
              <td class="px-md py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    :class="txn.user_type === 'hotspot' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'"
                  >
                    {{ txn.user_type === 'hotspot' ? 'H' : 'P' }}
                  </div>
                  <span class="font-body-md text-on-surface">#{{ txn.user_id }}</span>
                </div>
              </td>

              <!-- Type badge -->
              <td class="px-md py-3">
                <div class="flex justify-center">
                  <span
                    class="px-2 py-0.5 text-[10px] font-bold rounded uppercase"
                    :class="txn.user_type === 'hotspot' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'"
                  >
                    {{ txn.user_type }}
                  </span>
                </div>
              </td>

              <!-- Amount -->
              <td class="px-md py-3 text-right">
                <p class="font-body-md font-bold text-on-surface">{{ txn.amount.toLocaleString() }}</p>
              </td>

              <!-- Actions -->
              <td class="px-md py-3 text-center">
                <button class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded">
                  <span class="material-symbols-outlined text-[18px] text-on-surface-variant">more_vert</span>
                </button>
              </td>
            </tr>

            <tr v-if="filteredTransactions.length === 0">
              <td colspan="6" class="px-md py-12 text-center font-body-md text-on-surface-variant">
                No transactions found.
              </td>
            </tr>
          </template>

        </tbody>
      </table>

      <!-- Pagination -->
      <div class="bg-slate-50 border-t border-slate-200 px-md py-3 flex items-center justify-between">
        <p class="font-body-sm text-body-sm text-on-surface-variant">
          Showing {{ paginationStart }}–{{ paginationEnd }} of {{ filteredTransactions.length }} records
        </p>
        <div class="flex items-center gap-1">
          <button
            class="w-8 h-8 flex items-center justify-center border border-slate-200 rounded bg-white text-slate-400 disabled:opacity-40"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <span class="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            class="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-[11px] font-bold"
            :class="p === currentPage ? 'bg-primary text-on-primary border-primary' : 'bg-white hover:bg-slate-100'"
            @click="currentPage = p"
          >
            {{ p }}
          </button>
          <button
            class="w-8 h-8 flex items-center justify-center border border-slate-200 rounded bg-white text-slate-400 disabled:opacity-40"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <span class="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Audit Log Section -->
    <div class="bg-white border border-slate-200 rounded-xl p-lg">
      <div class="flex items-center justify-between mb-md">
        <h3 class="font-h3 text-h3 text-on-background">System Billing Audit Logs</h3>
        <div class="flex items-center gap-sm">
          <span class="bg-slate-100 text-on-surface-variant px-sm py-1 rounded-lg font-table-header text-table-header">Auto-sync: Every 5m</span>
          <button
            class="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            :class="loading ? 'animate-spin text-secondary' : 'text-slate-400'"
            @click="fetchLogs"
          >
            <span class="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        </div>
      </div>

      <!-- Logs list -->
      <div class="space-y-xs">

        <!-- Loading -->
        <template v-if="logsLoading">
          <div v-for="i in 3" :key="i" class="flex items-start gap-3 p-sm animate-pulse">
            <div class="w-6 h-6 bg-slate-100 rounded mt-0.5 flex-shrink-0"></div>
            <div class="flex-1 space-y-1.5">
              <div class="h-3 bg-slate-100 rounded w-48"></div>
              <div class="h-3 bg-slate-100 rounded w-72"></div>
            </div>
          </div>
        </template>

        <!-- Data -->
        <template v-else>
          <div
            v-for="log in auditLogs"
            :key="log.id"
            class="flex items-start gap-3 p-sm rounded-lg hover:bg-slate-50 transition-colors border-l-2 border-slate-200"
          >
            <span class="material-symbols-outlined mt-0.5 text-[20px] flex-shrink-0 text-slate-400">info</span>
            <div class="flex-1 min-w-0">
              <p class="font-body-sm font-semibold text-on-surface">{{ log.description }}</p>
              <p v-if="log.phone_number" class="text-[11px] text-slate-500">{{ log.phone_number }}</p>
            </div>
            <span class="ml-auto text-[11px] text-slate-400 whitespace-nowrap flex-shrink-0">{{ formatDate(log.timestamp) }} {{ formatTime(log.timestamp) }}</span>
          </div>

          <p v-if="auditLogs.length === 0" class="py-md text-center font-body-sm text-on-surface-variant">
            No audit logs available.
          </p>
        </template>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
interface Transaction {
  id: number
  invoice: string
  amount: number
  user_type: 'hotspot' | 'pppoe'
  user_id: number
  created_at: string
}

interface AuditLog {
  id: number
  description: string
  phone_number: string | null
  timestamp: string
}

interface TodayTotal {
  total_payment: number
}

// ── Auth & config ──────────────────────────────────────────────────────────
const config = useRuntimeConfig()
const { token } = useAuth()
const { activeRouter } = useRouterStore()

// ── State ──────────────────────────────────────────────────────────────────
const loading = ref(false)
const logsLoading = ref(false)
const statsLoading = ref(false)
const transactions = ref<Transaction[]>([])
const auditLogs = ref<AuditLog[]>([])
const todayHotspot = ref<number | null>(null)
const todayPppoe = ref<number | null>(null)

const statusFilter = ref('')
const userTypeFilter = ref('')
const dateRange = ref('')
const currentPage = ref(1)
const perPage = 10

// ── Fetch ──────────────────────────────────────────────────────────────────
async function fetchTransactions() {
  if (!token.value || !activeRouter.value?.id) return
  loading.value = true
  try {
    const url = userTypeFilter.value
      ? `${config.public.apiBase}/payments/${userTypeFilter.value}?router_id=${activeRouter.value.id}`
      : `${config.public.apiBase}/payments?router_id=${activeRouter.value.id}`
    const data = await $fetch<Transaction[]>(url, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    transactions.value = Array.isArray(data) ? data : []
  } catch {
    transactions.value = []
  } finally {
    loading.value = false
  }
}

async function fetchTodayTotals() {
  if (!token.value || !activeRouter.value?.id) return
  statsLoading.value = true
  try {
    const rid = activeRouter.value?.id
    const [hotspot, pppoe] = await Promise.allSettled([
      $fetch<TodayTotal>(`${config.public.apiBase}/payments/today/total/hotspot?router_id=${rid}`, {
        headers: { Authorization: `Bearer ${token.value}` },
      }),
      $fetch<TodayTotal>(`${config.public.apiBase}/payments/today/total/pppoe?router_id=${rid}`, {
        headers: { Authorization: `Bearer ${token.value}` },
      }),
    ])
    todayHotspot.value = hotspot.status === 'fulfilled' ? (hotspot.value?.total_payment ?? 0) : 0
    todayPppoe.value = pppoe.status === 'fulfilled' ? (pppoe.value?.total_payment ?? 0) : 0
  } finally {
    statsLoading.value = false
  }
}

async function fetchLogs() {
  if (!token.value || !activeRouter.value?.id) return
  logsLoading.value = true
  try {
    const data = await $fetch<AuditLog[]>(`${config.public.apiBase}/logs?router_id=${activeRouter.value.id}`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    auditLogs.value = Array.isArray(data) ? data : []
  } catch {
    auditLogs.value = []
  } finally {
    logsLoading.value = false
  }
}

function applyFilters() {
  currentPage.value = 1
  fetchTransactions()
}

onMounted(() => {
  fetchTransactions()
  fetchTodayTotals()
  fetchLogs()
})

// ── Filtering & Pagination ────────────────────────────────────────────────
const filteredTransactions = computed(() => transactions.value)

watch(filteredTransactions, () => { currentPage.value = 1 })

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTransactions.value.length / perPage)))

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredTransactions.value.slice(start, start + perPage)
})

const paginationStart = computed(() =>
  filteredTransactions.value.length === 0 ? 0 : (currentPage.value - 1) * perPage + 1,
)
const paginationEnd = computed(() =>
  Math.min(currentPage.value * perPage, filteredTransactions.value.length),
)

// ── Helpers ───────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC'
}
</script>
