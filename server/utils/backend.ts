import { Buffer } from 'node:buffer'
import { createError, deleteCookie, getCookie, getHeader, readRawBody, setCookie, setHeader, type H3Event } from 'h3'
import { safeError, trustedOrigin, upstreamBase } from '../../shared/api-policy'

const sessionName = 'uzanet_session'
export function clearPortalSession(event: H3Event) {
  deleteCookie(event, sessionName, { path: '/' })
  deleteCookie(event, 'uzanet_token', { path: '/' }) // remove legacy browser-readable token
}
export function session(event: H3Event): string {
  const token = getCookie(event, sessionName)
  if (!token) throw createError({ statusCode: 401, message: 'Please sign in.' })
  return token
}
export function setSession(event: H3Event, token: string, expiresIn: number) {
  setCookie(event, sessionName, token, { httpOnly: true, secure: !import.meta.dev, sameSite: 'strict', path: '/', maxAge: Math.min(expiresIn, 28800) })
  deleteCookie(event, 'uzanet_token', { path: '/' })
}
export function requireMutation(event: H3Event) {
  const config = useRuntimeConfig(event)
  if (!trustedOrigin(getHeader(event, 'origin'), config.siteOrigin) || getHeader(event, 'x-portal-request') !== '1') {
    throw createError({ statusCode: 403, message: 'Untrusted request origin.' })
  }
}
export async function jsonBody(event: H3Event): Promise<Record<string, unknown>> {
  if (!/^application\/json(?:\s*;|$)/i.test(getHeader(event, 'content-type') || '')) {
    throw createError({ statusCode: 415, message: 'JSON required.' })
  }
  if (Number(getHeader(event, 'content-length')) > 16384) throw createError({ statusCode: 413 })
  const raw = await readRawBody(event)
  if (!raw || Buffer.byteLength(raw) > 16384) throw createError({ statusCode: 413 })
  try {
    const body = JSON.parse(raw)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error()
    return body
  } catch { throw createError({ statusCode: 400, message: 'Invalid JSON object.' }) }
}
export async function backend<T>(event: H3Event, path: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', body?: Record<string, unknown> | string, token?: string, publicHeaders: { 'Idempotency-Key'?: string; 'X-Payment-Token'?: string; 'X-Forwarded-For'?: string } = {}): Promise<T> {
  setHeader(event, 'Cache-Control', 'no-store, private')
  const base = upstreamBase(useRuntimeConfig(event).apiBase)
  try {
    return await $fetch<T>(base + '/' + path, {
      method, body, retry: 0, timeout: 35000, redirect: 'error',
      headers: {
        ...publicHeaders,
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(typeof body === 'string' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
    }) as T
  } catch (error) {
    const e = error as { status?: number; statusCode?: number; data?: { detail?: unknown } }
    const status = e.statusCode || e.status || 502
    // Do not expire the cookie on a background 401: a late response could erase
    // a newer login cookie. The client clears its state; FastAPI rejects the
    // old token, and explicit login/logout/password-change replace/remove it.
    throw createError({ statusCode: status >= 400 && status < 600 ? status : 502, message: safeError(status, e.data?.detail) })
  }
}
