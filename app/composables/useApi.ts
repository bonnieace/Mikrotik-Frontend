export function apiError(error: unknown): string {
  const e = error as { data?: { message?: string }; message?: string }
  return e?.data?.message || 'Request failed. Refresh to check the result before retrying.'
}
export function useApi() {
  const resetSession = useSessionReset()
  const epoch = useState('authEpoch', () => 0)
  return async <T>(path: string, options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: Record<string, unknown>; signal?: AbortSignal } = {}): Promise<T> => {
    const requestEpoch = epoch.value
    try {
      return await $fetch<T>('/api/backend/' + path, { ...options, headers: { 'X-Portal-Request': '1' }, retry: 0, timeout: 40000 }) as T
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 401 && requestEpoch === epoch.value) {
        resetSession()
        await navigateTo('/login')
      }
      throw error
    }
  }
}
