<template>
  <aside class="w-[240px] h-screen fixed left-0 top-0 border-r border-slate-200 bg-slate-50 flex flex-col py-6 z-50">
    <!-- Brand -->
    <div class="px-6 mb-8">
      <h1 class="text-lg font-bold text-slate-900 tracking-tighter">CoreNet ISP</h1>
      <p class="text-xs text-slate-500 font-medium">Network Admin</p>
    </div>

    <!-- Nav items -->
    <nav class="flex-1 px-3 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center px-3 py-2 text-sm font-medium tracking-tight transition-all"
        :class="isActive(item.to)
          ? 'bg-slate-200/50 text-slate-900 border-r-2 border-blue-600'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'"
      >
        <span class="material-symbols-outlined mr-3 text-[20px]">{{ item.icon }}</span>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <!-- Bottom actions -->
    <div class="px-3 mt-auto pt-6 border-t border-slate-200 space-y-1">
      <a
        href="#"
        class="flex items-center px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium tracking-tight transition-colors rounded"
      >
        <span class="material-symbols-outlined mr-3 text-[20px]">help_outline</span>
        Support
      </a>
      <button
        class="w-full flex items-center px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium tracking-tight transition-colors rounded"
        @click="handleLogout"
      >
        <span class="material-symbols-outlined mr-3 text-[20px]">logout</span>
        Logout
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const { logout } = useAuth()
const snackbar = useSnackbar()

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { icon: 'group', label: 'Network Users', to: '/network-users' },
  { icon: 'receipt_long', label: 'Service Plans', to: '/service-plans' },
  { icon: 'payments', label: 'Billing', to: '/billing' },
  { icon: 'router', label: 'Infrastructure', to: '/routers' },
  { icon: 'settings', label: 'Settings', to: '/settings' },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

async function handleLogout() {
  snackbar.show('Logged out successfully', 'info')
  await logout()
}
</script>
