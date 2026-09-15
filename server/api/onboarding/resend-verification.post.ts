import { defineEventHandler } from 'h3'
import { backend, jsonBody, requireMutation } from '../../utils/backend'

export default defineEventHandler(async event => {
  requireMutation(event)
  const body = await jsonBody(event)
  return await backend(event, 'auth/resend-verification', 'POST', body)
})
