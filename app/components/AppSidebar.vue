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
      class="w-[240px] h-screen fixed left-0 top-0 border-r border-slate-200 bg-slate-50 flex flex-col py-6 z-50 transform transition-transform duration-200 md:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
    <!-- Brand -->
    <div class="px-6 mb-8">
      <h1 class="text-lg font-bold text-slate-900 tracking-tighter">CoreNet ISP</h1>
      <p class="text-xs text-slate-500 font-medium">Network Admin</p>
    </div>

    <!-- Nav items -->
    <nav class="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        @click="handleNavClick"
        :class="isActive(item.to)
          ? 'flex items-center px-3 py-2 bg-slate-200/50 text-slate-900 border-r-2 border-blue-600 font-inter text-sm font-medium tracking-tight transition-transform active:scale-[0.98]'
          : 'flex items-center px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-inter text-sm font-medium tracking-tight transition-colors duration-150'"
      >
        <span class="material-symbols-outlined mr-3">{{ item.icon }}</span>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <!-- Bottom actions -->
    <div class="px-3 mt-auto pt-6 border-t border-slate-200">
      <a
        href="#"
        class="flex items-center px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-inter text-sm font-medium tracking-tight transition-colors duration-150"
        @click="handleNavClick"
      >
        <span class="material-symbols-outlined mr-3">help_outline</span>
        Support
      </a>
      <a
        href="#"
        class="flex items-center px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-inter text-sm font-medium tracking-tight transition-colors duration-150"
        @click.prevent="handleLogout"
      >
        <span class="material-symbols-outlined mr-3">logout</span>
        Logout
      </a>
    </div>
    </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const { logout } = useAuth()
const snackbar = useSnackbar()
const sidebarOpen = useState<boolean>('mobile-sidebar-open', () => false)

const MOBILE_BREAKPOINT = 768

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
  if (process.client && window.innerWidth < MOBILE_BREAKPOINT) {
    sidebarOpen.value = false
  }
}

watch(() => route.path, () => {
  if (process.client && window.innerWidth < MOBILE_BREAKPOINT) {
    sidebarOpen.value = false
  }
})

async function handleLogout() {
  handleNavClick()
  snackbar.show('Logged out successfully', 'info')
  await logout()
}
</script>
