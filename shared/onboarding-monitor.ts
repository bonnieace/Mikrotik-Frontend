export function onboardingExpired(expiresAt: string, now = Date.now()): boolean {
  // Backend timestamps without an offset are UTC, as elsewhere in the portal.
  const utc = /(?:Z|[+-]\d{2}:\d{2})$/i.test(expiresAt) ? expiresAt : expiresAt + 'Z'
  return now >= Date.parse(utc)
}

// Sequential polling: restarting, hiding the page, or leaving invalidates old replies.
export function createOnboardingMonitor<T>(options: {
  load: (signal: AbortSignal) => Promise<T>
  accept: (value: T) => void
  error: (error: unknown) => void
  pending: () => boolean
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>
  cancel?: (timer: ReturnType<typeof setTimeout>) => void
}) {
  const schedule = options.schedule || setTimeout
  const cancel = options.cancel || clearTimeout
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined

  function stop() {
    ++generation
    if (timer !== undefined) cancel(timer)
    timer = undefined
    controller?.abort()
  }

  async function check() {
    stop()
    const run = generation
    const request = new AbortController()
    controller = request
    try {
      const value = await options.load(request.signal)
      if (run === generation) options.accept(value)
    } catch (error) {
      if (run === generation && !request.signal.aborted) options.error(error)
    } finally {
      if (run === generation && options.pending()) {
        timer = schedule(() => {
          void check()
        }, 5000)
      }
    }
  }

  return { check, stop }
}
