<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/30 z-40 md:hidden"
      @click="sidebarOpen = false"
    />
  </Transition>

  <aside
    id="app-sidebar"
    ref="sidebar"
    :inert="mobile && !sidebarOpen"
    class="w-[240px] h-dvh fixed left-0 top-0 border-r border-slate-200 bg-slate-50 flex flex-col py-6 z-50 transform transition-transform duration-200 md:translate-x-0"
    :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    @keydown.esc="sidebarOpen = false"
    @keydown.tab="trapFocus"
  >
    <!-- Brand -->
    <div class="px-6 mb-8 relative">
      <button
        class="sidebar-close md:hidden"
        aria-label="Close navigation"
        @click="sidebarOpen = false"
      >
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
      <p class="text-lg font-bold text-slate-900 tracking-tighter">Uzanet</p>
      <p class="text-xs text-slate-500 font-medium">Network Admin</p>
    </div>

    <!-- Nav items -->
    <nav
      aria-label="Main navigation"
      class="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="
          isActive(item.to)
            ? 'flex items-center px-3 py-2 bg-slate-200/50 text-slate-900 border-r-2 border-blue-600 font-inter text-sm font-medium tracking-tight transition-transform active:scale-[0.98]'
            : 'flex items-center px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-inter text-sm font-medium tracking-tight transition-colors duration-150'
        "
        @click="handleNavClick"
      >
        <span aria-hidden="true" class="material-symbols-outlined mr-3">{{ item.icon }}</span>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <!-- Bottom actions -->
    <div class="px-3 mt-auto pt-6 border-t border-slate-200">
      <a
        href="#"
        class="flex items-center px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-inter text-sm font-medium tracking-tight transition-colors duration-150"
        @click.prevent="handleLogout"
      >
        <span aria-hidden="true" class="material-symbols-outlined mr-3">logout</span>
        Logout
      </a>
    </div>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const { logout } = useAuth()
const sidebarOpen = useState<boolean>('mobile-sidebar-open', () => false)

const MOBILE_BREAKPOINT = 768
const mobile = ref(false)
const sidebar = ref<HTMLElement | null>(null)
let trigger: HTMLElement | null = null
watch(sidebarOpen, async (open) => {
  if (!mobile.value) return
  if (open) {
    trigger = document.activeElement as HTMLElement
    await nextTick()
    sidebar.value?.querySelector<HTMLButtonElement>('button')?.focus()
  } else trigger?.focus()
})
function trapFocus(event: KeyboardEvent) {
  if (!mobile.value || !sidebarOpen.value) return
  const items = Array.from(
    sidebar.value?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') || [],
  ).filter((el) => el.getClientRects().length)
  const first = items[0],
    last = items.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
function resize() {
  mobile.value = window.innerWidth < MOBILE_BREAKPOINT
  if (!mobile.value) sidebarOpen.value = false
}
onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
})
onUnmounted(() => window.removeEventListener('resize', resize))

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { icon: 'group', label: 'PPP Users', to: '/network-users' },
  { icon: 'wifi', label: 'Hotspot Users', to: '/hotspot-users' },
  { icon: 'receipt_long', label: 'Service Plans', to: '/service-plans' },
  { icon: 'payments', label: 'Billing', to: '/billing' },
  { icon: 'router', label: 'Infrastructure', to: '/routers' },
  { icon: 'settings', label: 'Settings', to: '/settings' },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function handleNavClick() {
  if (import.meta.client && window.innerWidth < MOBILE_BREAKPOINT) {
    sidebarOpen.value = false
  }
}

watch(
  () => route.path,
  () => {
    if (import.meta.client && window.innerWidth < MOBILE_BREAKPOINT) {
      sidebarOpen.value = false
    }
  },
)

async function handleLogout() {
  handleNavClick()
  await logout()
}
</script>

<style scoped>
.sidebar-close {
  position: absolute;
  top: 0;
  right: 16px;
  padding: 4px;
  background: transparent;
  border: 0;
  color: #64748b;
}
</style>
