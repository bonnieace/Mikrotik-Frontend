import { isIP } from 'node:net'
import { createError, defineEventHandler, getCookie, getHeader, getRequestIP, getRequestURL, getRouterParam, setCookie, setResponseStatus } from 'h3'
import { backend, jsonBody, requireMutation } from '../../utils/backend'
import { publicCustomerPath, uuidPattern, normalizeCustomerPhone, type CustomerPayment } from '../../../shared/customer'

export default defineEventHandler(async event => {
  const path = getRouterParam(event, 'path') || ''
  if (!publicCustomerPath(event.method, path) || getRequestURL(event).search) throw createError({ statusCode: 404, message: 'Customer endpoint not available.' })
  if (event.method === 'POST') {
    requireMutation(event)
    const key = getHeader(event, 'idempotency-key') || ''
    if (!/^[a-zA-Z0-9_-]{8,80}$/.test(key)) throw createError({ statusCode: 400, message: 'A valid payment request key is required.' })
    const body = await jsonBody(event)
    if (Object.keys(body).some(key => !['package_uid', 'phone_number', 'customer_reference'].includes(key))
      || typeof body.package_uid !== 'string' || !uuidPattern.test(body.package_uid)
      || typeof body.phone_number !== 'string'
      || (body.customer_reference !== undefined && (typeof body.customer_reference !== 'string' || !body.customer_reference.trim() || body.customer_reference.length > 125))) {
      throw createError({ statusCode: 400, message: 'Check the selected plan and account details.' })
    }
    try { body.phone_number = normalizeCustomerPhone(body.phone_number) }
    catch { throw createError({ statusCode: 400, message: 'Enter a valid Kenyan mobile number.' }) }
    // Only trust a header when the deployment explicitly identifies an edge that overwrites it.
    const ipHeader = useRuntimeConfig(event).customerIpHeader
    const clientIp = ipHeader ? getHeader(event, ipHeader) : getRequestIP(event)
    if (ipHeader && (!clientIp || !isIP(clientIp))) throw createError({ statusCode: 400, message: 'Customer connection could not be verified.' })
    const result = await backend<CustomerPayment & { status_token: string }>(event, 'public/' + path, 'POST', body, undefined, { 'Idempotency-Key': key, ...(clientIp && isIP(clientIp) ? { 'X-Forwarded-For': clientIp } : {}) })
    if (!uuidPattern.test(result.payment_id) || !result.status_token || result.status_token.length > 512) throw createError({ statusCode: 502, message: 'Payment response could not be verified. Recover the same request before paying again.' })
    // Payment capability is isolated from the operator JWT and never exposed to JS.
    setCookie(event, 'uzanet_payment', result.status_token, { httpOnly: true, secure: !import.meta.dev, sameSite: 'strict', path: '/api/customer/payments/' + result.payment_id, maxAge: 3600 })
    const publicResult: Partial<typeof result> = { ...result }
    delete publicResult.status_token
    setResponseStatus(event, 202)
    return publicResult
  }
  if (path.startsWith('payments/')) {
    const token = getCookie(event, 'uzanet_payment')
    if (!token || token.length > 512) throw createError({ statusCode: 404, message: 'Payment tracking has expired. Recover your original request or contact your ISP with its reference.' })
    return backend<CustomerPayment>(event, 'public/' + path, 'GET', undefined, undefined, { 'X-Payment-Token': token })
  }
  return backend(event, 'public/' + path)
})
