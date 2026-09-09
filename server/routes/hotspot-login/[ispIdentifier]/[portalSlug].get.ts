import { portalSlugPattern } from '~~/shared/customer'

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export default defineEventHandler((event) => {
  const ispIdentifier = getRouterParam(event, 'ispIdentifier') || ''
  const portalSlug = getRouterParam(event, 'portalSlug') || ''

  if (!ispIdentifier || ispIdentifier.length > 125 || !portalSlugPattern.test(portalSlug)) {
    throw createError({ statusCode: 404, message: 'Portal redirect not found.' })
  }

  const config = useRuntimeConfig(event)
  const canonicalPortal =
    config.siteOrigin +
    '/portal/' +
    encodeURIComponent(ispIdentifier) +
    '/' +
    encodeURIComponent(portalSlug)

  // These placeholders are intentionally left literal. RouterOS substitutes them when
  // serving login.html to a captive client; the -esc variants are safe in a query string.
  const redirectUrl =
    canonicalPortal +
    '?link-login-only=$(link-login-only-esc)' +
    '&link-orig=$(link-orig-esc)' +
    '&mac=$(mac-esc)' +
    '&ip=$(ip-esc)'
  const safeUrl = escapeAttribute(redirectUrl)

  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  setHeader(event, 'cache-control', 'no-store')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="cache-control" content="no-store">
  <meta http-equiv="refresh" content="0;url=${safeUrl}">
  <title>Connecting to Uzanet</title>
</head>
<body>
  <p>Opening your internet portal…</p>
  <p><a href="${safeUrl}">Continue</a></p>
</body>
</html>`
})
