import { createError, defineEventHandler } from 'h3'
import { backend, clearPortalSession, jsonBody, requireMutation, setSession } from '../../utils/backend'
import type { Operator } from '../../../shared/types'

export default defineEventHandler(async event => {
  requireMutation(event)
  clearPortalSession(event)
  const body = await jsonBody(event)
  const result = await backend<{ access_token: string; expires_in: number }>(event, 'auth/verify-email', 'POST', body)
  if (!result.access_token || !Number.isFinite(result.expires_in) || result.expires_in <= 0) {
    throw createError({ statusCode: 502, message: 'Invalid backend verification response.' })
  }
  const user = await backend<Operator>(event, 'me', 'GET', undefined, result.access_token)
  setSession(event, result.access_token, result.expires_in)
  return user
})
