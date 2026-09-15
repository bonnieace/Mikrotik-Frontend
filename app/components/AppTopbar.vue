<template>
  <header class="app-topbar" @keydown.esc="closeMenus">
    <button
      class="nav-toggle"
      aria-label="Toggle navigation"
      :aria-expanded="sidebarOpen"
      aria-controls="app-sidebar"
      @click="sidebarOpen = !sidebarOpen"
    >
      <span class="material-symbols-outlined" aria-hidden="true">menu</span>
    </button>
    <div ref="searchRef" class="topbar-search">
      <span class="material-symbols-outlined" aria-hidden="true">search</span>
      <input
        v-model="search"
        type="search"
        aria-label="Search pages or routers"
        placeholder="Search pages or routers…"
        @focus="searchOpen = true"
      />
      <div v-if="searchOpen && search.trim()" class="topbar-menu search-results">
        <p class="menu-label">Quick navigation</p>
        <NuxtLink
          v-for="item in matches"
          :key="item.to + item.label"
          :to="item.to"
          @click="navigate(item)"
          ><span class="material-symbols-outlined" aria-hidden="true">{{ item.icon }}</span
          ><span
            >{{ item.label }}<small>{{ item.detail }}</small></span
          ></NuxtLink
        >
        <p v-if="!matches.length" class="menu-empty">No matching pages or routers.</p>
      </div>
    </div>
    <div class="topbar-right">
      <span
        class="router-health"
        :class="isOnline === true ? 'online' : isOnline === false ? 'offline' : ''"
        ><i /><span
          >Router:
          {{
            !activeRouter
              ? 'Not selected'
              : isOnline === true
                ? 'Online'
                : isOnline === false
                  ? 'Offline'
                  : 'Checking / unknown'
          }}</span
        ></span
      >
      <div ref="routerMenuRef" class="router-picker">
        <button
          ref="routerButton"
          class="router-trigger"
          :aria-expanded="routerMenuOpen"
          aria-controls="router-options"
          @click="routerMenuOpen = !routerMenuOpen"
        >
          <span class="material-symbols-outlined" aria-hidden="true">router</span
          ><span>{{ activeRouter?.name || (loading ? 'Loading…' : 'Select router') }}</span
          ><span class="material-symbols-outlined chevron" aria-hidden="true">expand_more</span>
        </button>
        <div v-if="routerMenuOpen" id="router-options" class="topbar-menu router-options">
          <p class="menu-label">Select router</p>
          <button
            v-for="router in routers"
            :key="router.uid"
            :aria-pressed="activeRouter?.uid === router.uid"
            :disabled="loading"
            @click="selectRouter(router)"
          >
            <span class="material-symbols-outlined" aria-hidden="true">{{
              activeRouter?.uid === router.uid ? 'radio_button_checked' : 'radio_button_unchecked'
            }}</span
            ><span
              >{{ router.name }}<small>{{ router.ip_address }}:{{ router.port }}</small></span
            >
          </button>
          <p v-if="!routers.length" class="menu-empty">
            {{ loading ? 'Loading routers…' : 'No routers registered.' }}
          </p>
          <NuxtLink class="manage-routers" to="/routers" @click="closeMenus"
            ><span class="material-symbols-outlined" aria-hidden="true">settings</span>Manage
            routers</NuxtLink
          >
        </div>
      </div>
      <NuxtLink
        to="/settings"
        class="operator-avatar"
        :aria-label="'Account settings for ' + operatorName"
        :title="operatorName"
        >{{ operatorName.slice(0, 2).toUpperCase() }}</NuxtLink
      >
    </div>
  </header>
  <div v-if="error" class="router-list-error" role="alert">
    {{ error }} <button @click="fetchRouters">Retry router list</button>
  </div>
</template>
<script setup lang="ts">
import type { Router } from '~~/shared/types'
const { user } = useAuth()
const operatorName = computed(() => user.value?.isp_name || user.value?.username || 'Operator')
const route = useRoute()
const sidebarOpen = useState('mobile-sidebar-open', () => false)
const { routers, activeRouter, loading, error, fetchRouters, setActiveRouter } = useRouterStore()
const { isOnline } = useRouterPing()
const routerMenuOpen = ref(false),
  searchOpen = ref(false),
  search = ref('')
const routerMenuRef = ref<HTMLElement | null>(null),
  searchRef = ref<HTMLElement | null>(null),
  routerButton = ref<HTMLButtonElement | null>(null)
const pages = [
  {
    label: 'Network Overview',
    to: '/dashboard',
    icon: 'dashboard',
    detail: 'Dashboard',
  },
  {
    label: 'PPP User Management',
    to: '/network-users',
    icon: 'group',
    detail: 'Subscribers and sessions',
  },
  {
    label: 'Hotspot User Sessions',
    to: '/hotspot-users',
    icon: 'wifi',
    detail: 'Customers and live connections',
  },
  {
    label: 'Service Plans',
    to: '/service-plans',
    icon: 'receipt_long',
    detail: 'Pricing and packages',
  },
  {
    label: 'Payments & Logs',
    to: '/billing',
    icon: 'payments',
    detail: 'Billing and audit history',
  },
  {
    label: 'Routers & Configuration',
    to: '/routers',
    icon: 'router',
    detail: 'Infrastructure',
  },
  {
    label: 'Account Settings',
    to: '/settings',
    icon: 'settings',
    detail: 'Your operator account',
  },
]
const matches = computed(() =>
  [
    ...pages,
    ...routers.value.map((router) => ({
      label: router.name,
      detail: router.ip_address,
      to: '/routers',
      icon: 'router',
      router,
    })),
  ]
    .filter((item) =>
      (item.label + ' ' + item.detail).toLowerCase().includes(search.value.trim().toLowerCase()),
    )
    .slice(0, 8),
)
function closeMenus() {
  routerMenuOpen.value = false
  searchOpen.value = false
}
function selectRouter(router: Router) {
  setActiveRouter(router)
  closeMenus()
  routerButton.value?.focus()
}
function navigate(item: (typeof pages)[number] & { router?: Router }) {
  if (item.router) setActiveRouter(item.router)
  search.value = ''
  closeMenus()
}
function outside(event: MouseEvent) {
  if (!routerMenuRef.value?.contains(event.target as Node)) routerMenuOpen.value = false
  if (!searchRef.value?.contains(event.target as Node)) searchOpen.value = false
}
onMounted(() => {
  void fetchRouters()
  document.addEventListener('click', outside)
})
onUnmounted(() => document.removeEventListener('click', outside))
watch(() => route.path, closeMenus)
</script>
<style scoped>
.app-topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffffed;
  backdrop-filter: blur(12px);
}
.topbar-search {
  position: relative;
  max-width: 384px;
  flex: 1;
  min-width: 120px;
}
.topbar-search > .material-symbols-outlined {
  position: absolute;
  left: 12px;
  top: 11px;
  font-size: 18px;
  color: #94a3b8;
}
.topbar-search input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: #f1f5f9;
  font-size: 12px;
  color: #334155;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.router-health {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 5px 8px;
  border-radius: 6px;
  color: #64748b;
  text-transform: uppercase;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.055em;
  white-space: nowrap;
}
.router-health i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.router-health.online {
  color: #15803d;
  border-color: #dcfce7;
  background: #f0fdf4;
}
.router-health.offline {
  color: #b91c1c;
  border-color: #fee2e2;
  background: #fef2f2;
}
.router-picker {
  position: relative;
}
.router-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: transparent;
  border: 0;
  border-radius: 4px;
  color: #475569;
}
.router-trigger:hover {
  background: #f1f5f9;
}
.router-trigger > span:nth-child(2) {
  font-size: 12px;
  font-weight: 500;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.router-trigger .material-symbols-outlined {
  font-size: 20px;
}
.router-trigger .chevron {
  font-size: 16px;
  color: #94a3b8;
}
.operator-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.topbar-menu {
  position: absolute;
  top: calc(100% + 10px);
  min-width: 260px;
  width: 100%;
  padding: 6px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 12px 32px #0f172a1a;
  max-height: 420px;
  overflow-y: auto;
}
.router-options {
  right: 0;
}
.menu-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 8px;
}
.topbar-menu :is(button, a) {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 0;
  border-radius: 4px;
  padding: 10px 8px;
  background: white;
  text-align: left;
  color: #475569;
  font-size: 12px;
  font-weight: 500;
}
.topbar-menu :is(button, a):hover {
  background: #f8fafc;
}
.topbar-menu button[aria-pressed='true'] {
  color: #2563eb;
}
.topbar-menu .material-symbols-outlined {
  font-size: 18px;
  flex-shrink: 0;
}
.topbar-menu small {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 3px;
}
.menu-empty {
  padding: 12px 8px;
  color: #94a3b8;
  font-size: 12px;
}
.topbar-menu .manage-routers {
  border-top: 1px solid #f1f5f9;
  border-radius: 0;
  margin-top: 4px;
}
.nav-toggle {
  display: none;
  border: 1px solid #e2e8f0;
  padding: 6px;
  border-radius: 4px;
  background: white;
  color: #475569;
}
.router-list-error {
  background: #fef2f2;
  color: #991b1b;
  padding: 12px 24px;
  font-size: 13px;
}
.router-list-error button {
  text-decoration: underline;
  background: transparent;
  border: 0;
  color: inherit;
}
@media (max-width: 1250px) {
  .router-health {
    display: none;
  }
}
@media (max-width: 767px) {
  .app-topbar {
    padding: 0 16px;
    gap: 12px;
  }
  .nav-toggle {
    display: inline-flex;
  }
  .topbar-right {
    gap: 8px;
  }
  .topbar-search {
    display: none;
  }
  .router-trigger > span:nth-child(2) {
    max-width: 160px;
  }
  .router-picker {
    position: static;
  }
  .router-options {
    left: 16px;
    right: 16px;
    width: auto;
    top: 58px;
    min-width: 0;
  }
}
</style>
