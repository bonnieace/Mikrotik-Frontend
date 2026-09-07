<template>
  <header class="h-16 sticky top-0 z-40 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 gap-3">
    <button class="md:hidden" aria-label="Toggle navigation" @click="sidebarOpen = !sidebarOpen"><span class="material-symbols-outlined">menu</span></button>
    <span class="text-sm text-slate-500 hidden sm:block">{{ user?.username }} · {{ user?.role }}</span>
    <div class="flex items-center gap-3 min-w-0">
      <span class="text-xs" :class="isOnline === true ? 'text-green-700' : isOnline === false ? 'text-red-700' : 'text-slate-500'">Router: {{ isOnline === true ? 'Online' : isOnline === false ? 'Offline' : 'Unknown / checking' }}</span>
      <label for="router-switch" class="sr-only">Active router</label>
      <select id="router-switch" class="max-w-[180px] p-2 rounded-md border border-slate-200" :value="activeRouter?.uid || ''" :disabled="loading || !routers?.length" @change="select($event)">
        <option value="" disabled>{{ loading ? 'Loading…' : 'Select router' }}</option>
        <option v-for="router in routers" :key="router.uid" :value="router.uid">{{ router.name }}</option>
      </select>
    </div>
  </header>
  <div v-if="error" class="p-3 bg-red-50 text-red-800 text-sm" role="alert">{{ error }} <button @click="fetchRouters">Retry router list</button></div>
</template>
<script setup lang="ts">
const { user } = useAuth()
const sidebarOpen = useState('mobile-sidebar-open', () => false)
const { routers, activeRouter, loading, error, fetchRouters, setActiveRouter } = useRouterStore()
const { isOnline } = useRouterPing()
onMounted(fetchRouters)
function select(event: Event) {
  const router = routers.value.find(r => r.uid === (event.target as HTMLSelectElement).value)
  if (router) setActiveRouter(router)
}
</script>
