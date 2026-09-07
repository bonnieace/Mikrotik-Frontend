import { checkoutBody, paymentIsWaiting, type CustomerPayment, type CustomerPlan, type SavedCheckout } from '../../shared/customer.ts'

export function useCustomerCheckout(slug: string) {
  const saved = ref<SavedCheckout | null>(null)
  const payment = ref<CustomerPayment | null>(null)
  const busy = ref(false)
  const error = ref('')
  const notice = ref('')
  const storageKey = 'uzanet-checkout:' + slug
  let alive = true
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let deadline = 0

  function persist() {
    try {
      if (saved.value) sessionStorage.setItem(storageKey, JSON.stringify(saved.value))
      else sessionStorage.removeItem(storageKey)
    } catch { notice.value = 'Recovery storage is unavailable. Keep this page open until payment finishes and save the reference.' }
  }
  function schedule() {
    clearTimeout(timer)
    if (!alive || !payment.value || !paymentIsWaiting(payment.value.status) || document.hidden) return
    if (Date.now() >= deadline) { notice.value = 'Automatic checking has paused. Use Check status; do not pay again while this request is unresolved.'; return }
    timer = setTimeout(() => { void check() }, 3000)
  }
  async function send(recover = false) {
    if (!saved.value || busy.value || !alive) return
    clearTimeout(timer)
    busy.value = true; error.value = ''
    controller = new AbortController()
    const current = saved.value
    try {
      const result = await $fetch<CustomerPayment>(recover || !current.paymentId
        ? '/api/customer/portals/' + slug + '/payments'
        : '/api/customer/payments/' + current.paymentId, {
        method: recover || !current.paymentId ? 'POST' : 'GET',
        ...(recover || !current.paymentId ? { body: current.body, headers: { 'X-Portal-Request': '1', 'Idempotency-Key': current.key } } : {}),
        retry: 0, timeout: 40000, signal: controller.signal,
      })
      if (!alive || saved.value?.key !== current.key) return
      payment.value = result
      saved.value = { ...current, paymentId: result.payment_id }
      persist()
      schedule()
    } catch (e) {
      if (alive && saved.value?.key === current.key) error.value = apiError(e) + ' Keep this request and check or recover it before paying again.'
    } finally { if (alive) busy.value = false }
  }
  async function start(plan: CustomerPlan, phone: string, account: string) {
    if (saved.value || busy.value) return
    error.value = ''; notice.value = ''
    let body
    try { body = checkoutBody(plan, phone, account) }
    catch (e) { error.value = (e as Error).message; return }
    saved.value = { key: crypto.randomUUID(), body, createdAt: Date.now() }
    persist() // Persist BEFORE the first POST; a lost response must reuse this key/body.
    deadline = Date.now() + 16 * 60 * 1000
    await send()
  }
  async function check() {
    if (!saved.value) return
    if (!deadline || Date.now() >= deadline) deadline = Date.now() + 16 * 60 * 1000
    await send()
  }
  async function recover() {
    if (!saved.value) return
    deadline = Date.now() + 16 * 60 * 1000
    await send(true)
  }
  function dismiss() {
    if (busy.value) return
    clearTimeout(timer); controller?.abort()
    saved.value = null; payment.value = null; error.value = ''; notice.value = ''
    persist()
  }
  function visibility() {
    clearTimeout(timer)
    if (!document.hidden && saved.value?.paymentId && (!payment.value || paymentIsWaiting(payment.value.status))) void check()
  }
  onMounted(() => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) {
        const item = JSON.parse(raw) as SavedCheckout
        if (!/^[a-zA-Z0-9_-]{8,80}$/.test(item.key) || !item.body || typeof item.createdAt !== 'number') throw new Error()
        saved.value = item
        notice.value = 'Your previous request is saved. Check its status or recover the same request before starting another payment.'
        if (item.paymentId) void check()
      }
    } catch { error.value = 'A saved request could not be read. If you already paid, contact your ISP before starting another payment.' }
    document.addEventListener('visibilitychange', visibility)
  })
  onUnmounted(() => { alive = false; clearTimeout(timer); controller?.abort(); document.removeEventListener('visibilitychange', visibility) })
  return { saved, payment, busy, error, notice, start, check, recover, dismiss }
}
