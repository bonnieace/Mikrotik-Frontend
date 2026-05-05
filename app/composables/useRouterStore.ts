export interface MikrotikRouter {
  id: number
  name: string
  ip_address: string
  port: number
  username: string
  owner_id: number
  created_at: string
  updated_at: string
}

export function useRouterStore() {
  const { token } = useAuth()
  const config = useRuntimeConfig()

  const routers = useState<MikrotikRouter[]>('routers', () => [])
  const activeRouter = useState<MikrotikRouter | null>('activeRouter', () => null)
  const loading = useState<boolean>('routersLoading', () => false)

  async function fetchRouters() {
    if (!token.value) return
    loading.value = true
    try {
      const data = await $fetch<MikrotikRouter[]>(`${config.public.apiBase}/routers`, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      routers.value = data
      // Auto-select first if none selected yet
      if (!activeRouter.value && data.length > 0) {
        activeRouter.value = data[0]
      }
    } finally {
      loading.value = false
    }
  }

  function setActiveRouter(router: MikrotikRouter) {
    activeRouter.value = router
  }

  return { routers, activeRouter, loading, fetchRouters, setActiveRouter }
}
