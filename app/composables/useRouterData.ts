export function useRouterData<T>(resource: string) {
  const { activeRouter } = useRouterStore()
  const api = useApi()
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref('')
  let controller: AbortController | undefined
  let generation = 0
  async function refresh() {
    const run = ++generation
    controller?.abort()
    controller = new AbortController()
    data.value = null
    error.value = ''
    const uid = activeRouter.value?.uid
    if (!uid) { loading.value = false; return }
    loading.value = true
    try {
      const result = await api<T>('routers/' + uid + '/' + resource, { signal: controller.signal })
      if (run === generation) data.value = result
    } catch (e) { if (run === generation && !controller.signal.aborted) error.value = apiError(e) }
    finally { if (run === generation) loading.value = false }
  }
  watch(() => activeRouter.value?.uid, refresh, { immediate: true })
  onUnmounted(() => { ++generation; controller?.abort() })
  return { data, loading, error, refresh }
}
