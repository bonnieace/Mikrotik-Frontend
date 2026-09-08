import type { Router } from '~~/shared/types'
export type MikrotikRouter = Router
export function useRouterStore() {
  const api = useApi()
  const { isAuthenticated } = useAuth()
  const routers = useState<Router[]>('routers', () => [])
  const activeRouter = useState<Router | null>('activeRouter', () => null)
  const loading = useState('routersLoading', () => false)
  const error = useState('routersError', () => '')
  const generation = useState('routersGeneration', () => 0)
  async function fetchRouters() {
    const run = ++generation.value
    loading.value = true
    error.value = ''
    try {
      const data = await api<Router[]>('routers')
      if (run !== generation.value || !isAuthenticated.value) return
      routers.value = data
      activeRouter.value = data.find(r => r.uid === activeRouter.value?.uid) || data[0] || null
    } catch (e) { if (run === generation.value) error.value = apiError(e) }
    finally { if (run === generation.value) loading.value = false }
  }
  function setActiveRouter(router: Router) { activeRouter.value = routers.value.find(r => r.uid === router.uid) || null }
  return { routers, activeRouter, loading, error, fetchRouters, setActiveRouter }
}
