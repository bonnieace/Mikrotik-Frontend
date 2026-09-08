import assert from 'node:assert/strict'
import test from 'node:test'
import { createRenderer, ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { CustomerPlan } from '../shared/customer.ts'

const values = new Map<string, string>()
const documentStub = new EventTarget()
Object.assign(documentStub, { hidden: true }) // Manual status checks in these lifecycle tests.
let fetcher: (path: string, options: { method: string; body?: object; headers?: Record<string, string> }) => Promise<unknown>
Object.assign(globalThis, {
  ref, onMounted, onUnmounted, document: documentStub,
  sessionStorage: { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) },
  apiError: () => 'Connection lost.',
  $fetch: (...args: Parameters<typeof fetcher>) => fetcher(...args),
})
const { useCustomerCheckout } = await import('../app/composables/useCustomerCheckout.ts')
const renderer = createRenderer({ createElement: () => ({}), createText: () => ({}), createComment: () => ({}), insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {}, parentNode: () => null, nextSibling: () => null })
function mount(slug = 'westlands') {
  let checkout: ReturnType<typeof useCustomerCheckout>
  const app = renderer.createApp({ setup() { checkout = useCustomerCheckout(slug); return () => null } })
  app.mount({})
  return { checkout: checkout!, unmount: () => app.unmount() }
}
const uid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const plan = { uid, service_type: 'hotspot' } as CustomerPlan
const result = { payment_id: uid, status: 'pending', service_type: 'hotspot' }
async function flush() { await Promise.resolve(); await nextTick(); await Promise.resolve() }

test('a timeout preserves the original key/body through reload; recovery does not mint a second request', async () => {
  values.clear()
  const calls: { key?: string; body?: object; method: string }[] = []
  fetcher = async (_path, options) => {
    assert.ok(values.has('uzanet-checkout:westlands'), 'request must be saved before POST')
    calls.push({ key: options.headers?.['Idempotency-Key'], body: options.body, method: options.method })
    if (calls.length === 1) throw new Error('lost response')
    return result
  }
  const first = mount()
  await first.checkout.start(plan, '0712345678', '')
  assert.ok(first.checkout.error.value)
  const originalKey = first.checkout.saved.value!.key
  await first.checkout.start(plan, '0799999999', '')
  assert.equal(calls.length, 1)
  first.unmount()
  const recovered = mount()
  assert.equal(recovered.checkout.saved.value!.key, originalKey)
  await recovered.checkout.recover()
  assert.equal(calls[0]!.key, calls[1]!.key)
  assert.deepEqual(calls[0]!.body, calls[1]!.body)
  assert.equal(recovered.checkout.payment.value!.status, 'pending')
  assert.ok(!values.get('uzanet-checkout:westlands')!.includes('status_token'))
  recovered.unmount()
})
test('an existing reference resumes with GET; attention states retain the reference', async () => {
  values.clear()
  values.set('uzanet-checkout:westlands', JSON.stringify({ key: 'original-request', body: { package_uid: uid, phone_number: '254712345678' }, createdAt: Date.now(), paymentId: uid }))
  const calls: string[] = []
  fetcher = async (path, options) => { calls.push(options.method + ' ' + path); return { ...result, status: 'provisioning_failed' } }
  const state = mount()
  await flush()
  assert.deepEqual(calls, ['GET /api/customer/payments/' + uid])
  assert.equal(state.checkout.payment.value!.status, 'provisioning_failed')
  assert.equal(state.checkout.saved.value!.paymentId, uid)
  await state.checkout.start(plan, '0712345678', '')
  assert.equal(calls.length, 1)
  state.unmount()
})
test('double submit is blocked and an unmounted checkout ignores late responses', async () => {
  values.clear()
  let resolve!: (value: unknown) => void
  let calls = 0
  fetcher = async () => { ++calls; return new Promise(done => { resolve = done }) }
  const state = mount()
  const pending = state.checkout.start(plan, '0712345678', '')
  await state.checkout.start(plan, '0712345678', '')
  assert.equal(calls, 1)
  state.unmount()
  resolve({ ...result, status: 'provisioned', credentials: { username: 'secret', password: 'secret' } })
  await pending
  assert.equal(state.checkout.payment.value, null)
  assert.ok(!values.get('uzanet-checkout:westlands')!.includes('secret'))
})
test('PPP renewal requires account reference and recovery is isolated by portal slug', async () => {
  values.clear()
  let calls = 0
  fetcher = async (_path, options) => { ++calls; assert.equal((options.body as { customer_reference: string }).customer_reference, 'subscriber'); return { ...result, service_type: 'pppoe', status: 'provisioned', account: 'subscriber' } }
  const state = mount()
  await state.checkout.start({ ...plan, service_type: 'pppoe' }, '0712345678', '')
  assert.equal(calls, 0)
  await state.checkout.start({ ...plan, service_type: 'pppoe' }, '0712345678', ' subscriber ')
  assert.equal(calls, 1)
  const other = mount('eastlands')
  assert.equal(other.checkout.saved.value, null)
  assert.equal(other.checkout.payment.value, null)
  state.checkout.dismiss()
  assert.equal(values.has('uzanet-checkout:westlands'), false)
  state.unmount(); other.unmount()
})
