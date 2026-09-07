import { defineEventHandler, setHeaders } from 'h3'
export default defineEventHandler(event => {
  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store, private',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'" + (import.meta.dev ? " ws: wss:" : "") + "; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    ...(!import.meta.dev ? { 'Strict-Transport-Security': 'max-age=31536000' } : {}),
  })
})
