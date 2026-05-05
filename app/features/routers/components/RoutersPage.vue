<template>
  <div class="p-md sm:p-lg">

    <!-- Page Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-xl">
      <div>
        <h1 class="font-h1 text-h1 text-on-background">Routers &amp; Configuration</h1>
        <p class="font-body-md text-body-md text-on-surface-variant mt-1">
          Manage core infrastructure, hardware health, and connectivity.
        </p>
      </div>
      <div class="flex w-full sm:w-auto items-center gap-sm flex-col sm:flex-row">
        <button
          class="w-full sm:w-auto justify-center flex items-center gap-1.5 border border-outline-variant text-on-surface px-md py-2 rounded-lg font-body-sm font-semibold hover:bg-slate-100 transition-colors"
          @click="pingAll"
        >
          <span class="material-symbols-outlined text-[16px]" :class="pinging ? 'animate-spin text-secondary' : ''">wifi_tethering</span>
          Ping All
        </button>
        <button
          class="w-full sm:w-auto justify-center flex items-center gap-1.5 bg-primary text-on-primary px-md py-2 rounded-lg font-body-sm font-semibold hover:opacity-90 transition-all"
          @click="openAddModal"
        >
          <span class="material-symbols-outlined text-[16px]">add</span>
          Provision Router
        </button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg mb-xl">

      <div class="bg-white p-md border border-slate-200 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Total Routers</span>
          <span class="material-symbols-outlined text-on-surface-variant">router</span>
        </div>
        <p class="font-h1 text-h1 font-bold text-on-background">
          <template v-if="loading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:24px">progress_activity</span></template>
          <template v-else>{{ routers.length }}</template>
        </p>
      </div>

      <div class="bg-white p-md border border-slate-200 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Online</span>
          <span class="material-symbols-outlined text-emerald-500">check_circle</span>
        </div>
        <p class="font-h1 text-h1 font-bold text-on-background">
          <template v-if="pinging"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:24px">progress_activity</span></template>
          <template v-else>{{ pingStats.online ?? '—' }}</template>
        </p>
      </div>

      <div class="bg-white p-md border border-slate-200 rounded-xl flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Offline</span>
          <span class="material-symbols-outlined text-error">error_outline</span>
        </div>
        <p class="font-h1 text-h1 font-bold text-on-background">
          <template v-if="pinging"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:24px">progress_activity</span></template>
          <template v-else>{{ pingStats.offline ?? '—' }}</template>
        </p>
      </div>

    </div>

    <!-- Connected Hardware Table -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-lg">
      <div class="flex items-center justify-between px-md py-sm border-b border-slate-200 bg-slate-50">
        <h3 class="font-h3 text-h3 text-on-background">Connected Hardware</h3>
        <span class="text-[11px] text-slate-400 flex items-center gap-1">
          <span class="material-symbols-outlined text-[14px]">sync</span>
          Auto-refresh: 30s
        </span>
      </div>

      <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse min-w-[980px]">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest">Router Name</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest">IP Address</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest">Port</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest">Username</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest">Latency</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest">Status</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest">Last Updated</th>
            <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-widest text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">

          <!-- Loading -->
          <template v-if="loading">
            <tr v-for="i in 3" :key="i" class="animate-pulse">
              <td class="px-md py-3"><div class="h-4 bg-slate-100 rounded w-32"></div></td>
              <td class="px-md py-3"><div class="h-4 bg-slate-100 rounded w-28"></div></td>
              <td class="px-md py-3"><div class="h-4 bg-slate-100 rounded w-12"></div></td>
              <td class="px-md py-3"><div class="h-4 bg-slate-100 rounded w-16"></div></td>
              <td class="px-md py-3"><div class="h-4 bg-slate-100 rounded w-16"></div></td>
              <td class="px-md py-3"><div class="h-5 bg-slate-100 rounded-full w-20"></div></td>
              <td class="px-md py-3"><div class="h-4 bg-slate-100 rounded w-24"></div></td>
              <td class="px-md py-3"></td>
            </tr>
          </template>

          <!-- Data rows -->
          <template v-else>
            <tr
              v-for="router in routers"
              :key="router.id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <!-- Name -->
              <td class="px-md py-3">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px] text-secondary">router</span>
                  <span class="font-body-md font-semibold text-on-background">{{ router.name }}</span>
                </div>
              </td>

              <!-- IP -->
              <td class="px-md py-3">
                <code class="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[12px] text-slate-700">{{ router.ip_address }}</code>
              </td>

              <!-- Port -->
              <td class="px-md py-3">
                <span class="font-body-sm text-on-surface-variant">{{ router.port }}</span>
              </td>

              <!-- Username -->
              <td class="px-md py-3">
                <span class="font-body-sm text-on-surface">{{ router.username }}</span>
              </td>

              <!-- Latency -->
              <td class="px-md py-3">
                <span
                  v-if="pingMap[router.id] !== undefined"
                  class="font-body-sm"
                  :class="pingMap[router.id] === null ? 'text-slate-400' : pingMap[router.id]! > 200 ? 'text-amber-600' : 'text-emerald-600'"
                >
                  {{ pingMap[router.id] === null ? '—' : `${pingMap[router.id]!.toFixed(1)} ms` }}
                </span>
                <span v-else class="font-body-sm text-slate-300">—</span>
              </td>

              <!-- Status -->
              <td class="px-md py-3">
                <template v-if="onlineMap[router.id] !== undefined">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    :class="onlineMap[router.id] ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-error'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="onlineMap[router.id] ? 'bg-emerald-500' : 'bg-error'"></span>
                    {{ onlineMap[router.id] ? 'Online' : 'Offline' }}
                  </span>
                </template>
                <span v-else class="text-[11px] text-slate-300">Not pinged</span>
              </td>

              <!-- Updated -->
              <td class="px-md py-3">
                <span class="font-body-sm text-on-surface-variant">{{ formatDate(router.updated_at) }}</span>
              </td>

              <!-- Actions -->
              <td class="px-md py-3">
                <div class="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="p-1 hover:bg-secondary/10 rounded transition-colors"
                    title="Ping"
                    @click="pingSingle(router.id)"
                  >
                    <span class="material-symbols-outlined text-[16px] text-secondary">wifi_tethering</span>
                  </button>
                  <button
                    class="p-1 hover:bg-slate-200 rounded transition-colors"
                    title="Edit"
                    @click="openEditModal(router)"
                  >
                    <span class="material-symbols-outlined text-[16px] text-on-surface-variant">edit</span>
                  </button>
                  <button
                    class="p-1 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                    @click="confirmDelete(router)"
                  >
                    <span class="material-symbols-outlined text-[16px] text-error">delete_outline</span>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="routers.length === 0">
              <td colspan="8" class="px-md py-12 text-center font-body-md text-on-surface-variant">
                No routers provisioned yet.
              </td>
            </tr>
          </template>

        </tbody>
      </table>
      </div>
    </div>

    <!-- ── Add / Edit Modal ──────────────────────────────────────────────── -->
    <Transition name="modal">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-lg z-10 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-md">
            <h2 class="font-h2 text-h2 text-on-background">
              {{ isEditing ? 'Edit Router' : 'Provision Router' }}
            </h2>
            <button class="p-1 hover:bg-slate-100 rounded-lg" @click="closeModal">
              <span class="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>

          <div class="flex flex-col gap-md">

            <div>
              <label class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider block mb-1">Router Name *</label>
              <input
                v-model="form.name"
                class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-sm text-on-surface outline-none focus:border-secondary"
                placeholder="e.g. kimbo-ap"
              />
            </div>

            <div>
              <label class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider block mb-1">IP Address *</label>
              <input
                v-model="form.ip_address"
                class="w-full border border-outline-variant rounded-lg px-3 py-2 font-mono text-[13px] text-on-surface outline-none focus:border-secondary"
                placeholder="10.0.0.1"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div>
                <label class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider block mb-1">Port *</label>
                <input
                  v-model.number="form.port"
                  type="number"
                  class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-sm text-on-surface outline-none focus:border-secondary"
                  placeholder="8728"
                />
              </div>
              <div>
                <label class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider block mb-1">Username *</label>
                <input
                  v-model="form.username"
                  class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-sm text-on-surface outline-none focus:border-secondary"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider block mb-1">
                Password {{ isEditing ? '(leave blank to keep)' : '*' }}
              </label>
              <input
                v-model="form.password"
                type="password"
                class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-sm text-on-surface outline-none focus:border-secondary"
                placeholder="••••••••"
              />
            </div>

            <p v-if="modalError" class="text-[12px] text-error bg-error-container px-sm py-1.5 rounded-lg">{{ modalError }}</p>

          </div>

          <div class="flex justify-end gap-sm mt-lg">
            <button
              class="px-md py-2 rounded-lg border border-outline-variant font-body-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
              @click="closeModal"
            >
              Cancel
            </button>
            <button
              class="px-md py-2 rounded-lg bg-primary text-on-primary font-body-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              :disabled="saving"
              @click="saveRouter"
            >
              <span v-if="saving" class="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              {{ isEditing ? 'Save Changes' : 'Provision' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Delete Confirmation ───────────────────────────────────────────── -->
    <Transition name="modal">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showDeleteConfirm = false"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-lg z-10">
          <div class="flex items-center gap-3 mb-md">
            <div class="w-10 h-10 rounded-full bg-error-container flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-error">delete_forever</span>
            </div>
            <div>
              <h2 class="font-h3 text-h3 text-on-background">Delete Router</h2>
              <p class="font-body-sm text-on-surface-variant">This cannot be undone.</p>
            </div>
          </div>
          <p class="font-body-md text-on-surface mb-lg">
            Remove <strong>{{ deleteTarget?.name }}</strong> (<code class="font-mono text-[12px] bg-slate-100 px-1 rounded">{{ deleteTarget?.ip_address }}</code>) from the infrastructure?
          </p>
          <div class="flex justify-end gap-sm">
            <button
              class="px-md py-2 rounded-lg border border-outline-variant font-body-sm font-semibold text-on-surface hover:bg-slate-50 transition-colors"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </button>
            <button
              class="px-md py-2 rounded-lg bg-error text-on-error font-body-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              :disabled="deleting"
              @click="deleteRouter"
            >
              <span v-if="deleting" class="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              Delete
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
interface Router {
  id: number
  name: string
  ip_address: string
  port: number
  username: string
  owner_id: number
  created_at: string
  updated_at: string
}

interface PingResult {
  id: number
  name: string
  ip_address: string
  port: number
  online: boolean
  latency_ms: number
}

interface PingResponse {
  total: number
  online: number
  offline: number
  routers: PingResult[]
}

// ── Auth & config ──────────────────────────────────────────────────────────
const config = useRuntimeConfig()
const { token } = useAuth()

// ── State ──────────────────────────────────────────────────────────────────
const loading = ref(false)
const pinging = ref(false)
const saving = ref(false)
const deleting = ref(false)
const routers = ref<Router[]>([])
const pingStats = ref<{ online?: number; offline?: number }>({})
const pingMap = ref<Record<number, number | null>>({})
const onlineMap = ref<Record<number, boolean>>({})

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const modalError = ref('')
const editingId = ref<number | null>(null)
const form = ref({ name: '', ip_address: '', port: 8728, username: 'admin', password: '' })

// Delete state
const showDeleteConfirm = ref(false)
const deleteTarget = ref<Router | null>(null)

// ── Fetch routers ──────────────────────────────────────────────────────────
async function fetchRouters() {
  if (!token.value) return
  loading.value = true
  try {
    const data = await $fetch<Router[]>(`${config.public.apiBase}/routers`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    routers.value = Array.isArray(data) ? data : []
  } catch {
    routers.value = []
  } finally {
    loading.value = false
  }
}

// ── Ping all ───────────────────────────────────────────────────────────────
async function pingAll() {
  if (!token.value || routers.value.length === 0) return
  pinging.value = true
  try {
    const results = await Promise.allSettled(
      routers.value.map(r =>
        $fetch<PingResponse>(`${config.public.apiBase}/routers/ping?router_id=${r.id}`, {
          headers: { Authorization: `Bearer ${token.value}` },
        })
      )
    )
    let totalOnline = 0
    let totalOffline = 0
    results.forEach((res, idx) => {
      const rid = routers.value[idx].id
      if (res.status === 'fulfilled' && res.value?.routers?.length) {
        const pr = res.value.routers[0]
        onlineMap.value[rid] = pr.online
        pingMap.value[rid] = pr.online ? pr.latency_ms : null
        if (pr.online) totalOnline++
        else totalOffline++
      } else {
        onlineMap.value[rid] = false
        pingMap.value[rid] = null
        totalOffline++
      }
    })
    pingStats.value = { online: totalOnline, offline: totalOffline }
  } finally {
    pinging.value = false
  }
}

// ── Ping single ────────────────────────────────────────────────────────────
async function pingSingle(id: number) {
  if (!token.value) return
  try {
    const res = await $fetch<PingResponse>(`${config.public.apiBase}/routers/ping?router_id=${id}`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    if (res?.routers?.length) {
      const pr = res.routers[0]
      onlineMap.value[id] = pr.online
      pingMap.value[id] = pr.online ? pr.latency_ms : null
    }
  } catch {
    onlineMap.value[id] = false
    pingMap.value[id] = null
  }
}

// ── Modal helpers ──────────────────────────────────────────────────────────
function openAddModal() {
  isEditing.value = false
  editingId.value = null
  form.value = { name: '', ip_address: '', port: 8728, username: 'admin', password: '' }
  modalError.value = ''
  showModal.value = true
}

function openEditModal(router: Router) {
  isEditing.value = true
  editingId.value = router.id
  form.value = { name: router.name, ip_address: router.ip_address, port: router.port, username: router.username, password: '' }
  modalError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

// ── Save (create / update) ─────────────────────────────────────────────────
async function saveRouter() {
  if (!form.value.name.trim()) { modalError.value = 'Router name is required.'; return }
  if (!form.value.ip_address.trim()) { modalError.value = 'IP address is required.'; return }
  if (!isEditing.value && !form.value.password.trim()) { modalError.value = 'Password is required.'; return }

  saving.value = true
  modalError.value = ''
  try {
    const params = new URLSearchParams({
      name: form.value.name,
      ip_address: form.value.ip_address,
      port: String(form.value.port),
      username: form.value.username,
    })
    if (form.value.password) params.append('password', form.value.password)

    if (isEditing.value && editingId.value !== null) {
      await $fetch(`${config.public.apiBase}/router/${editingId.value}?${params.toString()}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token.value}` },
      })
    } else {
      await $fetch(`${config.public.apiBase}/router?${params.toString()}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
      })
    }
    closeModal()
    await fetchRouters()
  } catch (e: any) {
    modalError.value = e?.data?.detail?.[0]?.msg ?? e?.data?.detail ?? 'Failed to save router.'
  } finally {
    saving.value = false
  }
}

// ── Delete ─────────────────────────────────────────────────────────────────
function confirmDelete(router: Router) {
  deleteTarget.value = router
  showDeleteConfirm.value = true
}

async function deleteRouter() {
  if (!deleteTarget.value || !token.value) return
  deleting.value = true
  try {
    await $fetch(`${config.public.apiBase}/router/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` },
    })
    showDeleteConfirm.value = false
    deleteTarget.value = null
    await fetchRouters()
  } catch (e: any) {
    // keep confirm open on error
  } finally {
    deleting.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  await fetchRouters()
  await pingAll()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
