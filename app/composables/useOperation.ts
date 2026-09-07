export function useOperation() {
  const busy = ref(false)
  const error = ref('')
  const message = ref('')
  let generation = 0
  const { activeRouter } = useRouterStore()
  watch(() => activeRouter.value?.uid, () => { ++generation; error.value = ''; message.value = '' })
  onUnmounted(() => { ++generation })
  async function run<T>(work: () => Promise<T>, success: (result: T) => void | Promise<void>, note = 'Saved successfully.') {
    if (busy.value) return
    const version = generation
    busy.value = true; error.value = ''; message.value = ''
    try {
      const result = await work()
      if (version === generation) { message.value = note; await success(result) }
    } catch (e) { if (version === generation) error.value = apiError(e) }
    finally { busy.value = false }
  }
  return { busy, error, message, run }
}
