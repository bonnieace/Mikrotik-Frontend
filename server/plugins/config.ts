import { trustedOrigin, upstreamBase } from '../../shared/api-policy'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  upstreamBase(config.apiBase)
  if (!trustedOrigin(config.siteOrigin, config.siteOrigin)) {
    throw new Error('Set NUXT_SITE_ORIGIN to the exact portal origin, without a trailing slash.')
  }
  const origin = new URL(config.siteOrigin)
  if (!import.meta.dev && origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) {
    throw new Error('The production portal requires an HTTPS NUXT_SITE_ORIGIN.')
  }
})
