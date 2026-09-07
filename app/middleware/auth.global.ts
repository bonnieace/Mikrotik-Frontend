export default defineNuxtRouteMiddleware(async to => {
  if (to.path === '/login') return
  const auth = useAuth()
  const resetSession = useSessionReset()
  try { await auth.checkSession() }
  catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    resetSession()
    if (status !== 401) useSnackbar().show('Unable to verify your session. Try signing in when the backend is available.', 'warning')
    return navigateTo('/login')
  }
})
