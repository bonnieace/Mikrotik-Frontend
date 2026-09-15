import type { Operator } from '~~/shared/types'
export function useAuth() {
  const resetSession = useSessionReset()
  const snackbar = useSnackbar()
  const user = useState<Operator | null>('operator', () => null)
  const isAuthenticated = computed(() => !!user.value)
  async function checkSession() {
    user.value = await $fetch<Operator>('/api/auth/me', { retry: 0, timeout: 15000 })
  }
  async function login(username: string, password: string) {
    resetSession()
    user.value = await $fetch<Operator>('/api/auth/login', { method: 'POST', body: { username, password }, headers: { 'X-Portal-Request': '1' }, retry: 0, timeout: 40000 })
  }
  async function register(username: string, email: string, password: string) {
    resetSession()
    user.value = await $fetch<Operator>('/api/auth/register', { method: 'POST', body: { username, email, password }, headers: { 'X-Portal-Request': '1' }, retry: 0, timeout: 40000 })
  }
  async function logout() {
    let warning = ''
    try { await $fetch('/api/auth/logout', { method: 'POST', headers: { 'X-Portal-Request': '1' }, retry: 0, timeout: 40000 }) }
    catch { warning = 'Server logout could not be confirmed. Close this browser and retry when the backend is available.' }
    finally { resetSession(); await navigateTo('/login') }
    if (warning) snackbar.show(warning, 'warning', 0)
  }
  return { user, isAuthenticated, login, register, logout, checkSession }
}
