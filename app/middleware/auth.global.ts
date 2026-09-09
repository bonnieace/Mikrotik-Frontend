export default defineNuxtRouteMiddleware(async (to, from) => {
  // A full navigation applies the correct document CSP across customer/operator boundaries.
  if (import.meta.client && from.matched.length && (Boolean(to.meta.customerPortal) !== Boolean(from.meta.customerPortal) || (to.meta.customerPortal && to.params.portalSlug !== from.params.portalSlug))) {
    window.location.assign(to.fullPath)
    return abortNavigation()
  }

  if (to.meta.customerPortal === true) {
    // Compatibility-first captive portal flow:
    // keep /portal/{portalSlug} as a first-class route and let the page perform the
    // single public portal lookup used by the old Vue portal. This avoids an extra
    // resolver request + redirect before rendering and keeps older/low-end RouterOS
    // captive integrations on the shortest proven path.
    //
    // The newer ISP-qualified canonicalization is intentionally disabled for now.
    // It can be restored after the new portal has full parity with the legacy portal.
    //
    // const portalSlug = typeof to.params.portalSlug === 'string' ? to.params.portalSlug : ''
    // const ispIdentifier = typeof to.params.ispIdentifier === 'string' ? to.params.ispIdentifier : ''
    // if (portalSlug && !ispIdentifier) {
    //   const portal = await $fetch<{ isp_identifier?: string | null }>(
    //     '/api/customer/portals/' + encodeURIComponent(portalSlug),
    //   )
    //   if (portal.isp_identifier) {
    //     return navigateTo({
    //       path: '/portal/' + encodeURIComponent(portal.isp_identifier) + '/' + encodeURIComponent(portalSlug),
    //       query: to.query,
    //     }, { replace: true })
    //   }
    // }
    return
  }

  if (to.path === '/login') return
  const auth = useAuth()
  const resetSession = useSessionReset()
  try { await auth.checkSession() }
  catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    resetSession()
    if (status !== 401) useSnackbar().show('Unable to verify your session. Try signing in when the backend is available.', 'warning')
    return navigateTo({ path: '/login', query: { next: to.fullPath } })
  }
})
