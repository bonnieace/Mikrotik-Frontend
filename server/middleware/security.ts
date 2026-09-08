import { defineEventHandler, getRequestURL, setHeaders } from 'h3'
import { hotspotLoginMap, portalSlugPattern } from '../../shared/customer'
export default defineEventHandler(event => {
  const match = getRequestURL(event).pathname.match(/^\/portal\/([^/]+)\/?$/)
  const target = match && portalSlugPattern.test(match[1]!) ? hotspotLoginMap(useRuntimeConfig(event).public.hotspotLoginUrls)[match[1]!] : undefined
  const forms = "'self'" + (target ? ' ' + new URL(target).origin : '')
  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store, private',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'" + (import.meta.dev ? " ws: wss:" : "") + "; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action " + forms,
    ...(!import.meta.dev ? { 'Strict-Transport-Security': 'max-age=31536000' } : {}),
  })
})
