interface PingResult {
  id: number
  name: string
  ip_address: string
  port: number
  online: boolean
  latency_ms: number
}

interface PingResponse {
  total: number
  online: number
  offline: number
  routers: PingResult[]
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000)
  if (totalSecs < 60) return `${totalSecs} second${totalSecs !== 1 ? 's' : ''}`
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins} minute${mins !== 1 ? 's' : ''}`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours} hour${hours !== 1 ? 's' : ''}`
}

// Module-level so a single interval is shared even if the composable is called multiple times
let _interval: ReturnType<typeof setInterval> | null = null
let _offlineSnackId: number | null = null
let _initialized = false

function offlineKey(id: number): string {
  return `router_offline_since_${id}`
}
const POLL_MS = 15_000

export function useRouterPing() {
  const { activeRouter } = useRouterStore()
  const { token } = useAuth()
  const config = useRuntimeConfig()
  const { show, dismiss } = useSnackbar()

  // Shared reactive status: null = unknown/loading, true = online, false = offline
  const isOnline = useState<boolean | null>('routerPingStatus', () => null)

  function handleResult(online: boolean, router: { id: number; name: string; ip_address: string }) {
    const prev = isOnline.value
    isOnline.value = online

    if (online) {
      if (prev === false) {
        // Came back online — dismiss persistent offline snackbar
        if (_offlineSnackId !== null) {
          dismiss(_offlineSnackId)
          _offlineSnackId = null
        }
        const key = offlineKey(router.id)
        const raw = localStorage.getItem(key)
        if (raw) {
          const ts = parseInt(raw, 10)
          if (!isNaN(ts)) {
            const duration = formatDuration(Date.now() - ts)
            show(
              `Router "${router.name}" reconnected — was offline for ${duration}.`,
              'success',
              8000,
            )
          } else {
            show(`Router "${router.name}" is back online.`, 'success', 5000)
          }
          localStorage.removeItem(key)
        } else {
          show(`Router "${router.name}" is back online.`, 'success', 5000)
        }
      }
    } else {
      if (prev !== false) {
        // Just went offline
        localStorage.setItem(offlineKey(router.id), Date.now().toString())
        function onOfflineSnackDismissed() { _offlineSnackId = null }
        _offlineSnackId = show(
          `Router "${router.name}" (${router.ip_address}) is offline — check your connection or router settings.`,
          'error',
          0, // persistent until dismissed or router comes back
          onOfflineSnackDismissed,
        )
      }
    }
  }

  async function ping() {
    if (!activeRouter.value || !token.value) return
    const router = activeRouter.value
    try {
      const res = await $fetch<PingResponse>(
        `${config.public.apiBase}/routers/ping?router_id=${router.id}`,
        { headers: { Authorization: `Bearer ${token.value}` } },
      )
      const online = res?.routers?.[0]?.online ?? false
      handleResult(online, router)
    } catch {
      handleResult(false, router)
    }
  }

  function startPolling() {
    stopPolling()
    ping()
    _interval = setInterval(ping, POLL_MS)
  }

  function stopPolling() {
    if (_interval !== null) {
      clearInterval(_interval)
      _interval = null
    }
  }

  // Only set up the watcher once per app session to avoid duplicate intervals
  if (!_initialized && import.meta.client) {
    _initialized = true

    watch(
      activeRouter,
      (newRouter) => {
        isOnline.value = null
        // Dismiss any lingering offline snackbar when switching routers
        if (_offlineSnackId !== null) {
          dismiss(_offlineSnackId)
          _offlineSnackId = null
        }
        if (newRouter) startPolling()
        else stopPolling()
      },
      { immediate: true },
    )
  }

  onUnmounted(() => stopPolling())

  return { isOnline }
}
