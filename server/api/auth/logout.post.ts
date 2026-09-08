import { defineEventHandler, getCookie } from 'h3'
import { backend, clearPortalSession, requireMutation } from '../../utils/backend'
export default defineEventHandler(async event => {
  requireMutation(event)
  const token = getCookie(event, 'uzanet_session')
  try {
    if (token) await backend(event, 'auth/logout', 'POST', undefined, token)
    return { revoked: true }
  } finally { clearPortalSession(event) }
})
