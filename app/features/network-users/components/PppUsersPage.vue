<!--
  PppUsersPage.vue — Pixel-perfect from Stitch "PPP Users"
  Source: projects/13247784430269981727/screens/32fcd50011e244b4a922e8723ff545f6
  DO NOT redesign. Pixel-perfect match required.
-->
<template>
  <div class="p-lg max-w-container-max mx-auto">

    <!-- Header -->
    <header class="mb-xl flex items-center justify-between">
      <div>
        <h2 class="font-h1 text-h1 text-on-background">PPP User Management</h2>
        <p class="font-body-md text-on-surface-variant">Administer active Point-to-Point protocol sessions and subscribers.</p>
      </div>
      <div class="flex gap-3">
        <button class="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-h3 text-h3 hover:opacity-90 transition-opacity">
          <span class="material-symbols-outlined text-[20px]">add</span>
          New User
        </button>
      </div>
    </header>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-lg mb-xl">

      <!-- Total Active -->
      <div class="bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm">
        <div class="flex justify-between items-start mb-sm">
          <span class="text-body-sm font-table-header text-on-surface-variant uppercase tracking-wider">Total Active</span>
          <span class="text-emerald-600 text-body-sm font-bold flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">trending_up</span>
            Live
          </span>
        </div>
        <div class="font-display text-display text-primary" style="font-size:36px;line-height:44px;font-weight:700;letter-spacing:-0.02em;">
          <template v-if="loading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:36px;line-height:44px;">progress_activity</span></template>
          <template v-else>{{ activeSessions.length.toLocaleString() }}</template>
        </div>
        <div class="mt-base h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-secondary w-3/4"></div>
        </div>
      </div>

      <!-- Pending Disconnect -->
      <div class="bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm">
        <div class="flex justify-between items-start mb-sm">
          <span class="text-body-sm font-table-header text-on-surface-variant uppercase tracking-wider">Pending Disconnect</span>
          <span class="text-on-surface-variant text-body-sm font-bold">Stable</span>
        </div>
        <div class="font-display text-display text-primary">{{ expiringCount }}</div>
        <div class="mt-base h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-on-surface-variant w-1/4"></div>
        </div>
      </div>

      <!-- Total Users -->
      <div class="bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm">
        <div class="flex justify-between items-start mb-sm">
          <span class="text-body-sm font-table-header text-on-surface-variant uppercase tracking-wider">Total Users</span>
          <span class="text-emerald-600 text-body-sm font-bold">Total</span>
        </div>
        <div class="font-display text-display text-primary" style="font-size:36px;line-height:44px;font-weight:700;letter-spacing:-0.02em;">
          <template v-if="loading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:36px;line-height:44px;">progress_activity</span></template>
          <template v-else>{{ users.length.toLocaleString() }}</template>
        </div>
        <div class="mt-base h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-secondary-container w-5/6"></div>
        </div>
      </div>

      <!-- Peak Traffic -->
      <div class="bg-surface-container-lowest border border-outline-variant p-md rounded-xl shadow-sm">
        <div class="flex justify-between items-start mb-sm">
          <span class="text-body-sm font-table-header text-on-surface-variant uppercase tracking-wider">Peak Traffic</span>
          <span class="text-secondary text-body-sm font-bold">Today</span>
        </div>
        <div class="font-display text-display text-primary">—</div>
        <div class="mt-base h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-tertiary-container w-1/2"></div>
        </div>
      </div>

    </div>

    <!-- Active PPP Sessions (First Table) -->
    <section class="bg-white border border-outline-variant rounded-xl overflow-hidden mb-lg">
      <div class="px-md py-sm bg-slate-50 border-b border-outline-variant">
        <h3 class="font-h3 text-h3 text-on-background">Active PPP Sessions</h3>
      </div>

      <div class="overflow-x-auto">

        <!-- Loading -->
        <div v-if="loading && activeSessions.length === 0" class="flex items-center justify-center py-16 text-slate-400">
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          <span class="text-sm">Loading active sessions…</span>
        </div>

        <!-- No router selected -->
        <div v-else-if="!activeRouter" class="flex items-center justify-center py-16 text-slate-400">
          <span class="material-symbols-outlined mr-2">router</span>
          <span class="text-sm">Select a router to view active PPP sessions</span>
        </div>

        <!-- Table -->
        <table v-else class="w-full border-collapse text-left">
          <thead class="bg-slate-50 border-y border-outline-variant">
            <tr>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">User</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Session ID</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Address</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Session Time</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Login By</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Server</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <tr v-for="session in paginatedActiveSessions" :key="getSessionKey(session)" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-md py-md font-body-md text-on-surface font-semibold">{{ getActiveUserLabel(session) }}</td>
              <td class="px-md py-md font-mono-label text-on-surface-variant">{{ session.session_id || '—' }}</td>
              <td class="px-md py-md font-mono-label text-on-surface-variant">{{ session.address || '—' }}</td>
              <td class="px-md py-md">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getUptimeBadgeClass(session.uptime)">
                  {{ session.uptime ? formatUptime(session.uptime) : '—' }}
                </span>
              </td>
              <td class="px-md py-md font-body-md text-on-surface-variant">{{ session.login_by || '—' }}</td>
              <td class="px-md py-md font-body-md text-on-surface-variant">{{ session.server || '—' }}</td>
            </tr>

            <tr v-if="activeSessions.length === 0 && !loading">
              <td colspan="6" class="px-md py-12 text-center text-sm text-on-surface-variant">
                No active PPP sessions for this router
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Active Sessions Pagination -->
      <div v-if="activeSessions.length > 0" class="px-md py-sm bg-slate-50 border-t border-outline-variant flex items-center justify-between">
        <span class="font-body-sm text-on-surface-variant">
          Showing <span class="font-bold text-on-surface">{{ activePaginationStart }}–{{ activePaginationEnd }}</span>
          of <span class="font-bold text-on-surface">{{ activeSessions.length.toLocaleString() }}</span> sessions
        </span>
        <div class="flex gap-2 items-center">
          <button
            class="p-1 border border-outline-variant rounded bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="activeCurrentPage === 1"
            @click="activeCurrentPage--"
          >
            <span class="material-symbols-outlined text-sm block">chevron_left</span>
          </button>
          <div class="flex gap-1 items-center px-2 font-mono-label text-[11px] text-on-surface">
            Page
            <input
              v-model.number="activePageInput"
              class="w-8 h-6 text-center border border-outline-variant rounded p-0 text-[11px] ml-1"
              type="text"
              @blur="goToActivePage(activePageInput)"
              @keydown.enter="goToActivePage(activePageInput)"
            />
            of {{ activeTotalPages.toLocaleString() }}
          </div>
          <button
            class="p-1 border border-outline-variant rounded bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="activeCurrentPage === activeTotalPages"
            @click="activeCurrentPage++"
          >
            <span class="material-symbols-outlined text-sm block">chevron_right</span>
          </button>
        </div>
      </div>
    </section>

    <!-- PPP Subscribers (Second Table) -->
    <section class="bg-white border border-outline-variant rounded-t-xl px-md py-sm">
      <h3 class="font-h3 text-h3 text-on-background">PPP Subscribers</h3>
    </section>

    <!-- Filter Bar -->
    <section class="bg-white border border-outline-variant rounded-t-xl p-md flex flex-wrap items-center gap-md">
      <div class="flex-1 min-w-[300px]">
        <div class="relative group">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">person_search</span>
          <input
            v-model="searchQuery"
            class="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg font-body-md text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
            placeholder="Search by username or IP address..."
            type="text"
            @input="currentPage = 1"
          />
        </div>
      </div>
      <div class="flex items-center gap-sm">
        <button
          class="flex items-center gap-2 px-md py-2 bg-white border border-outline-variant text-on-surface font-body-md rounded-lg hover:bg-slate-50 transition-all"
          :class="{ 'border-secondary text-secondary bg-surface-container-low': planFilter || statusFilter }"
          @click="showFilters = !showFilters"
        >
          <span class="material-symbols-outlined text-[18px]">filter_list</span>
          Filters
          <span v-if="planFilter || statusFilter" class="ml-1 w-2 h-2 rounded-full bg-secondary"></span>
        </button>
      </div>
    </section>

    <!-- Filter Drawer Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="showFilters"
        class="fixed inset-0 bg-black/20 z-40"
        @click="showFilters = false"
      />
    </Transition>

    <!-- Filter Drawer -->
    <Transition name="drawer">
      <aside
        v-if="showFilters"
        class="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
      >
        <!-- Drawer Header -->
        <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-secondary">filter_list</span>
            <h3 class="font-h3 text-h3 text-on-background">Filter Users</h3>
          </div>
          <button
            class="p-1.5 hover:bg-slate-100 rounded-lg text-on-surface-variant transition-colors"
            @click="showFilters = false"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Drawer Body -->
        <div class="flex-1 overflow-y-auto px-lg py-lg space-y-lg">

          <!-- Service Plan -->
          <div>
            <label class="block font-table-header text-table-header text-on-surface-variant uppercase tracking-wider mb-sm">
              Service Plan
            </label>
            <div class="space-y-xs">
              <label
                class="flex items-center gap-3 px-md py-sm rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                :class="planFilter === '' ? 'bg-surface-container-low' : ''"
              >
                <input v-model="planFilter" class="accent-secondary" type="radio" value="" @change="currentPage = 1" />
                <span class="font-body-md text-on-surface">All Plans</span>
              </label>
              <label
                v-for="plan in uniquePlans"
                :key="plan"
                class="flex items-center gap-3 px-md py-sm rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                :class="planFilter === plan ? 'bg-surface-container-low' : ''"
              >
                <input v-model="planFilter" class="accent-secondary" type="radio" :value="plan" @change="currentPage = 1" />
                <span class="font-body-md text-on-surface">{{ plan }}</span>
              </label>
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="block font-table-header text-table-header text-on-surface-variant uppercase tracking-wider mb-sm">
              Status
            </label>
            <div class="space-y-xs">
              <label
                v-for="opt in statusOptions"
                :key="opt.value"
                class="flex items-center gap-3 px-md py-sm rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                :class="statusFilter === opt.value ? 'bg-surface-container-low' : ''"
              >
                <input v-model="statusFilter" class="accent-secondary" type="radio" :value="opt.value" @change="currentPage = 1" />
                <span class="w-2 h-2 rounded-full" :class="opt.dot"></span>
                <span class="font-body-md text-on-surface">{{ opt.label }}</span>
              </label>
            </div>
          </div>

        </div>

        <!-- Drawer Footer -->
        <div class="px-lg py-md border-t border-outline-variant flex gap-sm">
          <button
            class="flex-1 flex items-center justify-center gap-2 px-md py-2 border border-outline-variant text-on-surface font-body-md rounded-lg hover:bg-slate-50 transition-all"
            @click="planFilter = ''; statusFilter = ''; currentPage = 1"
          >
            <span class="material-symbols-outlined text-[18px]">filter_list_off</span>
            Clear
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-2 px-md py-2 bg-primary text-on-primary font-body-md rounded-lg hover:opacity-90 transition-all"
            @click="showFilters = false"
          >
            <span class="material-symbols-outlined text-[18px]">check</span>
            Apply
          </button>
        </div>
      </aside>
    </Transition>

    <!-- Data Table -->
    <section class="bg-white border-x border-b border-outline-variant rounded-b-xl overflow-hidden">
      <div class="overflow-x-auto">

        <!-- Loading -->
        <div v-if="loading && users.length === 0" class="flex items-center justify-center py-16 text-slate-400">
          <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          <span class="text-sm">Loading users…</span>
        </div>

        <!-- No router selected -->
        <div v-else-if="!activeRouter" class="flex items-center justify-center py-16 text-slate-400">
          <span class="material-symbols-outlined mr-2">router</span>
          <span class="text-sm">Select a router to view PPP users</span>
        </div>

        <!-- Table -->
        <table v-else class="w-full border-collapse text-left">
          <thead class="bg-slate-50 border-y border-outline-variant">
            <tr>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Subscriber Name</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Service Plan</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Mobile</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Status</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Expires</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <tr
              v-for="user in paginatedUsers"
              :key="user.id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <!-- Subscriber Name -->
              <td class="px-md py-md">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    :class="[getAvatarColor(user.name).bg, getAvatarColor(user.name).text]"
                  >
                    {{ getInitials(user.name) }}
                  </div>
                  <div class="min-w-0">
                    <div class="font-body-md text-on-surface font-semibold truncate">{{ user.pppoe_username }}</div>
                    <div class="font-body-sm text-on-surface-variant truncate">{{ user.name }}</div>
                  </div>
                </div>
              </td>
              <!-- Service Plan -->
              <td class="px-md py-md">
                <span class="px-2 py-1 bg-surface-container text-on-secondary-container rounded font-mono-label text-[11px]">
                  {{ user.profile || '—' }}
                </span>
              </td>
              <!-- Mobile -->
              <td class="px-md py-md font-mono-label text-on-surface-variant">{{ user.mobile_number || '—' }}</td>
              <!-- Status -->
              <td class="px-md py-md">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" :class="getUserStatusDot(user.expires_on)"></span>
                  <span class="font-body-md" :class="getUserStatusText(user.expires_on)">{{ getUserStatusLabel(user.expires_on) }}</span>
                </div>
              </td>
              <!-- Expires -->
              <td class="px-md py-md font-body-md text-on-surface-variant">
                {{ user.expires_on ? formatDate(user.expires_on) : '—' }}
              </td>
              <!-- Actions -->
              <td class="px-md py-md text-right">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="p-1.5 text-secondary hover:bg-surface-container rounded transition-all" title="Edit User">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button class="p-1.5 text-error hover:bg-error-container rounded transition-all" title="Disconnect">
                    <span class="material-symbols-outlined text-[20px]">power_off</span>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredUsers.length === 0 && !loading">
              <td colspan="6" class="px-md py-12 text-center text-sm text-on-surface-variant">
                {{ searchQuery || planFilter || statusFilter ? 'No users match your filters' : 'No PPP users found for this router' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredUsers.length > 0" class="px-md py-sm bg-slate-50 border-t border-outline-variant flex items-center justify-between">
        <span class="font-body-sm text-on-surface-variant">
          Showing <span class="font-bold text-on-surface">{{ paginationStart }}–{{ paginationEnd }}</span>
          of <span class="font-bold text-on-surface">{{ filteredUsers.length.toLocaleString() }}</span> users
        </span>
        <div class="flex gap-2 items-center">
          <button
            class="p-1 border border-outline-variant rounded bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <span class="material-symbols-outlined text-sm block">chevron_left</span>
          </button>
          <div class="flex gap-1 items-center px-2 font-mono-label text-[11px] text-on-surface">
            Page
            <input
              v-model.number="pageInput"
              class="w-8 h-6 text-center border border-outline-variant rounded p-0 text-[11px] ml-1"
              type="text"
              @blur="goToPage(pageInput)"
              @keydown.enter="goToPage(pageInput)"
            />
            of {{ totalPages.toLocaleString() }}
          </div>
          <button
            class="p-1 border border-outline-variant rounded bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <span class="material-symbols-outlined text-sm block">chevron_right</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Bottom section -->
    <section class="mt-xl grid grid-cols-1 lg:grid-cols-3 gap-lg" style="grid-template-columns: 2fr 1fr">
      <div class="lg:col-span-2 bg-primary-container p-lg rounded-xl text-on-primary flex items-center gap-lg">
        <div class="flex-1">
          <h3 class="font-h2 text-h2 mb-xs">Manage High-Traffic Profiles</h3>
          <p class="font-body-md opacity-80 max-w-lg">Identified profiles consuming over 80% of bandwidth. Consider reviewing their traffic shaping rules or upgrading their service plan.</p>
        </div>
        <button class="px-4 py-2 border border-white/20 rounded-lg font-h3 text-h3 hover:bg-white/10 transition-colors shrink-0">View Report</button>
      </div>
      <div class="bg-surface-container-high p-lg rounded-xl flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-sm text-secondary">
            <span class="material-symbols-outlined text-sm">info</span>
            <span class="font-mono-label uppercase tracking-widest text-[10px]">Quick Tip</span>
          </div>
          <h3 class="font-h3 text-h3 text-on-background mb-xs">Keyboard Shortcuts</h3>
          <p class="font-body-sm text-on-surface-variant">
            Press <kbd class="px-1 bg-white border border-outline-variant rounded shadow-sm">⌘</kbd> +
            <kbd class="px-1 bg-white border border-outline-variant rounded shadow-sm">K</kbd>
            to jump to global search instantly.
          </p>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
interface PppUser {
  id: number
  name: string
  email: string
  pppoe_username: string
  mobile_number: string
  location: string
  apartment: string
  profile: string
  created_at: string
  expires_on: string | null
  router_id: number
}

interface PppActiveSession {
  user?: number | string
  name?: string
  pppoe_username?: string
  address?: string
  uptime?: string
  session_id?: string
  login_by?: string
  server?: string
  [key: string]: unknown
}

const { token } = useAuth()
const config = useRuntimeConfig()
const { activeRouter } = useRouterStore()

const users = ref<PppUser[]>([])
const activeSessions = ref<PppActiveSession[]>([])
const loading = ref(false)
const searchQuery = ref('')
const planFilter = ref('')
const statusFilter = ref('')
const showFilters = ref(false)
const currentPage = ref(1)
const activeCurrentPage = ref(1)

const statusOptions = [
  { value: '', label: 'All Statuses', dot: 'bg-slate-300' },
  { value: 'active', label: 'Active', dot: 'bg-emerald-500' },
  { value: 'expiring', label: 'Expiring Soon', dot: 'bg-amber-500' },
  { value: 'expired', label: 'Expired', dot: 'bg-slate-300' },
]
const PAGE_SIZE = 25
const pageInput = ref(1)
const activePageInput = ref(1)

watch(currentPage, v => { pageInput.value = v })
watch(activeCurrentPage, v => { activePageInput.value = v })

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
      $fetch<unknown>(`${config.public.apiBase}/ppp_users`, {
        params: { router_id: rid },
        headers: { Authorization: `Bearer ${token.value}` },
      }),
      $fetch<unknown>(`${config.public.apiBase}/ppp_users/active`, {
        params: { router_id: rid },
        headers: { Authorization: `Bearer ${token.value}` },
      }),
    ])
    users.value = usersResp.status === 'fulfilled' ? normalizeArray<PppUser>(usersResp.value) : []
    activeSessions.value = activeResp.status === 'fulfilled' ? normalizeArray<PppActiveSession>(activeResp.value) : []
  } catch {
    users.value = []
    activeSessions.value = []
  } finally {
    loading.value = false
  }
}

watch(activeRouter, () => fetchData(), { immediate: true })

// ── Status helpers ─────────────────────────────────────────────────────────
function getUserStatus(expiresOn: string | null): 'active' | 'expired' | 'expiring' {
  if (!expiresOn) return 'active'
  const exp = new Date(expiresOn)
  const now = new Date()
  if (exp < now) return 'expired'
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days
  if (exp < soon) return 'expiring'
  return 'active'
}

function getUserStatusDot(expiresOn: string | null) {
  const s = getUserStatus(expiresOn)
  if (s === 'active') return 'bg-emerald-500 animate-pulse'
  if (s === 'expiring') return 'bg-amber-500'
  return 'bg-slate-300'
}

function getUserStatusText(expiresOn: string | null) {
  const s = getUserStatus(expiresOn)
  if (s === 'active') return 'text-on-surface'
  if (s === 'expiring') return 'text-amber-700'
  return 'text-on-surface-variant'
}

function getUserStatusLabel(expiresOn: string | null) {
  const s = getUserStatus(expiresOn)
  if (s === 'active') return 'Active'
  if (s === 'expiring') return 'Expiring'
  return 'Expired'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Filtering ──────────────────────────────────────────────────────────────
const filteredUsers = computed(() => {
  let result = users.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.pppoe_username.toLowerCase().includes(q) ||
      u.mobile_number.includes(q),
    )
  }
  if (planFilter.value) {
    result = result.filter(u => u.profile === planFilter.value)
  }
  if (statusFilter.value) {
    result = result.filter(u => getUserStatus(u.expires_on) === statusFilter.value)
  }
  return result
})

const uniquePlans = computed(() => {
  const plans = new Set(users.value.map(u => u.profile).filter(Boolean))
  return [...plans]
})

// ── Pagination ─────────────────────────────────────────────────────────────
const activeTotalPages = computed(() => Math.max(1, Math.ceil(activeSessions.value.length / PAGE_SIZE)))

const paginatedActiveSessions = computed(() => {
  const start = (activeCurrentPage.value - 1) * PAGE_SIZE
  return activeSessions.value.slice(start, start + PAGE_SIZE)
})

const activePaginationStart = computed(() =>
  activeSessions.value.length === 0 ? 0 : (activeCurrentPage.value - 1) * PAGE_SIZE + 1,
)
const activePaginationEnd = computed(() =>
  Math.min(activeCurrentPage.value * PAGE_SIZE, activeSessions.value.length),
)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / PAGE_SIZE)))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredUsers.value.slice(start, start + PAGE_SIZE)
})

const paginationStart = computed(() =>
  filteredUsers.value.length === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1,
)
const paginationEnd = computed(() =>
  Math.min(currentPage.value * PAGE_SIZE, filteredUsers.value.length),
)

watch(filteredUsers, () => { currentPage.value = 1 })
watch(activeSessions, () => { activeCurrentPage.value = 1 })

function goToActivePage(n: number) {
  activeCurrentPage.value = Math.max(1, Math.min(n, activeTotalPages.value))
}

function goToPage(n: number) {
  currentPage.value = Math.max(1, Math.min(n, totalPages.value))
}

// ── Stats ─────────────────────────────────────────────────────────────────
const expiringCount = computed(() => users.value.filter(u => getUserStatus(u.expires_on) === 'expiring').length)

// ── Active session helpers ────────────────────────────────────────────────
function getSessionKey(session: PppActiveSession): string {
  const parts = [
    session.session_id,
    session.pppoe_username,
    session.name,
    String(session.user ?? ''),
    session.address,
  ].filter(Boolean)
  return parts.join('|') || Math.random().toString(36).slice(2)
}

function getActiveUserLabel(session: PppActiveSession): string {
  return session.pppoe_username || session.name || String(session.user ?? '—')
}

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
  const s = parseUptimeToSeconds(uptime)
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
  if (s < 600) return 'bg-orange-50 text-orange-700'
  if (s < 3600) return 'bg-blue-50 text-blue-700'
  if (s > 86400 * 3) return 'bg-emerald-50 text-emerald-700'
  return 'bg-blue-50 text-blue-700'
}

// ── Avatar ─────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
]

function getAvatarColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0x7fffffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}

function getInitials(name: string): string {
  const parts = name.split(/[_\s-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
</script>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
