export function useRouterPing() {
  const { activeRouter } = useRouterStore()
  const api = useApi()
  const isOnline = ref<boolean | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let generation = 0
  async function poll() {
    const run = ++generation
    clearTimeout(timer)
    controller?.abort()
    isOnline.value = null
    if (!activeRouter.value || document.hidden) return
    controller = new AbortController()
    try {
      const result = await api<{ status: string }>('routers/' + activeRouter.value.uid + '/status', { signal: controller.signal })
      if (run === generation) isOnline.value = result.status === 'online' ? true : result.status === 'offline' ? false : null
    } catch { /* Unknown is distinct from a router-reported offline status. */ }
    finally { if (run === generation) timer = setTimeout(poll, 30000) }
  }
  watch(() => activeRouter.value?.uid, poll)
  onMounted(() => { void poll(); document.addEventListener('visibilitychange', poll) })
  onUnmounted(() => { ++generation; controller?.abort(); clearTimeout(timer); document.removeEventListener('visibilitychange', poll) })
  return { isOnline }
}
