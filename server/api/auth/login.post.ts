import { defineEventHandler, createError } from 'h3'
import { backend, clearPortalSession, jsonBody, requireMutation, setSession } from '../../utils/backend'
import type { Operator } from '../../../shared/types'
export default defineEventHandler(async event => {
  requireMutation(event)
  clearPortalSession(event)
  const body = await jsonBody(event)
  if (typeof body.username !== 'string' || typeof body.password !== 'string' || !body.username.trim() || body.username.length > 125 || !body.password || body.password.length > 128) {
    throw createError({ statusCode: 400, message: 'Enter your username and password.' })
  }
  const result = await backend<{ access_token: string; expires_in: number }>(event, 'auth/token', 'POST', new URLSearchParams({ username: body.username.trim(), password: body.password, grant_type: 'password' }).toString())
  if (!result.access_token || !Number.isFinite(result.expires_in) || result.expires_in <= 0) throw createError({ statusCode: 502, message: 'Invalid backend login response.' })
  const user = await backend<Operator>(event, 'me', 'GET', undefined, result.access_token)
  setSession(event, result.access_token, result.expires_in)
  return user
})
