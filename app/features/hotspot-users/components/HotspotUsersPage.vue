<!--
  HotspotUsersPage.vue — Pixel-perfect from Stitch "Hotspot Users"
  Source: projects/13247784430269981727/screens/3c78f7a03a594c58877da2770043329a
  DO NOT redesign. Pixel-perfect match required.
-->
<template>
  <div class="p-md sm:p-lg max-w-container-max mx-auto">

    <!-- Header -->
    <header class="mb-lg flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="font-h1 text-h1 text-on-background">Hotspot User Sessions</h2>
        <p class="font-body-md text-on-surface-variant">Real-time monitoring of active infrastructure connections</p>
      </div>
      <div class="flex w-full sm:w-auto gap-sm">
        <button
          class="w-full sm:w-auto justify-center flex items-center gap-2 px-md py-2 bg-primary text-on-primary font-body-md rounded-lg hover:opacity-90 transition-all"
          @click="fetchData"
        >
          <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': loading }">refresh</span>
          Refresh Data
        </button>
      </div>
    </header>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-lg mb-lg">

      <!-- Total Active -->
      <div class="bg-white p-md border border-outline-variant rounded-xl shadow-sm">
        <div class="flex justify-between items-start mb-2">
          <span class="text-on-surface-variant font-mono-label uppercase tracking-widest text-xs">Total Active</span>
          <span class="text-emerald-600 text-xs font-bold flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">trending_up</span>
            Live
          </span>
        </div>
        <div class="text-display font-display text-primary" style="font-size:36px;line-height:44px;font-weight:700;letter-spacing:-0.02em;">
          <template v-if="loading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:36px;line-height:44px;">progress_activity</span></template>
          <template v-else>{{ activeSessions.length.toLocaleString() }}</template>
        </div>
        <div class="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
          <div class="bg-blue-600 h-full w-3/4"></div>
        </div>
      </div>

      <!-- Average Session -->
      <div class="bg-white p-md border border-outline-variant rounded-xl shadow-sm">
        <div class="flex justify-between items-start mb-2">
          <span class="text-on-surface-variant font-mono-label uppercase tracking-widest text-xs">Avg Session</span>
          <span class="text-slate-500 text-xs font-medium">Active users</span>
        </div>
        <div class="text-display font-display text-primary" style="font-size:36px;line-height:44px;font-weight:700;letter-spacing:-0.02em;">
          <template v-if="loading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:36px;line-height:44px;">progress_activity</span></template>
          <template v-else>{{ avgSessionUptime }}</template>
        </div>
        <div class="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
          <div class="bg-emerald-500 h-full w-4/5"></div>
        </div>
      </div>

      <!-- Total Purchases -->
      <div class="bg-white p-md border border-outline-variant rounded-xl shadow-sm">
        <div class="flex justify-between items-start mb-2">
          <span class="text-on-surface-variant font-mono-label uppercase tracking-widest text-xs">Total Purchases</span>
          <span class="text-on-surface-variant text-xs font-medium">Hotspot Users</span>
        </div>
        <div class="text-display font-display text-primary" style="font-size:36px;line-height:44px;font-weight:700;letter-spacing:-0.02em;">
          <template v-if="loading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:36px;line-height:44px;">progress_activity</span></template>
          <template v-else>{{ hotspotUsers.length.toLocaleString() }}</template>
        </div>
        <div class="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
          <div class="bg-orange-500 h-full w-1/2"></div>
        </div>
      </div>

      <!-- Revenue -->
      <div class="bg-white p-md border border-outline-variant rounded-xl shadow-sm">
        <div class="flex justify-between items-start mb-2">
          <span class="text-on-surface-variant font-mono-label uppercase tracking-widest text-xs">Revenue</span>
          <span class="text-emerald-600 text-xs font-bold flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">payments</span>
            KES
          </span>
        </div>
        <div class="text-display font-display text-primary" style="font-size:36px;line-height:44px;font-weight:700;letter-spacing:-0.02em;">
          <template v-if="loading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:36px;line-height:44px;">progress_activity</span></template>
          <template v-else>{{ totalRevenue.toLocaleString() }}</template>
        </div>
        <div class="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
          <div class="bg-emerald-500 h-full w-2/3"></div>
        </div>
      </div>

    </div>

    <!-- Active Sessions Table Card -->
    <div class="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">

        <div class="px-md py-sm border-b border-outline-variant bg-slate-50">
          <h3 class="font-h3 text-h3 text-on-background">Active Sessions</h3>
        </div>

        <!-- Loading -->
        <div v-if="loading && activeSessions.length === 0" class="flex items-center justify-center py-16 text-slate-400">
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          <span class="text-sm">Loading sessions…</span>
        </div>

        <!-- No router selected -->
        <div v-else-if="!activeRouter" class="flex items-center justify-center py-16 text-slate-400">
          <span class="material-symbols-outlined mr-2">router</span>
          <span class="text-sm">Select a router to view hotspot sessions</span>
        </div>

        <!-- Table -->
        <table v-else class="w-full border-collapse">
          <thead class="bg-slate-50 border-b border-outline-variant text-left">
            <tr>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">User</th>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Session ID</th>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">MAC Address</th>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">IP Address</th>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Session Time</th>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Login By</th>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Server</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="session in paginatedActiveSessions"
              :key="session.session_id"
              class="group hover:bg-slate-50/80 transition-colors"
            >
              <td class="px-md py-4 font-mono-label text-slate-700">
                {{ session.user }}
              </td>

              <td class="px-md py-4 font-mono-label text-slate-700">
                {{ session.session_id || '—' }}
              </td>

              <!-- MAC Address -->
              <td class="px-md py-4 font-mono-label text-slate-700">
                {{ session.mac_address || '—' }}
              </td>

              <!-- IP Address -->
              <td class="px-md py-4 font-mono-label text-on-surface-variant">
                {{ session.address || '—' }}
              </td>

              <!-- Session Time -->
              <td class="px-md py-4">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getUptimeBadgeClass(session.uptime)"
                >
                  {{ session.uptime ? formatUptime(session.uptime) : '—' }}
                </span>
              </td>

              <td class="px-md py-4">
                <span class="font-body-sm text-on-surface">{{ session.login_by || '—' }}</span>
              </td>

              <td class="px-md py-4">
                <span class="font-body-sm text-on-surface">{{ session.server || '—' }}</span>
              </td>
            </tr>

            <tr v-if="activeSessions.length === 0 && !loading">
              <td colspan="7" class="px-md py-12 text-center text-sm text-on-surface-variant">
                No active hotspot sessions on this router
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="activeSessions.length > 0" class="px-md py-4 bg-slate-50 border-t border-outline-variant flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span class="font-body-sm text-on-surface-variant">
          Showing <span class="font-bold text-on-surface">{{ activePaginationStart }}–{{ activePaginationEnd }}</span>
          of <span class="font-bold text-on-surface">{{ activeSessions.length.toLocaleString() }}</span> sessions
        </span>
        <div class="flex items-center gap-2 flex-wrap">
          <button
            class="p-1 border border-outline-variant rounded bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="activeCurrentPage === 1"
            @click="activeCurrentPage--"
          >
            <span class="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span class="font-body-sm text-on-surface-variant">
            Page
            <input
              v-model.number="activePageInput"
              class="w-10 text-center border border-outline-variant rounded px-1 py-0.5 mx-1 font-body-sm"
              min="1"
              :max="activeTotalPages"
              type="number"
              @change="goToActivePage(activePageInput)"
              @keydown.enter="goToActivePage(activePageInput)"
            />
            of {{ activeTotalPages }}
          </span>
          <button
            class="p-1 border border-outline-variant rounded bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="activeCurrentPage === activeTotalPages"
            @click="activeCurrentPage++"
          >
            <span class="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Hotspot Users / Purchases Table -->
    <div class="mt-lg bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div class="px-md py-sm border-b border-outline-variant bg-slate-50">
        <h3 class="font-h3 text-h3 text-on-background">Hotspot Purchases</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead class="bg-slate-50 border-b border-outline-variant text-left">
            <tr>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">ID</th>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Phone Number</th>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Amount</th>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">OTP</th>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Expires At</th>
              <th class="px-md py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Created At</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="u in paginatedHotspotUsers" :key="u.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="px-md py-4 font-mono-label text-slate-700">{{ u.id }}</td>
              <td class="px-md py-4 font-body-sm text-on-surface">{{ u.phone_number || '—' }}</td>
              <td class="px-md py-4 font-body-sm font-semibold text-on-background">KES {{ u.amount.toLocaleString() }}</td>
              <td class="px-md py-4 font-mono-label text-slate-700">{{ u.otp || '—' }}</td>
              <td class="px-md py-4 font-body-sm text-on-surface-variant">{{ formatDateTime(u.expires_at) }}</td>
              <td class="px-md py-4 font-body-sm text-on-surface-variant">{{ formatDateTime(u.created_at) }}</td>
            </tr>

            <tr v-if="hotspotUsers.length === 0 && !loading">
              <td colspan="6" class="px-md py-12 text-center text-sm text-on-surface-variant">
                No hotspot purchases for this router
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="hotspotUsers.length > 0" class="px-md py-4 bg-slate-50 border-t border-outline-variant flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span class="font-body-sm text-on-surface-variant">
          Showing <span class="font-bold text-on-surface">{{ usersPaginationStart }}–{{ usersPaginationEnd }}</span>
          of <span class="font-bold text-on-surface">{{ hotspotUsers.length.toLocaleString() }}</span> purchases
        </span>
        <div class="flex items-center gap-2 flex-wrap">
          <button
            class="p-1 border border-outline-variant rounded bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="usersCurrentPage === 1"
            @click="usersCurrentPage--"
          >
            <span class="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span class="font-body-sm text-on-surface-variant">
            Page
            <input
              v-model.number="usersPageInput"
              class="w-10 text-center border border-outline-variant rounded px-1 py-0.5 mx-1 font-body-sm"
              min="1"
              :max="usersTotalPages"
              type="number"
              @change="goToUsersPage(usersPageInput)"
              @keydown.enter="goToUsersPage(usersPageInput)"
            />
            of {{ usersTotalPages }}
          </span>
          <button
            class="p-1 border border-outline-variant rounded bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="usersCurrentPage === usersTotalPages"
            @click="usersCurrentPage++"
          >
            <span class="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Bento Section -->
    <div class="mt-lg grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-lg">

      <!-- Automated Session Mitigation -->
      <div class="bg-slate-900 text-white p-lg rounded-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-lg">
        <div class="max-w-md">
          <h3 class="text-h2 font-h2 mb-2">Automated Session Mitigation</h3>
          <p class="text-slate-400 text-body-md mb-4">
            The system has flagged sessions with unusual data patterns. Use the 'Kill Session' action to immediately terminate suspicious traffic.
          </p>
          <button class="bg-white text-slate-900 px-md py-2 rounded-lg font-body-md font-semibold hover:bg-slate-100 transition-all">
            Review Flagged Sessions
          </button>
        </div>
        <div class="hidden lg:block h-32 w-32 opacity-20">
          <span class="material-symbols-outlined text-[128px]">security</span>
        </div>
      </div>

      <!-- Load Statistics -->
      <div class="bg-secondary p-lg rounded-xl text-white relative overflow-hidden group">
        <h3 class="text-h3 font-h3 mb-2 relative z-10">Load Statistics</h3>
        <p class="text-blue-100 text-body-sm mb-4 relative z-10">
          Active: {{ activeSessions.length }} session{{ activeSessions.length !== 1 ? 's' : '' }}
        </p>
        <div class="flex items-end gap-1 h-12 relative z-10">
          <div class="w-2 bg-white/30 h-1/2 rounded-t"></div>
          <div class="w-2 bg-white/50 h-3/4 rounded-t"></div>
          <div class="w-2 bg-white/70 h-full rounded-t"></div>
          <div class="w-2 bg-white/50 h-2/3 rounded-t"></div>
          <div class="w-2 bg-white/90 h-5/6 rounded-t"></div>
          <div class="w-2 bg-white/40 h-1/3 rounded-t"></div>
        </div>
        <span class="material-symbols-outlined absolute -bottom-4 -right-4 text-[96px] text-white/10 group-hover:scale-110 transition-transform">insights</span>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
interface ActiveHotspotSession {
  user: number
  address?: string
  mac_address?: string
  uptime?: string
  session_id: string
  login_by?: string
  server?: string
}

interface HotspotUser {
  id: number
  phone_number: string | null
  amount: number
  otp: string | null
  expires_at: string | null
  created_at: string
  router_id: number
}

const { token } = useAuth()
const config = useRuntimeConfig()
const { activeRouter } = useRouterStore()

const activeSessions = ref<ActiveHotspotSession[]>([])
const hotspotUsers = ref<HotspotUser[]>([])
const loading = ref(false)
const activeCurrentPage = ref(1)
const usersCurrentPage = ref(1)
const PAGE_SIZE = 25
const activePageInput = ref(1)
const usersPageInput = ref(1)

watch(activeCurrentPage, v => { activePageInput.value = v })
watch(usersCurrentPage, v => { usersPageInput.value = v })

function normalizeArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object') return [payload as T]
  return []
}

async function fetchData() {
  if (!activeRouter.value || !token.value) return
  loading.value = true
  try {
    const rid = activeRouter.value.id
    const [usersResp, activeResp] = await Promise.allSettled([
      $fetch<unknown>(`${config.public.apiBase}/hotspot_users?router_id=${rid}`, {
        headers: { Authorization: `Bearer ${token.value}` },
      }),
      $fetch<unknown>(`${config.public.apiBase}/hotspot_users/active?router_id=${rid}`, {
        headers: { Authorization: `Bearer ${token.value}` },
      }),
    ])

    hotspotUsers.value = usersResp.status === 'fulfilled' ? normalizeArray<HotspotUser>(usersResp.value) : []
    activeSessions.value = activeResp.status === 'fulfilled' ? normalizeArray<ActiveHotspotSession>(activeResp.value) : []
  } catch {
    hotspotUsers.value = []
    activeSessions.value = []
  } finally {
    loading.value = false
  }
}

watch(activeRouter, () => fetchData(), { immediate: true })

// ── Pagination ─────────────────────────────────────────────────────────────
const activeTotalPages = computed(() => Math.max(1, Math.ceil(activeSessions.value.length / PAGE_SIZE)))
const usersTotalPages = computed(() => Math.max(1, Math.ceil(hotspotUsers.value.length / PAGE_SIZE)))

const paginatedActiveSessions = computed(() => {
  const start = (activeCurrentPage.value - 1) * PAGE_SIZE
  return activeSessions.value.slice(start, start + PAGE_SIZE)
})

const paginatedHotspotUsers = computed(() => {
  const start = (usersCurrentPage.value - 1) * PAGE_SIZE
  return hotspotUsers.value.slice(start, start + PAGE_SIZE)
})

const activePaginationStart = computed(() =>
  activeSessions.value.length === 0 ? 0 : (activeCurrentPage.value - 1) * PAGE_SIZE + 1,
)
const activePaginationEnd = computed(() =>
  Math.min(activeCurrentPage.value * PAGE_SIZE, activeSessions.value.length),
)

const usersPaginationStart = computed(() =>
  hotspotUsers.value.length === 0 ? 0 : (usersCurrentPage.value - 1) * PAGE_SIZE + 1,
)
const usersPaginationEnd = computed(() =>
  Math.min(usersCurrentPage.value * PAGE_SIZE, hotspotUsers.value.length),
)

watch(activeSessions, () => { activeCurrentPage.value = 1 })
watch(hotspotUsers, () => { usersCurrentPage.value = 1 })

function goToActivePage(n: number) {
  activeCurrentPage.value = Math.max(1, Math.min(n, activeTotalPages.value))
}

function goToUsersPage(n: number) {
  usersCurrentPage.value = Math.max(1, Math.min(n, usersTotalPages.value))
}

// ── Stats ──────────────────────────────────────────────────────────────────
const totalRevenue = computed(() =>
  hotspotUsers.value.reduce((sum, u) => sum + (u.amount || 0), 0),
)

const avgSessionUptime = computed(() => {
  const uptimes = activeSessions.value
    .map(s => s.uptime)
    .filter((u): u is string => Boolean(u))
  if (uptimes.length === 0) return '—'
  const totalSeconds = uptimes.reduce((sum, u) => sum + parseUptimeToSeconds(u), 0)
  return formatSeconds(totalSeconds / uptimes.length)
})

// ── Uptime helpers ─────────────────────────────────────────────────────────
function parseUptimeToSeconds(uptime: string): number {
  let s = 0
  const w = uptime.match(/(\d+)w/); if (w) s += +w[1]! * 604800
  const d = uptime.match(/(\d+)d/); if (d) s += +d[1]! * 86400
  const h = uptime.match(/(\d+)h/); if (h) s += +h[1]! * 3600
  const m = uptime.match(/(\d+)m/); if (m) s += +m[1]! * 60
  const sec = uptime.match(/(\d+)s/); if (sec) s += +sec[1]!
  return s
}

function formatUptime(uptime: string): string {
  return formatSeconds(parseUptimeToSeconds(uptime))
}

function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}m ${String(s % 60).padStart(2, '0')}s`
}

function getUptimeBadgeClass(uptime?: string): string {
  if (!uptime) return 'bg-slate-100 text-slate-600'
  const s = parseUptimeToSeconds(uptime)
  if (s < 600) return 'bg-orange-50 text-orange-700'      // < 10 min — new session
  if (s < 3600) return 'bg-blue-50 text-blue-700'          // < 1h
  if (s > 86400 * 3) return 'bg-emerald-50 text-emerald-700' // 3+ days — long session
  return 'bg-blue-50 text-blue-700'
}

function formatDateTime(v?: string | null): string {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}
</script>
