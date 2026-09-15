export default defineNuxtRouteMiddleware(async (to, from) => {
  // A full navigation applies the correct document CSP across customer/operator boundaries.
  if (import.meta.client && from.matched.length && (Boolean(to.meta.customerPortal) !== Boolean(from.meta.customerPortal) || (to.meta.customerPortal && to.params.portalSlug !== from.params.portalSlug))) {
    window.location.assign(to.fullPath)
    return abortNavigation()
  }

  if (to.meta.customerPortal === true) {
    const portalSlug = typeof to.params.portalSlug === 'string' ? to.params.portalSlug : ''
    const ispIdentifier = typeof to.params.ispIdentifier === 'string' ? to.params.ispIdentifier : ''

    // Old captive-portal HTML and saved links may still point to /portal/{slug}.
    // Resolve once through the public portal API and replace the browser URL with the
    // tenant-qualified canonical route without dropping MikroTik query parameters.
    if (portalSlug && !ispIdentifier) {
      try {
        const portal = await $fetch<{ isp_identifier?: string | null }>('/api/customer/portals/' + encodeURIComponent(portalSlug), {
          retry: 0,
          timeout: 15000,
        })
        if (portal.isp_identifier) {
          return navigateTo(
            {
              path: '/portal/' + encodeURIComponent(portal.isp_identifier) + '/' + encodeURIComponent(portalSlug),
              query: to.query,
            },
            { replace: true },
          )
        }
      } catch {
        // Let the customer page render the normal portal loading error.
      }
    }
    return
  }

  if (to.path === '/login' || to.path === '/signup' || to.path === '/verify-email') return
  const auth = useAuth()
  const resetSession = useSessionReset()
  try { await auth.checkSession() }
  catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    resetSession()
    if (status === 401 && to.path === '/onboard') {
      return navigateTo({ path: '/signup', query: { next: to.fullPath } })
    }
    if (status !== 401) useSnackbar().show('Unable to verify your session. Try signing in when the backend is available.', 'warning')
    return navigateTo({ path: '/login', query: { next: to.fullPath } })
  }
})
