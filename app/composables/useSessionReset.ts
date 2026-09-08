import type { Operator, Router } from '~~/shared/types'

// Assign safe empty values rather than clearing refs still held by mounted components.
export function useSessionReset() {
  const user = useState<Operator | null>('operator', () => null)
  const routers = useState<Router[]>('routers', () => [])
  const active = useState<Router | null>('activeRouter', () => null)
  const loading = useState('routersLoading', () => false)
  const error = useState('routersError', () => '')
  const generation = useState('routersGeneration', () => 0)
  const epoch = useState('authEpoch', () => 0)
  const sidebar = useState('mobile-sidebar-open', () => false)
  return () => {
    ++epoch.value
    ++generation.value
    user.value = null
    routers.value = []
    active.value = null
    loading.value = false
    error.value = ''
    sidebar.value = false
  }
}
