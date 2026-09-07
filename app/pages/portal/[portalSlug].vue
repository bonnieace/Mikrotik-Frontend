<template>
  <div class="customer-page operator-page">
    <header class="customer-header">
      <a :href="'/portal/' + slug" class="customer-brand"><span class="material-symbols-outlined">wifi</span><span>{{ portal?.name || 'Uzanet' }}<small>Customer portal</small></span></a>
      <a href="/login" class="muted">Operator sign in</a>
    </header>
    <div class="customer-intro"><span class="customer-eyebrow">YOUR CONNECTION, YOUR CHOICE</span><h1>Get connected.<br />Stay connected.</h1><p>Choose hotspot access or renew your home internet in a few steps.</p></div>
    <div v-if="loading" class="notice" role="status">Loading available plans…</div>
    <div v-else-if="loadError" class="notice error" role="alert">{{ loadError }} <button @click="load">Try again</button></div>
    <div v-if="portal || saved" class="customer-grid">
      <main v-if="portal">
        <div class="customer-tabs" aria-label="Service type">
          <button :class="{ primary: service === 'hotspot' }" :aria-pressed="service === 'hotspot'" @click="service = 'hotspot'">Hotspot access</button>
          <button :class="{ primary: service === 'pppoe' }" :aria-pressed="service === 'pppoe'" @click="service = 'pppoe'">PPPoE renewal</button>
        </div>
        <p class="muted">{{ service === 'hotspot' ? 'Choose a plan for this Wi-Fi network.' : 'Renew an existing PPPoE account using its username.' }}</p>
        <p v-if="!plans.length" class="notice">No {{ service === 'hotspot' ? 'hotspot' : 'PPPoE' }} plans are currently available. Please contact your ISP.</p>
        <div class="customer-plans">
          <article v-for="plan in plans" :key="plan.uid" class="panel customer-plan" :class="{ chosen: selected?.uid === plan.uid }">
            <span class="material-symbols-outlined">{{ plan.service_type === 'hotspot' ? 'wifi' : 'router' }}</span>
            <h2>{{ plan.name }}</h2><p class="customer-price">{{ money(plan.price, plan.currency) }}</p>
            <p>{{ duration(plan.validity_minutes) }} access</p><p v-if="plan.rate_limit" class="muted">{{ plan.rate_limit }}</p><p v-if="plan.description" class="muted">{{ plan.description }}</p>
            <button class="primary" :disabled="!!saved || busy" @click="choose(plan)">{{ selected?.uid === plan.uid ? 'Selected' : 'Choose plan' }}</button>
          </article>
        </div>
        <section class="panel">
          <h2>Already have hotspot credentials?</h2><p class="muted">Use the username and password issued for this Wi-Fi network.</p>
          <p v-if="!loginTarget" class="notice">Direct sign-in is unavailable from this link. Connect to your ISP's Wi-Fi and use its network login page.</p>
          <p v-if="chapRequested" class="notice">This link requires a router challenge. Return to the network login page to sign in with your credentials.</p>
          <p v-if="loginTarget.startsWith('http:')" class="notice">This router uses an unencrypted login connection. Only continue on your ISP's trusted Wi-Fi.</p>
          <form :action="loginTarget || undefined" method="POST" @submit="connect">
            <div class="form-grid"><label class="field">Hotspot username<input v-model="username" name="username" required maxlength="125" autocomplete="off" /></label><label class="field">Hotspot password<input v-model="password" name="password" type="password" required maxlength="128" autocomplete="off" /></label></div>
            <input type="hidden" name="dst" :value="loginDestination" />
            <div class="actions"><button class="primary" :disabled="!loginTarget || chapRequested">Connect to Wi-Fi</button></div>
          </form>
        </section>
      </main>
      <aside id="customer-checkout" class="customer-checkout">
        <section class="panel">
          <h2>{{ saved ? 'Your payment' : 'Complete your purchase' }}</h2>
          <p v-if="checkoutError" class="notice error" role="alert">{{ checkoutError }}</p>
          <p v-if="notice" class="notice" role="status">{{ notice }}</p>
          <template v-if="saved">
            <p v-if="payment" class="notice" role="status">{{ customerPaymentMessage(payment) }}</p>
            <p v-else class="muted">{{ busy ? 'Sending your payment request…' : 'Your original payment request is saved. Recover it to check what happened.' }}</p>
            <p v-if="payment"><strong>{{ money(payment.amount, payment.currency) }}</strong> · {{ payment.provider === 'kopokopo' ? 'Kopo Kopo' : 'M-Pesa' }}</p>
            <label v-if="saved.paymentId" class="field">Payment reference<input readonly :value="saved.paymentId" @focus="($event.target as HTMLInputElement).select()" /></label>
            <p v-if="payment?.status === 'provisioned' && payment.service_type === 'pppoe'" class="notice">Renewed account: <strong>{{ payment.account || saved.body.customer_reference }}</strong></p>
            <div v-if="payment?.status === 'provisioned' && payment.service_type === 'hotspot'">
              <template v-if="payment.credentials"><p>Save these credentials privately.</p><pre class="secret">Username: {{ payment.credentials.username }}
Password: {{ payment.credentials.password }}</pre><p class="muted">They have been filled into the Wi-Fi login form. Tap Connect when you are ready.</p></template>
              <p v-else class="notice">Access is active, but the credentials are no longer available here. Contact your ISP with the payment reference.</p>
            </div>
            <div class="actions"><button v-if="saved.paymentId" :disabled="busy" @click="check">{{ busy ? 'Checking…' : 'Check status' }}</button><button :disabled="busy" @click="recover">Recover same request</button></div>
            <p class="muted">Recovery reuses the original request. It does not start a second charge.</p>
            <button class="customer-reset" :disabled="busy" @click="finish">{{ payment?.status === 'provisioned' ? 'Done / another purchase' : 'Leave this request' }}</button>
          </template>
          <form v-else-if="selected" @submit.prevent="start(selected, phone, account)">
            <p><strong>{{ selected.name }}</strong></p><p class="customer-price">{{ money(selected.price, selected.currency) }}</p><p class="muted">{{ duration(selected.validity_minutes) }} · {{ selected.service_type === 'hotspot' ? 'Hotspot' : 'PPPoE renewal' }}</p>
            <label class="field">M-Pesa mobile number<input v-model="phone" type="tel" autocomplete="tel" placeholder="0712345678" required maxlength="20" /></label>
            <label v-if="selected.service_type === 'pppoe'" class="field" style="margin-top: 16px">Existing PPPoE username<input v-model.trim="account" required maxlength="125" autocomplete="off" /></label>
            <p class="muted">{{ portal?.payment_provider === 'kopokopo' ? 'Processed through Kopo Kopo.' : 'Processed through M-Pesa.' }} Approve the prompt on your phone. Never enter your M-Pesa PIN on this page.</p>
            <button class="primary customer-pay" :disabled="busy">Send payment prompt</button>
          </form>
          <p v-else class="muted">Choose a plan to see your total and payment options.</p>
        </section>
        <p class="muted">Need help? Contact your ISP and quote your payment reference. Keep this page open while payment is processing.</p>
      </aside>
    </div>
    <footer class="customer-footer">Powered by Uzanet · Customer access</footer>
  </div>
</template>
<script setup lang="ts">
import { customerPaymentMessage, portalSlugPattern, trustedHotspotLogin, type CustomerPlan, type PublicPortal } from '~~/shared/customer'
import { money } from '~/utils/format'
definePageMeta({ layout: 'default', customerPortal: true, key: route => route.path })
const route = useRoute()
const slug = String(route.params.portalSlug || '')
const config = useRuntimeConfig()
const portal = ref<PublicPortal | null>(null), loading = ref(true), loadError = ref('')
const service = ref<'hotspot' | 'pppoe'>('hotspot'), selected = ref<CustomerPlan | null>(null)
const phone = ref(''), account = ref(''), username = ref(''), password = ref('')
const { saved, payment, busy, error: checkoutError, notice, start, check, recover, dismiss } = useCustomerCheckout(slug)
const plans = computed(() => (portal.value?.packages || []).filter(plan => plan.service_type === service.value))
const suppliedTarget = computed(() => String(route.query['link-login-only'] || route.query['link-login'] || ''))
const loginTarget = computed(() => trustedHotspotLogin(slug, suppliedTarget.value, config.public.hotspotLoginUrls))
const loginDestination = computed(() => loginTarget.value ? new URL('/status', loginTarget.value).href : '')
const chapRequested = computed(() => !!route.query['chap-id'] || !!route.query['chap-challenge'])
let controller: AbortController | undefined
let alive = true
useHead({ title: computed(() => (portal.value?.name || 'Uzanet') + ' · Internet access & renewals') })
async function load() {
  controller?.abort(); controller = new AbortController()
  loading.value = true; loadError.value = ''
  if (!portalSlugPattern.test(slug)) { loadError.value = 'This ISP portal link is invalid.'; loading.value = false; return }
  try {
    const result = await $fetch<PublicPortal>('/api/customer/portals/' + slug, { signal: controller.signal, retry: 0, timeout: 40000 })
    if (!alive) return
    portal.value = result
    if (!result.packages.some(plan => plan.service_type === 'hotspot')) service.value = 'pppoe'
  } catch (e) { if (alive) loadError.value = apiError(e) }
  finally { if (alive) loading.value = false }
}
function choose(plan: CustomerPlan) {
  if (saved.value) return
  selected.value = plan; account.value = ''; checkoutError.value = ''
  if (window.innerWidth <= 780) nextTick(() => document.getElementById('customer-checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
function duration(minutes: number) { return minutes < 60 ? minutes + ' minutes' : minutes < 1440 ? minutes / 60 + ' hours' : minutes / 1440 + ' days' }
function finish() {
  if (!window.confirm(payment.value?.status === 'provisioned' ? 'Save your reference and any hotspot credentials before closing this purchase. Continue?' : 'Leaving does not cancel a charge. If payment is pending or money was deducted, keep checking or contact your ISP. Leave this saved request?')) return
  dismiss(); selected.value = null; phone.value = ''; account.value = ''; username.value = ''; password.value = ''
}
function connect(event: Event) { if (!loginTarget.value || chapRequested.value) event.preventDefault() }
watch(payment, result => { if (result?.status === 'provisioned' && result.credentials) { username.value = result.credentials.username; password.value = result.credentials.password } })
onMounted(load)
onUnmounted(() => { alive = false; controller?.abort() })
</script>
<style scoped>
.customer-page { max-width: 1180px; }
.customer-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 0 30px; border-bottom: 1px solid #e2e8f0; }
.customer-brand { display: flex; gap: 12px; align-items: center; font-size: 20px; font-weight: 800; }
.customer-brand > .material-symbols-outlined { padding: 12px; background: #133c7a; color: white; border-radius: 12px; }
.customer-brand small { display: block; font-size: 12px; font-weight: 500; color: #64748b; margin-top: 4px; }
.customer-intro { padding: 42px 0 26px; }
.customer-eyebrow { color: #2563eb; font-size: 11px; font-weight: 700; letter-spacing: .13em; }
.customer-intro h1 { font-size: clamp(32px, 5vw, 52px); line-height: 1.08; letter-spacing: -.05em; margin: 14px 0; }
.customer-intro p { color: #64748b; line-height: 1.6; }
.customer-grid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(290px, 1fr); gap: 28px; align-items: start; }
.customer-tabs { display: flex; gap: 8px; }
.customer-plans { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.customer-plan { display: flex; flex-direction: column; gap: 8px; }
.customer-plan.chosen { border: 2px solid #2563eb; }
.customer-plan h2 { margin: 4px 0; }
.customer-plan p { margin: 2px 0; }
.customer-plan button { margin-top: auto; }
.customer-plan > span { color: #2563eb; }
.customer-price { font-size: 28px; font-weight: 800; letter-spacing: -.04em; margin: 16px 0; }
.customer-checkout { position: sticky; top: 24px; }
.customer-pay { width: 100%; }
.customer-reset { margin-top: 16px; }
.customer-footer { padding: 30px 0; color: #64748b; text-align: center; font-size: 12px; }
@media (max-width: 780px) { .customer-grid { grid-template-columns: 1fr; } .customer-checkout { position: static; grid-row: 1; } .customer-intro { padding-top: 28px; } }
@media (max-width: 380px) { .customer-plans { grid-template-columns: 1fr; } .customer-header > a:last-child { font-size: 12px; } }
</style>
