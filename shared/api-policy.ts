export const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const rules: [string, RegExp][] = [
  ['GET', /^routers$/], ['POST', /^routers(?:\/onboarding)?$/],
  ['PATCH|DELETE', new RegExp('^routers/' + UUID + '$')],
  ['GET', new RegExp('^routers/' + UUID + '/(?:status|active-users|traffic|payments|payment-sessions|logs|packages|hotspot-users|pppoe-users)$')],
  ['POST', new RegExp('^routers/' + UUID + '/(?:packages|hotspot-users|pppoe-users)$')],
  ['PATCH|DELETE', new RegExp('^routers/' + UUID + '/packages/' + UUID + '$')],
  ['DELETE', new RegExp('^routers/' + UUID + '/(?:hotspot-users|pppoe-users)/' + UUID + '$')],
  ['POST', new RegExp('^routers/' + UUID + '/(?:hotspot-users|pppoe-users)/' + UUID + '/(?:enable|disable)$')],
  ['POST', new RegExp('^payments/' + UUID + '/retry-provisioning$')],
  ['POST', /^users\/change-password$/],
]
export function allowedEndpoint(method: string, path: string): boolean {
  return rules.some(([methods, pattern]) => methods.split('|').includes(method) && pattern.test(path))
}
export function trustedOrigin(origin: string | undefined, configured: string): boolean {
  try {
    const expected = new URL(configured)
    return ['http:', 'https:'].includes(expected.protocol) && expected.origin === configured && origin === configured
  } catch { return false }
}
export function upstreamBase(value: string): string {
  const url = new URL(value)
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
    || url.username || url.password || url.search || url.hash || url.pathname.replace(/\/$/, '') !== '/api/v1') {
    throw new Error('NUXT_API_BASE must be an HTTPS /api/v1 URL (HTTP localhost is allowed for development)')
  }
  return value.replace(/\/$/, '')
}
export function safeError(status: number, detail: unknown): string {
  if (detail === 'Retire packages before deleting this router') return 'This router has package records and cannot currently be deleted. Keep it registered until its dependencies are resolved in the backend.'
  const operational = new Set(['VPN provisioning agent is not configured', 'VPN provisioning agent is unavailable', 'Router control host is not configured', 'Router onboarding requires an HTTPS API_PUBLIC_URL origin', 'Payment provider is not enabled', 'Portal slug is already in use', 'Router address is invalid or cannot be resolved', 'Router address is outside the configured control networks', 'Router credential must be rotated'])
  if (typeof detail === 'string' && operational.has(detail)) return detail
  const known = new Set(['Account is disabled', 'Account temporarily locked. Try again later', 'Incorrect username or password', 'Current password is incorrect', 'Superadmin access required', 'Package is inactive', 'Package not found', 'Router connection failed', 'Router operation timed out', 'A package with this name already exists', 'Hotspot username already exists', 'PPPoE username already exists on this router'])
  if (typeof detail === 'string' && known.has(detail)) return detail
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'Your account cannot perform this action.'
  if (status === 404) return 'This record is no longer available.'
  if (status === 409) return 'This action conflicts with the current record. Refresh and review it.'
  if (status === 422 || status === 400) return 'Check the form fields and try again.'
  if (status === 429) return 'Too many requests. Please wait before trying again.'
  return 'The backend could not complete this request. Refresh to check the result before retrying.'
}
