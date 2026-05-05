<template>
  <div class="p-md sm:p-lg max-w-container-max mx-auto">

    <!-- Page Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-xl">
      <div>
        <h2 class="font-h1 text-h1 text-on-background">Service Plans</h2>
        <p class="font-body-md text-on-surface-variant">Manage network bandwidth tiers and subscriber distribution.</p>
      </div>
      <button
        class="w-full sm:w-auto justify-center bg-primary text-on-primary px-lg py-2 rounded-lg font-h3 text-h3 hover:bg-slate-800 flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
        @click="showCreateModal = true"
      >
        <span class="material-symbols-outlined text-lg">add</span>
        Create New Plan
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-lg mb-xl">

      <!-- Total Plans -->
      <div class="bg-white p-lg border border-slate-200 rounded-xl">
        <div class="flex items-center justify-between mb-sm">
          <span class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Total Plans</span>
          <span class="material-symbols-outlined text-secondary">receipt_long</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="font-display text-display text-on-background">
            <template v-if="loading"><span class="material-symbols-outlined animate-spin text-slate-300" style="font-size:36px;line-height:44px;">progress_activity</span></template>
            <template v-else>{{ packages.length }}</template>
          </span>
        </div>
        <div class="mt-md h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-secondary" :style="{ width: packages.length ? `100%` : `0%` }"></div>
        </div>
      </div>

      <!-- Stat 2 placeholder -->
      <div class="bg-white p-lg border border-slate-200 rounded-xl">
        <div class="flex items-center justify-between mb-sm">
          <span class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Avg. Revenue Per User</span>
          <span class="material-symbols-outlined text-secondary">payments</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="font-display text-display text-slate-300">—</span>
        </div>
        <div class="mt-md h-1 w-full bg-slate-100 rounded-full overflow-hidden"></div>
      </div>

      <!-- Stat 3 placeholder -->
      <div class="bg-white p-lg border border-slate-200 rounded-xl">
        <div class="flex items-center justify-between mb-sm">
          <span class="font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Plan Penetration</span>
          <span class="material-symbols-outlined text-secondary">analytics</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="font-display text-display text-slate-300">—</span>
        </div>
        <div class="mt-md h-1 w-full bg-slate-100 rounded-full overflow-hidden"></div>
      </div>

    </div>

    <!-- Plans Table Card -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

      <!-- Table Toolbar -->
      <div class="p-lg border-b border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
        <div class="flex items-center gap-4 w-full sm:w-auto">
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">filter_list</span>
            <select
              v-model="serviceTypeFilter"
              class="pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 appearance-none"
              @change="currentPage = 1"
            >
              <option value="">All Types</option>
              <option value="hotspot">Hotspot</option>
              <option value="pppoe">PPPoE</option>
            </select>
          </div>
        </div>
        <div class="flex items-center gap-3 self-end sm:self-auto">
          <span class="font-table-header text-slate-500 uppercase tracking-widest">
            {{ filteredPackages.length }} plan{{ filteredPackages.length !== 1 ? `s` : `` }}
          </span>
          <button
            class="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            :class="loading ? `animate-spin text-secondary` : `text-slate-400`"
            @click="fetchPackages"
          >
            <span class="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-200">
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Plan Name</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">Description</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider text-center">Type</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider text-right">Price (KES)</th>
              <th class="px-md py-sm font-table-header text-table-header text-on-surface-variant uppercase tracking-wider text-right">Validity</th>
              <th class="px-md py-sm"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">

            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-md py-md"><div class="h-4 bg-slate-100 rounded w-32"></div></td>
                <td class="px-md py-md"><div class="h-4 bg-slate-100 rounded w-48"></div></td>
                <td class="px-md py-md"><div class="h-5 bg-slate-100 rounded w-16 mx-auto"></div></td>
                <td class="px-md py-md"><div class="h-4 bg-slate-100 rounded w-16 ml-auto"></div></td>
                <td class="px-md py-md"><div class="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
                <td class="px-md py-md"></td>
              </tr>
            </template>

            <template v-else>
              <tr
                v-for="pkg in paginatedPackages"
                :key="pkg.id"
                class="hover:bg-slate-50 transition-colors group"
              >
                <td class="px-md py-md">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded flex items-center justify-center" :class="pkg.service_type === `hotspot` ? `bg-amber-100` : `bg-blue-100`">
                      <span class="material-symbols-outlined text-lg" :class="pkg.service_type === `hotspot` ? `text-amber-600` : `text-blue-600`">
                        {{ pkg.service_type === `hotspot` ? `wifi` : `cable` }}
                      </span>
                    </div>
                    <span class="font-body-md text-body-md text-on-background font-semibold">{{ pkg.name }}</span>
                  </div>
                </td>
                <td class="px-md py-md">
                  <span class="font-body-md text-body-md text-on-surface-variant">{{ pkg.description }}</span>
                </td>
                <td class="px-md py-md">
                  <div class="flex justify-center">
                    <span
                      class="px-2 py-0.5 text-[10px] font-bold rounded uppercase"
                      :class="pkg.service_type === `hotspot` ? `bg-amber-100 text-amber-700` : `bg-blue-100 text-blue-700`"
                    >
                      {{ pkg.service_type }}
                    </span>
                  </div>
                </td>
                <td class="px-md py-md text-right">
                  <span class="font-body-md text-body-md text-on-background font-bold">{{ pkg.price.toLocaleString() }}</span>
                  <span class="text-body-sm text-slate-400"> KES</span>
                </td>
                <td class="px-md py-md text-right">
                  <span class="font-body-md text-body-md text-on-surface">{{ pkg.validity_days }}</span>
                  <span class="text-body-sm text-slate-400"> day{{ pkg.validity_days !== 1 ? `s` : `` }}</span>
                </td>
                <td class="px-md py-md text-right">
                  <button class="p-1.5 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="material-symbols-outlined text-xl">edit</span>
                  </button>
                </td>
              </tr>

              <tr v-if="filteredPackages.length === 0">
                <td colspan="6" class="px-md py-12 text-center text-sm text-on-surface-variant">
                  No service plans found.
                </td>
              </tr>
            </template>

          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && totalPages > 1" class="p-lg border-t border-slate-200 bg-slate-50/30 flex items-center justify-between">
        <span class="font-body-sm text-body-sm text-slate-500">
          Showing {{ paginationStart }}–{{ paginationEnd }} of {{ filteredPackages.length }} plans
        </span>
        <div class="flex items-center gap-2">
          <button
            class="p-2 border border-slate-200 rounded hover:bg-white text-slate-400 disabled:opacity-50"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <span class="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            class="px-3 py-1 rounded text-sm"
            :class="p === currentPage
              ? `bg-white border border-slate-300 font-bold text-slate-900 shadow-sm`
              : `border border-transparent font-medium text-slate-500 hover:bg-white hover:border-slate-200`"
            @click="currentPage = p"
          >
            {{ p }}
          </button>
          <button
            class="p-2 border border-slate-200 rounded hover:bg-white text-slate-400 disabled:opacity-50"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <span class="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Insight Cards -->
    <div class="mt-xl grid grid-cols-1 lg:grid-cols-2 gap-lg">
      <div class="bg-blue-600 rounded-xl p-lg text-white relative overflow-hidden group">
        <div class="relative z-10">
          <h3 class="font-h2 text-h2 mb-sm">Revenue Forecast</h3>
          <p class="text-blue-100 text-body-md mb-lg max-w-sm">
            Upgrading legacy users to higher tiers could increase monthly recurring revenue significantly.
          </p>
          <button class="bg-white text-blue-600 px-md py-1.5 rounded font-bold text-sm hover:bg-blue-50 transition-colors">
            View Campaign Strategy
          </button>
        </div>
        <span class="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] text-blue-500 opacity-20 transform -rotate-12 group-hover:scale-110 transition-transform duration-500">insights</span>
      </div>
      <div class="bg-slate-900 rounded-xl p-lg text-white relative overflow-hidden group">
        <div class="relative z-10">
          <h3 class="font-h2 text-h2 mb-sm">Infrastructure Alignment</h3>
          <p class="text-slate-400 text-body-md mb-lg max-w-sm">
            Review your node hardware to ensure compatibility with current service plan rollouts.
          </p>
          <button class="bg-slate-800 text-slate-200 px-md py-1.5 rounded font-bold text-sm hover:bg-slate-700 transition-colors">
            Audit Node Hardware
          </button>
        </div>
        <span class="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] text-slate-800 opacity-50 transform -rotate-12 group-hover:scale-110 transition-transform duration-500">router</span>
      </div>
    </div>

    <!-- Create Plan Modal -->
    <Transition name="backdrop">
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center" @click.self="closeModal">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 z-50 flex flex-col overflow-hidden max-h-[90vh]">

          <div class="flex items-center justify-between px-lg py-md border-b border-slate-200">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px] text-white">add</span>
              </div>
              <h3 class="font-h2 text-h2 text-on-background">Create Service Plan</h3>
            </div>
            <button class="p-1.5 hover:bg-slate-100 rounded-lg text-on-surface-variant transition-colors" @click="closeModal">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form class="px-lg py-lg space-y-md overflow-y-auto" @submit.prevent="submitCreate">

            <div>
              <label class="block font-table-header text-table-header text-on-surface-variant uppercase tracking-wider mb-xs">Plan Name</label>
              <input
                v-model="form.name"
                required
                type="text"
                placeholder="e.g. Home Fiber Basic"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg font-body-md text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
              />
            </div>

            <div>
              <label class="block font-table-header text-table-header text-on-surface-variant uppercase tracking-wider mb-xs">Description</label>
              <input
                v-model="form.description"
                required
                type="text"
                placeholder="e.g. 10 Mbps unlimited for 30 days"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg font-body-md text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div>
                <label class="block font-table-header text-table-header text-on-surface-variant uppercase tracking-wider mb-xs">Price (KES)</label>
                <input
                  v-model.number="form.price"
                  required
                  min="0"
                  type="number"
                  placeholder="500"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg font-body-md text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label class="block font-table-header text-table-header text-on-surface-variant uppercase tracking-wider mb-xs">Validity (days)</label>
                <input
                  v-model.number="form.validity_days"
                  required
                  min="1"
                  type="number"
                  placeholder="30"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg font-body-md text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label class="block font-table-header text-table-header text-on-surface-variant uppercase tracking-wider mb-xs">Service Type</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                <label
                  class="flex items-center gap-3 px-md py-sm border rounded-lg cursor-pointer transition-all"
                  :class="form.service_type === `hotspot` ? `border-amber-400 bg-amber-50` : `border-slate-200 hover:bg-slate-50`"
                >
                  <input v-model="form.service_type" class="accent-amber-500" type="radio" value="hotspot" />
                  <span class="material-symbols-outlined text-[18px]" :class="form.service_type === `hotspot` ? `text-amber-600` : `text-slate-400`">wifi</span>
                  <span class="font-body-md text-on-surface">Hotspot</span>
                </label>
                <label
                  class="flex items-center gap-3 px-md py-sm border rounded-lg cursor-pointer transition-all"
                  :class="form.service_type === `pppoe` ? `border-blue-400 bg-blue-50` : `border-slate-200 hover:bg-slate-50`"
                >
                  <input v-model="form.service_type" class="accent-blue-500" type="radio" value="pppoe" />
                  <span class="material-symbols-outlined text-[18px]" :class="form.service_type === `pppoe` ? `text-blue-600` : `text-slate-400`">cable</span>
                  <span class="font-body-md text-on-surface">PPPoE</span>
                </label>
              </div>
            </div>

            <p v-if="createError" class="text-sm text-error flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">error</span>
              {{ createError }}
            </p>

            <div class="flex gap-sm pt-sm">
              <button
                type="button"
                class="flex-1 px-md py-2 border border-slate-200 text-on-surface font-body-md rounded-lg hover:bg-slate-50 transition-all"
                @click="closeModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex-1 flex items-center justify-center gap-2 px-md py-2 bg-primary text-on-primary font-body-md rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
                :disabled="creating"
              >
                <span v-if="creating" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                <span v-else class="material-symbols-outlined text-[18px]">check</span>
                {{ creating ? `Creating…` : `Create Plan` }}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
interface Package {
  id: number
  name: string
  description: string
  price: number
  service_type: 'hotspot' | 'pppoe'
  validity_days: number
  router_id: number
}

const config = useRuntimeConfig()
const { token } = useAuth()
const { activeRouter } = useRouterStore()

const packages = ref<Package[]>([])
const loading = ref(false)

async function fetchPackages() {
  if (!activeRouter.value || !token.value) return
  loading.value = true
  try {
    const data = await $fetch<Package[]>(
      `${config.public.apiBase}/packages?router_id=${activeRouter.value.id}`,
      { headers: { Authorization: `Bearer ${token.value}` } },
    )
    packages.value = Array.isArray(data) ? data : []
  } catch {
    packages.value = []
  } finally {
    loading.value = false
  }
}

watch(activeRouter, () => fetchPackages(), { immediate: true })

const serviceTypeFilter = ref('')
const currentPage = ref(1)
const perPage = 10

const filteredPackages = computed(() =>
  serviceTypeFilter.value
    ? packages.value.filter(p => p.service_type === serviceTypeFilter.value)
    : packages.value,
)

watch(filteredPackages, () => { currentPage.value = 1 })

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPackages.value.length / perPage)))

const paginatedPackages = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredPackages.value.slice(start, start + perPage)
})

const paginationStart = computed(() =>
  filteredPackages.value.length === 0 ? 0 : (currentPage.value - 1) * perPage + 1,
)
const paginationEnd = computed(() =>
  Math.min(currentPage.value * perPage, filteredPackages.value.length),
)

const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')

const emptyForm = () => ({
  name: '',
  description: '',
  price: null as number | null,
  validity_days: null as number | null,
  service_type: 'hotspot' as 'hotspot' | 'pppoe',
})

const form = ref(emptyForm())

function closeModal() {
  showCreateModal.value = false
  createError.value = ''
  form.value = emptyForm()
}

async function submitCreate() {
  if (!activeRouter.value || !token.value) return
  creating.value = true
  createError.value = ''
  try {
    const params = new URLSearchParams({
      name: form.value.name,
      description: form.value.description,
      price: String(form.value.price),
      service_type: form.value.service_type,
      validity_days: String(form.value.validity_days),
      router_id: String(activeRouter.value.id),
    })
    await $fetch<Package>(`${config.public.apiBase}/package?${params}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
    })
    await fetchPackages()
    closeModal()
  } catch (e: unknown) {
    const err = e as { data?: { detail?: string }; message?: string }
    createError.value = err?.data?.detail ?? err?.message ?? 'Failed to create plan.'
  } finally {
    creating.value = false
  }
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
</style>
