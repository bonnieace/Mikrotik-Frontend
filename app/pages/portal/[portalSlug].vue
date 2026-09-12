<script setup lang="ts">
import type { CustomerPayment, CustomerPlan, PublicPortal } from '~~/shared/customer'
import { customerPaymentButton, customerPaymentMessage, paymentIsWaiting } from '~~/shared/customer'

definePageMeta({ layout: 'default', customerPortal: true, key: (route) => route.path })

interface LegacyPlan extends CustomerPlan {
  id: string
  amount: number
  label: string
  sub: string
  icon: string
  featured: boolean
}

const route = useRoute()
const config = useRuntimeConfig()
const plans = ref<LegacyPlan[]>([])
const portal = ref<PublicPortal | null>(null)
const portalLoading = ref(true)
const portalError = ref('')
const portalNotice = ref('')
const selectedPlan = ref<LegacyPlan | null>(null)
const phoneNumber = ref('')
const customerReference = ref('')
const submittingPayment = ref(false)
const paymentError = ref('')
const paymentSuccess = ref('')
const paymentProgress = ref('')
const paymentStage = ref('idle')
let componentActive = true
let paymentAttempt = 0

const ticketUsername = ref('')
const ticketPassword = ref('')

const mac = computed(() => String(route.query.mac || ''))
const ip = computed(() => String(route.query.ip || ''))
const linkOrig = computed(() => String(route.query['link-orig'] || ''))
const rawLinkLogin = computed(() => String(route.query['link-login-only'] || route.query['link-login'] || ''))
const portalSlug = computed(() => String(route.params.portalSlug || route.query.portal || ''))

const isPrivateIpv4 = (hostname: string) => {
  const octets = hostname.split('.').map(Number)
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return false
  const [first = 0, second = 0] = octets
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168)
}

function configuredHotspotHosts(): string[] {
  try {
    const raw = typeof config.public.hotspotLoginUrls === 'string'
      ? JSON.parse(config.public.hotspotLoginUrls || '{}')
      : config.public.hotspotLoginUrls
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
    return Object.values(raw as Record<string, unknown>)
      .filter((value): value is string => typeof value === 'string')
      .map((value) => new URL(value).host)
  } catch {
    return []
  }
}

const linkLogin = computed(() => {
  if (!rawLinkLogin.value || rawLinkLogin.value.length > 2048) return ''
  try {
    const url = new URL(rawLinkLogin.value, window.location.href)
    const configuredHosts = configuredHotspotHosts()
    const trustedHost = url.host === window.location.host || isPrivateIpv4(url.hostname)
      || url.hostname.endsWith('.local') || url.hostname.endsWith('.lan') || configuredHosts.includes(url.host)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !trustedHost) return ''
    return url.toString()
  } catch {
    return ''
  }
})

const canSubmitLogin = computed(() => !!linkLogin.value)
const paymentButtonText = computed(() => submittingPayment.value ? customerPaymentButton(paymentStage.value) : 'Submit Payment')

const updatePaymentProgress = (payment: CustomerPayment) => {
  paymentStage.value = payment.status
  paymentProgress.value = customerPaymentMessage(payment)
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} minutes`
  if (minutes < 1440) return `${minutes / 60} hour${minutes === 60 ? '' : 's'}`
  const days = minutes / 1440
  return `${days} day${days === 1 ? '' : 's'}`
}

const planIcon = (minutes: number) => minutes <= 60 ? 'timer' : minutes <= 1440 ? 'calendar' : minutes <= 4320 ? 'calendar-range' : minutes < 43200 ? 'calendar-days' : 'star'

function legacyErrorMessage(error: unknown, fallback: string) {
  const message = apiError(error)
  return message && message !== 'Request failed.' ? message : fallback
}

const loadPortal = async () => {
  if (!portalSlug.value) {
    portalError.value = 'This portal link is missing its ISP identifier.'
    portalLoading.value = false
    return
  }
  try {
    portal.value = await $fetch<PublicPortal>('/api/customer/portals/' + encodeURIComponent(portalSlug.value), {
      retry: 0,
      timeout: 40000,
    })
    plans.value = portal.value.packages.map((item, index, all) => ({
      ...item,
      id: item.uid,
      amount: Number(item.price),
      label: item.service_type === 'pppoe' ? 'PPPOE RENEWAL' : 'HOTSPOT ACCESS',
      sub: item.rate_limit || 'Instant activation',
      icon: planIcon(item.validity_minutes),
      featured: index === all.length - 1,
    }))
  } catch (error) {
    portalError.value = legacyErrorMessage(error, 'This ISP portal is unavailable.')
  } finally {
    portalLoading.value = false
  }
}

onMounted(loadPortal)
onUnmounted(() => { componentActive = false })

const openPlanPopup = (plan: LegacyPlan) => {
  paymentError.value = ''
  paymentSuccess.value = ''
  paymentProgress.value = ''
  paymentStage.value = 'idle'
  phoneNumber.value = ''
  customerReference.value = ''
  selectedPlan.value = plan
}

const closePlanPopup = () => {
  paymentAttempt += 1
  selectedPlan.value = null
  paymentError.value = ''
  phoneNumber.value = ''
  customerReference.value = ''
  submittingPayment.value = false
  paymentSuccess.value = ''
  paymentProgress.value = ''
  paymentStage.value = 'idle'
}

const normalizePhoneNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    if (cleaned.length !== 10) throw new Error("Phone numbers starting with '0' must have 10 digits.")
    return `254${cleaned.slice(1)}`
  }
  if (cleaned.startsWith('254')) {
    if (cleaned.length !== 12) throw new Error("Phone numbers starting with '254' must have 12 digits.")
    return cleaned
  }
  throw new Error('Please enter a valid phone number starting with 0 or 254.')
}

const submitPortalLogin = () => {
  if (!canSubmitLogin.value) return
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = linkLogin.value
  const values = { username: ticketUsername.value, password: ticketPassword.value, dst: linkOrig.value || window.location.origin, popup: 'true' }
  Object.entries(values).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

const pollPayment = async (initial: CustomerPayment, attempt: number) => {
  const deadline = Math.min(new Date(initial.expires_at).getTime(), Date.now() + 16 * 60_000)
  let result = initial
  updatePaymentProgress(result)
  while (componentActive && attempt === paymentAttempt && Date.now() < deadline && paymentIsWaiting(result.status)) {
    await wait(2500)
    result = await $fetch<CustomerPayment>('/api/customer/payments/' + encodeURIComponent(initial.payment_id), {
      retry: 0,
      timeout: 40000,
    })
    updatePaymentProgress(result)
  }
  return result
}

const submitPayment = async () => {
  if (!selectedPlan.value) return
  paymentError.value = ''

  let processedPhoneNumber = ''
  try {
    processedPhoneNumber = normalizePhoneNumber(phoneNumber.value.trim())
  } catch (error) {
    paymentError.value = (error as Error).message
    return
  }

  if (selectedPlan.value.service_type === 'pppoe' && !customerReference.value.trim()) {
    paymentError.value = 'Enter the PPPoE username to renew.'
    return
  }

  submittingPayment.value = true
  paymentSuccess.value = ''
  paymentStage.value = 'submitting'
  paymentProgress.value = 'Securely contacting M-Pesa. Keep this window open.'
  const attempt = ++paymentAttempt

  try {
    const request = {
      package_uid: selectedPlan.value.uid,
      phone_number: processedPhoneNumber,
      ...(selectedPlan.value.service_type === 'pppoe' ? { customer_reference: customerReference.value.trim() } : {}),
    }
    const idempotencyKey = globalThis.crypto?.randomUUID?.() || `portal-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const initial = await $fetch<CustomerPayment>('/api/customer/portals/' + encodeURIComponent(portalSlug.value) + '/payments', {
      method: 'POST',
      body: request,
      headers: { 'X-Portal-Request': '1', 'Idempotency-Key': idempotencyKey },
      retry: 0,
      timeout: 40000,
    })
    const result = await pollPayment(initial, attempt)
    if (!componentActive || attempt !== paymentAttempt) return
    if (result.status !== 'provisioned') {
      throw new Error(customerPaymentMessage(result))
    }
    if (selectedPlan.value.service_type === 'pppoe') {
      paymentSuccess.value = `Payment confirmed. PPPoE account ${result.account || customerReference.value} is active.`
      paymentProgress.value = ''
      return
    }
    if (!result.credentials?.username || !result.credentials?.password) throw new Error('Access was activated, but credentials are no longer available. Contact support with the payment ID.')
    ticketUsername.value = result.credentials.username
    ticketPassword.value = result.credentials.password
    if (canSubmitLogin.value) {
      closePlanPopup()
      submitPortalLogin()
    } else {
      paymentSuccess.value = `Access active. Username: ${ticketUsername.value} — Password: ${ticketPassword.value}`
      paymentProgress.value = ''
    }
  } catch (error) {
    paymentError.value = legacyErrorMessage(error, (error as Error)?.message || 'Unable to complete payment. Please try again.')
    paymentProgress.value = ''
  } finally {
    if (attempt === paymentAttempt) submittingPayment.value = false
  }
}

useHead({ title: computed(() => `${portal.value?.name || 'Uzanet Hotspot'} · Internet access`) })
</script>

<template>
  <div class="portal-root">
    <aside class="portal-sidebar">
      <div class="sidebar-content">
        <div class="sidebar-logo-row">
          <LegacyLucideIcon name="wifi" :size="32" class="sidebar-wifi-icon" />
          <span class="sidebar-brand-name">{{ portal?.name || 'Uzanet Hotspot' }}</span>
        </div>
        <h2 class="sidebar-heading">Fast.<br>Reliable.<br>Instant.</h2>
        <p class="sidebar-tagline">Get online in seconds. Pay easily with M-Pesa and browse at full speed — no fuss, no waiting.</p>
        <ul class="sidebar-features">
          <li class="sidebar-feature"><div class="sidebar-feature-icon-wrap"><LegacyLucideIcon name="zap" :size="20" /></div><span>Instant activation</span></li>
          <li class="sidebar-feature"><div class="sidebar-feature-icon-wrap"><LegacyLucideIcon name="shield" :size="20" /></div><span>Secure connection</span></li>
          <li class="sidebar-feature"><div class="sidebar-feature-icon-wrap"><LegacyLucideIcon name="gauge" :size="20" /></div><span>High-speed browsing</span></li>
          <li class="sidebar-feature"><div class="sidebar-feature-icon-wrap"><LegacyLucideIcon name="credit-card" :size="20" /></div><span>Easy M-Pesa payment</span></li>
        </ul>
        <div class="sidebar-trust"><LegacyLucideIcon name="lock" :size="14" />Secured by Uzanet &amp; M-Pesa</div>
      </div>
    </aside>

    <div class="portal-right-pane">
      <header class="portal-topbar">
        <div class="portal-topbar-inner">
          <div class="topbar-brand"><LegacyLucideIcon name="wifi" :size="22" class="topbar-wifi" /><span class="topbar-title">{{ portal?.name || 'Uzanet Hotspot' }}</span></div>
          <div class="topbar-actions">
            <button class="topbar-icon-btn" type="button" aria-label="Help"><LegacyLucideIcon name="help-circle" :size="20" /></button>
            <button class="topbar-icon-btn" type="button" aria-label="Language"><LegacyLucideIcon name="globe" :size="20" /></button>
          </div>
        </div>
      </header>

      <main class="portal-scroll-pane">
        <div class="portal-content-inner">
          <p v-if="portalError" class="portal-warning"><LegacyLucideIcon name="alert-triangle" :size="18" class="warn-icon" /> {{ portalError }}</p>
          <p v-if="portalNotice" class="field-hint">{{ portalNotice }}</p>
          <div class="hero-banner"><div class="hero-text"><h1 class="hero-heading">Welcome Back</h1><p class="hero-sub">Experience high-velocity browsing.</p></div></div>

          <section class="portal-section">
            <div class="section-header"><LegacyLucideIcon name="credit-card" :size="20" class="section-icon" /><h2 class="section-title">Choose an internet package</h2></div>
            <div class="plan-list">
              <div v-if="portalLoading" class="plans-loading" role="status" aria-live="polite">
                <div class="plans-loading-header">
                  <div class="package-loader-mark" aria-hidden="true"><span class="package-loader-ring"></span><LegacyLucideIcon name="wifi" :size="22" /></div>
                  <div><p class="plans-loading-title">Finding available packages</p><p class="plans-loading-copy">Connecting securely to your internet provider…</p></div>
                </div>
                <div v-for="item in 3" :key="item" class="plan-skeleton" aria-hidden="true">
                  <span class="skeleton-icon"></span><span class="skeleton-copy"><i></i><i></i></span><span class="skeleton-price"></span>
                </div>
              </div>
              <button v-for="plan in plans" :key="plan.id" type="button" class="plan-row" :class="{ 'plan-row--featured': plan.featured }" @click="openPlanPopup(plan)">
                <div class="plan-icon-wrap" :class="{ 'plan-icon-wrap--featured': plan.featured }"><LegacyLucideIcon :name="plan.icon" :size="22" /></div>
                <div class="plan-info"><p class="plan-label" :class="{ 'plan-label--featured': plan.featured }">{{ plan.label }}</p><p class="plan-name">{{ plan.name }}</p></div>
                <div class="plan-pricing"><p class="plan-price">Ksh. {{ plan.amount }}</p><p class="plan-sub" :class="{ 'plan-sub--featured': plan.featured }">{{ plan.sub }}</p></div>
              </button>
              <p v-if="!portalLoading && !portalError && !plans.length" class="plans-empty">No active internet packages are available right now.</p>
            </div>
          </section>

          <div class="or-divider"><div class="or-line"></div><span class="or-text">OR</span><div class="or-line"></div></div>

          <section class="ticket-card">
            <div class="ticket-card-header"><LegacyLucideIcon name="ticket" :size="22" class="ticket-icon" /><h2 class="section-title">Login with ticket</h2></div>
            <p v-if="!canSubmitLogin" class="portal-warning"><LegacyLucideIcon name="alert-triangle" :size="18" class="warn-icon" />The captive-router login address is missing or not trusted. Payment can still activate access, but automatic login is disabled.</p>
            <form class="ticket-form" @submit.prevent="submitPortalLogin">
              <div class="form-group"><label for="portal-username" class="form-label">USERNAME</label><div class="input-wrap"><LegacyLucideIcon name="user" :size="18" class="input-icon-ms" /><input id="portal-username" v-model="ticketUsername" type="text" name="username" placeholder="Enter ticket number" class="form-input" required /></div></div>
              <div class="form-group"><label for="portal-password" class="form-label">PASSWORD</label><div class="input-wrap"><LegacyLucideIcon name="lock" :size="18" class="input-icon-ms" /><input id="portal-password" v-model="ticketPassword" type="password" name="password" placeholder="••••••••" class="form-input" required /></div></div>
              <button type="submit" class="login-btn" :disabled="!canSubmitLogin">Log In<LegacyLucideIcon name="arrow-right" :size="18" /></button>
            </form>
            <p class="ticket-recover">Lost your ticket? <a href="#" class="recover-link">Recover access</a></p>
          </section>
        </div>
      </main>

      <footer class="portal-footer">
        <div class="footer-inner">
          <div class="footer-links"><a href="#" class="footer-link">Terms of Service</a><a href="#" class="footer-link">Privacy Policy</a><a href="#" class="footer-link">Contact Support</a></div>
          <p class="footer-copy">© {{ new Date().getFullYear() }} {{ portal?.name || 'Uzanet Hotspot' }}.</p>
          <div v-if="mac || ip" class="footer-meta"><span v-if="mac"><strong>MAC:</strong> {{ mac }}</span><span v-if="ip"><strong>IP:</strong> {{ ip }}</span></div>
        </div>
      </footer>
    </div>

    <Transition name="modal">
      <div v-if="selectedPlan" class="modal-overlay" @click.self="closePlanPopup">
        <div class="modal-card">
          <div class="modal-header">
            <button type="button" class="modal-close" aria-label="Close" @click="closePlanPopup"><LegacyLucideIcon name="x" :size="20" /></button>
            <div class="modal-hero"><div class="modal-bolt"><LegacyLucideIcon name="zap" :size="28" class="modal-bolt-icon" /></div><h3 class="modal-title">Ksh.{{ selectedPlan.amount }} for {{ selectedPlan.name }}</h3><p class="modal-subtitle">Instant high-speed internet access</p></div>
          </div>
          <div class="modal-body">
            <div class="modal-field"><label class="form-label">PAYMENT PHONE NUMBER</label><div class="input-wrap"><LegacyLucideIcon name="smartphone" :size="18" class="input-icon-ms" /><input v-model="phoneNumber" type="tel" placeholder="07XX XXX XXX" class="form-input" :disabled="submittingPayment" /></div><p class="field-hint">Enter the phone number that will approve the payment prompt</p></div>
            <div v-if="selectedPlan.service_type === 'pppoe'" class="modal-field"><label class="form-label">PPPOE USERNAME</label><div class="input-wrap"><LegacyLucideIcon name="user" :size="18" class="input-icon-ms" /><input v-model="customerReference" type="text" class="form-input" :disabled="submittingPayment" /></div></div>
            <div class="summary-grid"><div class="summary-cell"><p class="summary-label">Duration</p><p class="summary-value">{{ formatDuration(selectedPlan.validity_minutes) }}</p></div><div class="summary-cell"><p class="summary-label">Speed</p><p class="summary-value">{{ selectedPlan.rate_limit || 'Profile managed' }}</p></div></div>
            <p v-if="paymentError" class="modal-error">{{ paymentError }}</p>
            <p v-if="paymentSuccess" class="field-hint">{{ paymentSuccess }}</p>
            <div v-if="paymentProgress" class="payment-progress" role="status" aria-live="polite">
              <div class="payment-progress-motion" aria-hidden="true"><span></span><span></span><span></span><LegacyLucideIcon name="smartphone" :size="20" /></div>
              <div><p class="payment-progress-title">{{ paymentButtonText }}</p><p class="payment-progress-copy">{{ paymentProgress }}</p></div>
            </div>
            <div class="modal-actions"><button type="button" class="pay-btn" :disabled="submittingPayment" @click="submitPayment"><span v-if="submittingPayment" class="btn-loader" aria-hidden="true"></span>{{ paymentButtonText }}<LegacyLucideIcon v-if="!submittingPayment" name="arrow-right" :size="18" /></button><button type="button" class="cancel-btn" @click="closePlanPopup">Cancel and go back</button></div>
          </div>
          <div class="modal-trust"><LegacyLucideIcon name="lock" :size="14" class="trust-icon" /><span class="trust-text">SECURE {{ (portal?.payment_provider || 'PAYMENT').toUpperCase() }} GATEWAY</span></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.portal-root { min-height: 100vh; background: #f8f9ff; font-family: 'Inter', sans-serif; color: #0b1c30; display: flex; flex-direction: column; }
.portal-sidebar { display: none; }
.portal-right-pane { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.portal-topbar { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(255,255,255,.95); backdrop-filter: blur(12px); border-bottom: 1px solid #f1f5f9; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
.portal-topbar-inner { display: flex; justify-content: space-between; align-items: center; height: 64px; padding: 0 24px; max-width: 480px; margin: 0 auto; }
.topbar-brand { display: flex; align-items: center; gap: 8px; font-family: 'Manrope', sans-serif; font-size: 1.2rem; font-weight: 800; letter-spacing: -.02em; color: #0f172a; }
.topbar-wifi { color: #2563eb; }
.topbar-actions { display: flex; gap: 12px; }
.topbar-icon-btn { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: color .15s; }
.topbar-icon-btn:hover { color: #2563eb; }
.portal-scroll-pane { flex: 1; display: flex; flex-direction: column; }
.portal-content-inner { padding: 88px 24px 48px; max-width: 480px; margin: 0 auto; width: 100%; box-sizing: border-box; flex: 1; }
.hero-banner { margin-bottom: 32px; border-radius: 12px; overflow: hidden; height: 160px; position: relative; display: flex; align-items: flex-end; padding: 24px; background: linear-gradient(135deg,#0f2a5e 0%,#0a4a6e 40%,#0d7a8e 70%,#0b6a7a 100%); }
.hero-banner::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 60% 40%,rgba(56,189,248,.3) 0%,transparent 70%),radial-gradient(ellipse at 20% 80%,rgba(37,99,235,.2) 0%,transparent 60%); }
.hero-text { position: relative; z-index: 1; color: #fff; }
.hero-heading { font-family: 'Manrope', sans-serif; font-size: 2rem; font-weight: 800; letter-spacing: -.02em; line-height: 1.2; margin: 0; }
.hero-sub { font-size: .875rem; opacity: .9; margin: 2px 0 0; }
.portal-section { margin-bottom: 32px; }
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.section-icon { color: #004cca; }
.section-title { font-family: 'Manrope', sans-serif; font-size: 1.1rem; font-weight: 700; letter-spacing: -.01em; margin: 0; }
.plan-list { display: flex; flex-direction: column; gap: 10px; }
.plans-loading { padding: 18px; border: 1px solid #dce9ff; border-radius: 16px; background: linear-gradient(145deg,#f7faff,#eef5ff); box-shadow: 0 10px 28px rgba(15,42,94,.07); }
.plans-loading-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.package-loader-mark { position: relative; width: 48px; height: 48px; display: grid; place-items: center; flex-shrink: 0; border-radius: 14px; background: #fff; color: #005ce6; box-shadow: 0 8px 22px rgba(0,76,202,.12); }
.package-loader-ring { position: absolute; inset: -4px; border: 2px solid rgba(0,98,255,.28); border-radius: 17px; animation: loader-ring 1.7s ease-out infinite; }
.plans-loading-title { margin: 0 0 3px; font-weight: 750; color: #0b1c30; }
.plans-loading-copy { margin: 0; color: #657389; font-size: .8rem; line-height: 1.4; }
.plan-skeleton { display: flex; align-items: center; gap: 14px; min-height: 64px; padding: 10px; border-top: 1px solid rgba(194,211,237,.48); }
.skeleton-icon,.skeleton-copy i,.skeleton-price { display: block; background: linear-gradient(100deg,#dce6f5 20%,#f8fbff 45%,#dce6f5 70%); background-size: 220% 100%; animation: skeleton-shimmer 1.45s ease-in-out infinite; }
.skeleton-icon { width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0; }
.skeleton-copy { display: flex; flex: 1; flex-direction: column; gap: 8px; }
.skeleton-copy i { height: 9px; border-radius: 999px; }
.skeleton-copy i:first-child { width: 54%; }
.skeleton-copy i:last-child { width: 78%; }
.skeleton-price { width: 54px; height: 12px; border-radius: 999px; }
.plans-empty { margin: 0; padding: 18px; border: 1px solid #dce9ff; border-radius: 12px; background: #f7faff; color: #56647a; text-align: center; font-size: .875rem; }
@keyframes loader-ring { 0% { opacity: .8; transform: scale(.88); } 75%,100% { opacity: 0; transform: scale(1.18); } }
@keyframes skeleton-shimmer { to { background-position-x: -220%; } }
.plan-row { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #fff; border: 1px solid rgba(194,198,217,.4); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.04); cursor: pointer; text-align: left; gap: 0; transition: box-shadow .15s,transform .1s; width: 100%; }
.plan-row:hover { box-shadow: 0 6px 18px rgba(0,0,0,.08); }
.plan-row:active { transform: scale(.98); }
.plan-row--featured { border-color: rgba(0,76,202,.25); background: rgba(0,98,255,.03); box-shadow: 0 2px 12px rgba(0,76,202,.08),inset 0 0 0 1px rgba(0,76,202,.08); }
.plan-icon-wrap { width: 48px; height: 48px; border-radius: 10px; background: #e5eeff; display: flex; align-items: center; justify-content: center; color: #004cca; flex-shrink: 0; margin-right: 16px; }
.plan-icon-wrap--featured { background: #0062ff; color: #fff; }
.plan-info { flex: 1; text-align: left; }
.plan-label { font-size: .72rem; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #565e74; margin: 0 0 2px; }
.plan-label--featured { color: #004cca; }
.plan-name { font-family: 'Manrope', sans-serif; font-size: 1.1rem; font-weight: 700; color: #0b1c30; margin: 0; }
.plan-pricing { text-align: right; flex-shrink: 0; }
.plan-price { font-family: 'Manrope', sans-serif; font-size: 1.1rem; font-weight: 700; color: #004cca; margin: 0 0 2px; }
.plan-sub { font-size: .75rem; color: #565e74; margin: 0; }
.plan-sub--featured { color: #004cca; font-weight: 600; }
.or-divider { display: flex; align-items: center; gap: 16px; margin: 0 0 32px; opacity: .35; }
.or-line { flex: 1; height: 1px; background: #737687; }
.or-text { font-size: .72rem; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #0b1c30; }
.ticket-card { background: #fff; border: 1px solid rgba(194,198,217,.4); border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
.ticket-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.ticket-icon { color: #565e74; }
.ticket-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: .72rem; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #424656; }
.input-wrap { position: relative; }
.input-icon-ms { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #737687; pointer-events: none; display: flex; }
.form-input { width: 100%; height: 48px; padding: 0 16px 0 44px; border: 1px solid #c2c6d9; border-radius: 8px; font-size: .95rem; font-family: 'Inter', sans-serif; color: #0b1c30; background: #f8f9ff; outline: none; transition: border-color .15s,box-shadow .15s; box-sizing: border-box; }
.form-input:focus { border-color: #004cca; box-shadow: 0 0 0 3px rgba(0,76,202,.12); }
.form-input:disabled { opacity: .6; cursor: not-allowed; }
.login-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 56px; background: linear-gradient(180deg,#0062ff 0%,#004cca 100%); color: #fff; border: none; border-radius: 10px; font-family: 'Manrope', sans-serif; font-size: 1rem; font-weight: 700; cursor: pointer; box-shadow: 0 8px 24px rgba(0,76,202,.2); transition: transform .1s,box-shadow .15s; margin-top: 8px; }
.login-btn:hover { box-shadow: 0 12px 28px rgba(0,76,202,.3); }
.login-btn:active { transform: scale(.98); }
.login-btn:disabled { opacity: .6; cursor: not-allowed; }
.portal-warning { display: flex; align-items: center; gap: 8px; background: #fff3e8; border: 1px solid #f1cfaa; border-radius: 8px; padding: 12px; color: #a54811; font-size: .875rem; margin-bottom: 16px; }
.warn-icon { flex-shrink: 0; }
.ticket-recover { margin-top: 16px; text-align: center; font-size: .875rem; color: #424656; }
.recover-link { color: #004cca; font-weight: 600; text-decoration: underline; }
.portal-footer { border-top: 1px solid #f1f5f9; }
.footer-inner { max-width: 480px; margin: 0 auto; padding: 32px 24px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; }
.footer-link { font-size: .75rem; color: #64748b; text-decoration: none; transition: color .15s; }
.footer-link:hover { color: #0f172a; }
.footer-copy { font-size: .75rem; color: #94a3b8; margin: 0; }
.footer-meta { font-size: .8rem; color: #424656; display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
.modal-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(11,28,48,.45); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 24px; }
.modal-card { background: #fff; width: 100%; max-width: 400px; border-radius: 12px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,.18); animation: card-in .2s ease; }
@keyframes card-in { from { transform: scale(.95) translateY(8px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
.modal-header { position: relative; padding: 24px; border-bottom: 1px solid #e5eeff; }
.modal-close { position: absolute; top: 14px; right: 14px; background: none; border: none; cursor: pointer; color: #737687; padding: 4px; border-radius: 6px; display: flex; align-items: center; transition: color .15s; }
.modal-close:hover { color: #0b1c30; }
.modal-hero { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; }
.modal-bolt { width: 52px; height: 52px; background: rgba(0,98,255,.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.modal-bolt-icon { color: #004cca; }
.modal-title { font-family: 'Manrope', sans-serif; font-size: 1.2rem; font-weight: 700; color: #0b1c30; margin: 0; }
.modal-subtitle { font-size: .875rem; color: #424656; margin: 0; }
.modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.modal-field { display: flex; flex-direction: column; gap: 6px; }
.field-hint { font-size: .8rem; color: #424656; margin: 0; padding: 0 4px; }
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.summary-cell { background: #eff4ff; border: 1px solid #dce9ff; border-radius: 8px; padding: 12px; }
.summary-label { font-size: .72rem; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: #737687; margin: 0 0 2px; }
.summary-value { font-size: .95rem; font-weight: 600; color: #0b1c30; margin: 0; }
.modal-error { color: #ba1a1a; background: #ffdad6; border: 1px solid #ffb4ab; border-radius: 8px; padding: 10px 14px; font-size: .875rem; margin: 0; }
.payment-progress { display: flex; align-items: center; gap: 14px; padding: 14px; border: 1px solid #cfe0ff; border-radius: 12px; background: linear-gradient(135deg,#f4f8ff,#edf5ff); box-shadow: inset 0 1px 0 rgba(255,255,255,.8); }
.payment-progress-motion { position: relative; width: 44px; height: 44px; display: grid; place-items: center; flex-shrink: 0; border-radius: 13px; background: #fff; color: #005ce6; box-shadow: 0 7px 18px rgba(0,76,202,.12); }
.payment-progress-motion span { position: absolute; inset: 4px; border: 1.5px solid rgba(0,98,255,.34); border-radius: 11px; animation: payment-wave 1.8s ease-out infinite; }
.payment-progress-motion span:nth-child(2) { animation-delay: .38s; }
.payment-progress-motion span:nth-child(3) { animation-delay: .76s; }
.payment-progress-title { margin: 0 0 3px; color: #0b1c30; font-size: .875rem; font-weight: 750; }
.payment-progress-copy { margin: 0; color: #5f6f87; font-size: .76rem; line-height: 1.45; }
@keyframes payment-wave { 0% { opacity: .7; transform: scale(.72); } 80%,100% { opacity: 0; transform: scale(1.28); } }
.modal-actions { display: flex; flex-direction: column; gap: 10px; }
.pay-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 56px; background: linear-gradient(180deg,#0062ff 0%,#004cca 100%); color: #fff; border: none; border-radius: 10px; font-family: 'Manrope', sans-serif; font-size: 1rem; font-weight: 700; cursor: pointer; box-shadow: 0 8px 20px rgba(0,76,202,.2); transition: transform .1s,box-shadow .15s; }
.pay-btn:hover { box-shadow: 0 12px 28px rgba(0,76,202,.3); }
.pay-btn:active { transform: scale(.98); }
.pay-btn:disabled { opacity: .7; cursor: not-allowed; }
.cancel-btn { background: none; border: none; cursor: pointer; color: #737687; font-size: .875rem; font-weight: 600; padding: 8px; border-radius: 6px; transition: color .15s,background .15s; letter-spacing: .01em; }
.cancel-btn:hover { color: #0b1c30; background: #f1f5f9; }
.modal-trust { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 16px; opacity: .5; }
.trust-icon { display: flex; }
.trust-text { font-size: .72rem; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; }
.btn-loader { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; display: inline-block; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .package-loader-ring,.skeleton-icon,.skeleton-copy i,.skeleton-price,.payment-progress-motion span,.btn-loader { animation: none; }
}
.modal-enter-active,.modal-leave-active { transition: opacity .2s ease; }
.modal-enter-from,.modal-leave-to { opacity: 0; }
.sidebar-content { padding: 48px 40px; color: #fff; display: flex; flex-direction: column; gap: 28px; width: 100%; position: relative; z-index: 1; }
.sidebar-logo-row { display: flex; align-items: center; gap: 10px; }
.sidebar-wifi-icon { color: #7dd3fc; }
.sidebar-brand-name { font-family: 'Manrope', sans-serif; font-size: 1.3rem; font-weight: 800; letter-spacing: -.02em; }
.sidebar-heading { font-family: 'Manrope', sans-serif; font-size: 2.6rem; font-weight: 800; letter-spacing: -.03em; line-height: 1.15; margin: 0; }
.sidebar-tagline { font-size: .95rem; line-height: 1.65; color: rgba(255,255,255,.72); margin: 0; }
.sidebar-features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.sidebar-feature { display: flex; align-items: center; gap: 12px; font-size: .95rem; font-weight: 500; color: rgba(255,255,255,.88); }
.sidebar-feature-icon-wrap { width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sidebar-trust { display: flex; align-items: center; gap: 6px; font-size: .72rem; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: rgba(255,255,255,.4); margin-top: auto; }
@media (min-width: 640px) { .portal-content-inner,.portal-topbar-inner,.footer-inner { max-width: 560px; } }
@media (min-width: 1024px) {
  .portal-root { flex-direction: row; height: 100vh; overflow: hidden; }
  .portal-sidebar { display: flex; flex: 1; min-width: 0; background: linear-gradient(160deg,#0f2a5e 0%,#0a4a6e 50%,#0d7a8e 100%); align-items: center; justify-content: center; position: relative; overflow: hidden; }
  .portal-sidebar::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 70% 25%,rgba(56,189,248,.25) 0%,transparent 60%),radial-gradient(ellipse at 25% 75%,rgba(37,99,235,.2) 0%,transparent 55%); pointer-events: none; }
  .portal-right-pane { flex: 1; min-width: 0; overflow: hidden; }
  .portal-topbar { position: relative; top: auto; left: auto; right: auto; }
  .portal-topbar-inner { max-width: none; padding: 0 48px; }
  .portal-scroll-pane { flex: 1; overflow-y: auto; min-height: 0; }
  .portal-content-inner { padding: 48px 64px; max-width: 620px; margin: 0 auto; }
  .hero-banner { display: none; }
  .portal-footer { flex-shrink: 0; }
  .footer-inner { max-width: none; padding: 16px 48px; flex-direction: row; justify-content: space-between; align-items: center; text-align: left; gap: 24px; }
  .footer-links { gap: 24px; justify-content: flex-start; }
}
</style>
