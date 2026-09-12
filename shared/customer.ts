import { UUID } from './api-policy.ts'
export const portalSlugPattern = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/
export const uuidPattern = new RegExp('^' + UUID + '$')
export interface CustomerPlan { uid: string; name: string; description: string | null; price: number | string; currency: string; service_type: 'hotspot' | 'pppoe'; validity_minutes: number; rate_limit: string | null }
export interface PublicPortal { isp_identifier: string | null; portal_slug: string; name: string; payment_provider: string; packages: CustomerPlan[] }
export interface CheckoutBody { package_uid: string; phone_number: string; customer_reference?: string }
export interface CustomerPayment { payment_id: string; status: string; provider: string; amount: number | string; currency: string; service_type: 'hotspot' | 'pppoe'; phone_number: string; message: string | null; expires_at: string; credentials?: { username: string; password: string }; account?: string }
export interface SavedCheckout { key: string; body: CheckoutBody; createdAt: number; paymentId?: string }
export function normalizeCustomerPhone(value: string): string {
  const clean = value.replace(/[\s()+-]/g, '')
  const phone = clean.startsWith('0') ? '254' + clean.slice(1) : clean
  if (!/^254[17]\d{8}$/.test(phone)) throw new Error('Enter a Kenyan mobile number, for example 0712345678 or +254712345678.')
  return phone
}
export function checkoutBody(plan: CustomerPlan, phone: string, account: string): CheckoutBody {
  if (!uuidPattern.test(plan.uid)) throw new Error('Select a valid plan.')
  if (plan.service_type === 'pppoe' && (!account.trim() || account.trim().length > 125)) throw new Error('Enter your existing PPPoE username (up to 125 characters).')
  return { package_uid: plan.uid, phone_number: normalizeCustomerPhone(phone), ...(plan.service_type === 'pppoe' ? { customer_reference: account.trim() } : {}) }
}
export function paymentIsWaiting(status: string) { return ['created', 'pending', 'paid', 'provisioning'].includes(status) }
export function customerPaymentButton(status: string): string {
  switch (status) {
    case 'submitting': return 'Sending M-Pesa prompt…'
    case 'created': return 'Preparing payment prompt…'
    case 'pending': return 'Confirm payment on your phone'
    case 'paid': case 'provisioning': return 'Activating your internet…'
    default: return 'Checking payment status…'
  }
}
export function customerPaymentMessage(payment: CustomerPayment): string {
  switch (payment.status) {
    case 'created': case 'pending': return 'Waiting for payment confirmation. Check the payment prompt on your phone.'
    case 'paid': case 'provisioning': return 'Payment received. Your internet access is being activated.'
    case 'provisioned': return payment.service_type === 'pppoe' ? 'Payment confirmed. Your PPPoE account has been renewed.' : 'Payment confirmed. Your hotspot access is ready.'
    case 'provisioning_failed': return 'Payment received, but access activation needs attention. Do not pay again; contact your ISP with this reference.'
    case 'manual_review': return 'This payment needs review. Do not pay again; contact your ISP with this reference.'
    case 'failed': return 'This payment was not completed. If money was deducted, contact your ISP before making another payment.'
    default: return 'Payment status is not confirmed. Check status or contact your ISP before paying again.'
  }
}
export function hotspotLoginMap(value: unknown): Record<string, string> {
  let raw: unknown
  try { raw = typeof value === 'string' ? JSON.parse(value || '{}') : value ?? {} } catch { throw new Error('Hotspot login URLs must be a JSON object.') }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Hotspot login URLs must be a JSON object.')
  const result: Record<string, string> = Object.create(null)
  for (const [slug, target] of Object.entries(raw)) {
    if (!portalSlugPattern.test(slug) || typeof target !== 'string') throw new Error('Invalid hotspot login mapping.')
    const url = new URL(target)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/login') throw new Error('Hotspot targets must be exact HTTP(S) /login URLs without credentials, query or fragment.')
    result[slug] = url.href
  }
  return result
}
export function trustedHotspotLogin(slug: string, supplied: string, config: unknown): string {
  try {
    const expected = hotspotLoginMap(config)[slug]
    if (!expected) return ''
    // Query parameters can confirm the configured router, never choose a different one.
    return !supplied || new URL(supplied).href === expected ? expected : ''
  } catch { return '' }
}
export function publicCustomerPath(method: string, path: string): boolean {
  return (method === 'GET' && new RegExp('^portals/' + portalSlugPattern.source.slice(1, -1) + '$').test(path))
    || (method === 'POST' && new RegExp('^portals/' + portalSlugPattern.source.slice(1, -1) + '/payments$').test(path))
    || (method === 'GET' && new RegExp('^payments/' + UUID + '$').test(path))
}
