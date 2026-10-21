import { createError, defineEventHandler } from 'h3'
import { backend, clearPortalSession, jsonBody, requireMutation } from '../../utils/backend'

export default defineEventHandler(async event => {
  requireMutation(event)
  clearPortalSession(event)
  const body = await jsonBody(event)
  const result = await backend<{ status: string; email: string }>(event, 'auth/register', 'POST', body)
  if (result.status !== 'verification_required' || !result.email) {
    throw createError({ statusCode: 502, message: 'Invalid backend registration response.' })
  }
  return result
})
