import { createError, defineEventHandler, getRouterParam, getRequestURL, setResponseStatus } from 'h3'
import { allowedEndpoint } from '../../../shared/api-policy'
import { backend, clearPortalSession, jsonBody, requireMutation, session } from '../../utils/backend'
export default defineEventHandler(async event => {
  const path = getRouterParam(event, 'path') || ''
  const method = event.method as 'GET' | 'POST' | 'PATCH' | 'DELETE'
  if (!allowedEndpoint(method, path) || getRequestURL(event).search) throw createError({ statusCode: 404, message: 'Endpoint not available.' })
  const token = session(event)
  if (method !== 'GET') requireMutation(event)
  const body = method === 'POST' || method === 'PATCH' ? await jsonBody(event) : undefined
  const result = await backend(event, path, method, body, token)
  if (path === 'users/change-password') clearPortalSession(event)
  if (result === undefined || result === null || result === '') { setResponseStatus(event, 204); return null }
  return result
})
