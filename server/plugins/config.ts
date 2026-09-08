import { trustedOrigin, upstreamBase } from '../../shared/api-policy'
import { hotspotLoginMap } from '../../shared/customer'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  upstreamBase(config.apiBase)
  hotspotLoginMap(config.public.hotspotLoginUrls)
  if (!['', 'x-real-ip', 'cf-connecting-ip'].includes(config.customerIpHeader)) throw new Error('NUXT_CUSTOMER_IP_HEADER must be empty, x-real-ip, or cf-connecting-ip. Only enable it behind a trusted edge that overwrites the header.')
  if (!trustedOrigin(config.siteOrigin, config.siteOrigin)) {
    throw new Error('Set NUXT_SITE_ORIGIN to the exact portal origin, without a trailing slash.')
  }
  const origin = new URL(config.siteOrigin)
  if (!import.meta.dev && origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) {
    throw new Error('The production portal requires an HTTPS NUXT_SITE_ORIGIN.')
  }
})
