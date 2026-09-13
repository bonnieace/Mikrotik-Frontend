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
  <meta name="uzanet-managed-portal" content="1">
  <meta http-equiv="refresh" content="0;url=${safeUrl}">
  <title>Connecting to Uzanet</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(145deg,#eef5ff,#f8fbff 55%,#edf9fb);color:#0b1c30;font-family:Arial,sans-serif}
    .card{width:min(100%,380px);padding:36px 28px;border:1px solid #dce9ff;border-radius:24px;background:rgba(255,255,255,.96);box-shadow:0 24px 64px rgba(15,42,94,.14);text-align:center}
    .brand{font-size:14px;font-weight:700;letter-spacing:.16em;color:#004cca;text-transform:uppercase}.signal{position:relative;width:112px;height:96px;margin:22px auto 12px}
    .signal span{position:absolute;left:50%;bottom:16px;border:6px solid #1677ff;border-color:#1677ff transparent transparent transparent;border-radius:50%;transform:translateX(-50%) rotate(45deg);animation:pulse 1.6s ease-in-out infinite}
    .signal span:nth-child(1){width:86px;height:86px}.signal span:nth-child(2){width:58px;height:58px;animation-delay:.16s}.signal span:nth-child(3){width:30px;height:30px;animation-delay:.32s}
    .signal b{position:absolute;left:50%;bottom:9px;width:12px;height:12px;border-radius:50%;background:#004cca;transform:translateX(-50%);box-shadow:0 0 0 8px #e5eeff}
    h1{margin:0;font-size:24px}p{margin:10px 0 24px;color:#56647a;line-height:1.5}.button{display:block;width:100%;padding:14px 18px;border-radius:12px;background:#005ce6;color:#fff;text-decoration:none;font-weight:700;box-shadow:0 10px 24px rgba(0,76,202,.22)}
    .hint{margin:14px 0 0;font-size:12px;color:#8490a3}@keyframes pulse{0%,100%{opacity:.3;transform:translateX(-50%) rotate(45deg) scale(.92)}50%{opacity:1;transform:translateX(-50%) rotate(45deg) scale(1)}}@media(prefers-reduced-motion:reduce){.signal span{animation:none}}
  </style>
</head>
<body>
  <main class="card" role="status" aria-live="polite">
    <div class="brand">Uzanet Wi-Fi</div>
    <div class="signal" aria-hidden="true"><span></span><span></span><span></span><b></b></div>
    <h1>Opening your internet portal</h1>
    <p>Hold on while we load the available packages.</p>
    <a class="button" href="${safeUrl}">Continue manually</a>
    <p class="hint">Use the button if the portal does not open automatically.</p>
  </main>
</body>
</html>`
})
