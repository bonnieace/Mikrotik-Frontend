export default defineNuxtRouteMiddleware(async (to, from) => {
  // A full navigation applies the correct document CSP across customer/operator boundaries.
  if (import.meta.client && from.matched.length && (Boolean(to.meta.customerPortal) !== Boolean(from.meta.customerPortal) || (to.meta.customerPortal && to.params.portalSlug !== from.params.portalSlug))) {
    window.location.assign(to.fullPath)
    return abortNavigation()
  }
  if (to.meta.customerPortal === true) return
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
