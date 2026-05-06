<template>
  <header class="h-16 w-full sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 gap-3">
    <button
      class="md:hidden p-2 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      @click="sidebarOpen = !sidebarOpen"
      aria-label="Toggle navigation"
    >
      <span class="material-symbols-outlined text-[20px]">menu</span>
    </button>

    <!-- Search -->
    <div class="flex items-center flex-1 min-w-0">
      <div class="relative w-full max-w-96 group">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          search
        </span>
        <input
          v-model="searchQuery"
          class="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-slate-300 transition-all outline-none"
          placeholder="Search accounts, IP addresses, or equipment..."
          type="text"
        />
      </div>
    </div>

    <!-- Right side -->
    <div class="flex items-center space-x-3 sm:space-x-6">
      <!-- Status badge -->
      <div
        class="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full border transition-colors duration-300"
        :class="pingStatusClass"
      >
        <span
          class="w-2 h-2 rounded-full transition-colors duration-300"
          :class="[pingDotClass, isOnline !== false ? 'animate-pulse' : '']"
        ></span>
        <span class="font-mono-label text-[10px] uppercase font-bold tracking-widest">
          System Status:
          <span v-if="isOnline === null">Checking…</span>
          <span v-else-if="isOnline">Online</span>
          <span v-else>Offline</span>
        </span>
      </div>

      <div class="flex items-center space-x-2 sm:space-x-4">
        <!-- Notifications -->
        <button class="relative text-slate-600 hover:text-slate-900 transition-colors">
          <span class="material-symbols-outlined">notifications</span>
          <span class="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>

        <!-- Router switcher -->
        <div class="relative" ref="routerMenuRef">
          <button
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            :class="{ 'bg-slate-100 text-slate-900': routerMenuOpen }"
            :title="activeRouter ? `Router: ${activeRouter.name} (${activeRouter.ip_address})` : 'No router selected'"
            @click="routerMenuOpen = !routerMenuOpen"
          >
            <span class="material-symbols-outlined text-[20px]">router</span>
            <span class="text-xs font-medium max-w-[80px] truncate">
              {{ activeRouter ? activeRouter.name : (loadingRouters ? '…' : 'No router') }}
            </span>
            <span class="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
          </button>

          <!-- Dropdown -->
          <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="routerMenuOpen"
              class="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 origin-top-right"
            >
              <p class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Router</p>
              <button
                v-for="r in routers"
                :key="r.id"
                class="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                :class="activeRouter?.id === r.id ? 'text-blue-600' : 'text-slate-700'"
                @click="selectRouter(r)"
              >
                <span class="material-symbols-outlined text-[18px]">
                  {{ activeRouter?.id === r.id ? 'radio_button_checked' : 'radio_button_unchecked' }}
                </span>
                <div class="min-w-0">
                  <p class="text-sm font-semibold truncate">{{ r.name }}</p>
                  <p class="text-[11px] text-slate-400 font-mono truncate">{{ r.ip_address }}:{{ r.port }}</p>
                </div>
              </button>
              <p v-if="routers.length === 0 && !loadingRouters" class="px-3 py-2 text-sm text-slate-400">No routers found</p>
              <p v-if="loadingRouters" class="px-3 py-2 text-sm text-slate-400">Loading…</p>
            </div>
          </Transition>
        </div>

        <!-- Avatar -->
        <div class="h-8 w-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden">
          <img
            alt="Admin User Profile"
            class="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuASLIUWrI1WLntx-qP54uHHVE2pgB7VcfEnul4_g8HL_KCXPhd1aa7OhE29rYHEJNpl96G2p4_3fRLUCyA5vTAR7NWJTfr0fYrNWLqP2EBEzIRXNvUzt-qeLvhGQs289bxeYq0wWvtigGOZ-lqcNxmqld0xPAvqBJXxpCJIYmIMUeYjsLoOkaokx2t3d42asYtUxZIMIRE4Ma7dXI4nfiTT6nrA_Y2m6iNBjkc-nRAbz_i5zMiQq1HODMuGyVYX1Rf7mTwRWF3dDKxj"
          />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const searchQuery = ref('')
const routerMenuOpen = ref(false)
const routerMenuRef = ref<HTMLElement | null>(null)
const sidebarOpen = useState<boolean>('mobile-sidebar-open', () => false)

const { routers, activeRouter, loading: loadingRouters, fetchRouters, setActiveRouter } = useRouterStore()
const { isOnline } = useRouterPing()

const pingStatusClass = computed(() => {
  if (isOnline.value === null) return 'bg-slate-50 text-slate-500 border-slate-200'
  if (isOnline.value) return 'bg-green-50 text-green-700 border-green-100'
  return 'bg-red-50 text-red-700 border-red-200'
})

const pingDotClass = computed(() => {
  if (isOnline.value === null) return 'bg-slate-400'
  if (isOnline.value) return 'bg-green-500'
  return 'bg-red-500'
})

onMounted(() => fetchRouters())

function selectRouter(r: import('~/composables/useRouterStore').MikrotikRouter) {
  setActiveRouter(r)
  routerMenuOpen.value = false
}

// Close dropdown on outside click
onMounted(() => {
  document.addEventListener('click', onOutsideClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onOutsideClick)
})
function onOutsideClick(e: MouseEvent) {
  if (routerMenuRef.value && !routerMenuRef.value.contains(e.target as Node)) {
    routerMenuOpen.value = false
  }
}
</script>
