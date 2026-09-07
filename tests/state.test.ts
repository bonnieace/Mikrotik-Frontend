import assert from 'node:assert/strict'
import test from 'node:test'
import { createRenderer, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

// Headless Vue lifecycle tests: no browser, backend, payment provider or router is used.
const states = new Map()
let selected = ref<{ uid: string } | null>(null)
let request: (...args: unknown[]) => Promise<unknown>
const useState = (key: string, init = () => undefined) => {
  if (!states.has(key)) states.set(key, ref(init()))
  return states.get(key)
}
Object.assign(globalThis, {
  ref, computed, watch, onMounted, onUnmounted, useState,
  useRouterStore: () => ({ activeRouter: selected }),
  useApi: () => (...args: unknown[]) => request(...args),
  apiError: () => 'Request failed',
})
const { useRouterData } = await import('../app/composables/useRouterData.ts')
const { useOperation } = await import('../app/composables/useOperation.ts')
const { useSessionReset } = await import('../app/composables/useSessionReset.ts')
const { useApi } = await import('../app/composables/useApi.ts')
Object.assign(globalThis, { useSessionReset })
const renderer = createRenderer({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
})
function mount<T>(factory: () => T) {
  let value: T
  const app = renderer.createApp({ setup() { value = factory(); return () => null } })
  app.mount({})
  return { value: value!, unmount: () => app.unmount() }
}
function deferred() {
  let resolve: (value: unknown) => void, reject: (reason: unknown) => void
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve: resolve!, reject: reject! }
}
async function flush() { await nextTick(); await Promise.resolve(); await nextTick() }

test('router switch cancels old read and ignores its late success', async () => {
  selected = ref({ uid: 'router-a' })
  const a = deferred(), b = deferred()
  const signals: AbortSignal[] = []
  request = async (path, options) => {
    signals.push((options as { signal: AbortSignal }).signal)
    return path === 'routers/router-a/packages' ? a.promise : b.promise
  }
  const scope = mount(() => useRouterData<string[]>('packages'))
  selected.value = { uid: 'router-b' }
  await flush()
  assert.equal(signals[0]!.aborted, true)
  b.resolve(['router-b-plan'])
  await flush()
  a.resolve(['router-a-plan'])
  await flush()
  assert.deepEqual(scope.value.data.value, ['router-b-plan'])
  assert.equal(scope.value.error.value, '')
  scope.unmount()
  assert.equal(signals[1]!.aborted, true)
})
test('late failures from another router cannot replace current data with an error', async () => {
  selected = ref({ uid: 'router-a' })
  const a = deferred()
  request = async path => path === 'routers/router-a/payments' ? a.promise : ['router-b-payment']
  const scope = mount(() => useRouterData<string[]>('payments'))
  selected.value = { uid: 'router-b' }
  await flush()
  a.reject(new Error('old failure'))
  await flush()
  assert.deepEqual(scope.value.data.value, ['router-b-payment'])
  assert.equal(scope.value.error.value, '')
  scope.unmount()
})
test('read errors are distinct from empty results and session reset clears selected data', async () => {
  selected = ref({ uid: 'router-a' })
  request = async () => { throw new Error('outage') }
  const scope = mount(() => useRouterData<string[]>('packages'))
  await flush()
  assert.equal(scope.value.data.value, null)
  assert.equal(scope.value.error.value, 'Request failed')
  request = async () => []
  await scope.value.refresh()
  assert.deepEqual(scope.value.data.value, [])
  assert.equal(scope.value.error.value, '')
  selected.value = null
  await flush()
  assert.equal(scope.value.data.value, null)
  scope.unmount()
})
test('mutations prevent double-submit and suppress stale cross-router UI callbacks', async () => {
  selected = ref({ uid: 'router-a' })
  const pending = deferred()
  const scope = mount(useOperation)
  let calls = 0, callbacks = 0
  const work = () => { ++calls; return pending.promise }
  const first = scope.value.run(work, () => { ++callbacks })
  await scope.value.run(work, () => { ++callbacks })
  assert.equal(calls, 1)
  selected.value = { uid: 'router-b' }
  await flush()
  pending.resolve({ ok: true })
  await first
  assert.equal(callbacks, 0)
  assert.equal(scope.value.message.value, '')
  assert.equal(scope.value.busy.value, false)
  scope.unmount()
})
test('reset clears identity/router values without invalidating notification refs', () => {
  states.clear()
  const reset = useSessionReset()
  const user = useState('operator'), routers = useState('routers'), active = useState('activeRouter')
  const notices = useState('snackbar', () => [])
  user.value = { username: 'old' }; routers.value = [{ uid: 'old' }]; active.value = routers.value[0]
  notices.value = ['notice']
  reset()
  assert.equal(user.value, null)
  assert.deepEqual(routers.value, [])
  assert.equal(active.value, null)
  assert.deepEqual(notices.value, ['notice'])
  assert.equal(useState('authEpoch').value, 1)
  assert.equal(useState('routersGeneration').value, 1)
})
test('an old session request cannot log out a newly signed-in operator', async () => {
  states.clear()
  const pending = deferred()
  let navigations = 0
  Object.assign(globalThis, { $fetch: () => pending.promise, navigateTo: async () => { ++navigations } })
  const api = useApi()
  const operation = api('routers').catch(() => undefined)
  useSessionReset()()
  useState('operator').value = { username: 'new' }
  pending.reject({ statusCode: 401 })
  await operation
  assert.equal(navigations, 0)
  assert.equal(useState('operator').value.username, 'new')
})
