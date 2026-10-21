import assert from 'node:assert/strict'
import test from 'node:test'
import { createOnboardingMonitor, onboardingExpired } from '../shared/onboarding-monitor.ts'

test('pending setup refreshes sequentially and a claimed router stops polling', async () => {
  let pending = true
  let scheduled: (() => void) | undefined
  let calls = 0
  const accepted: string[] = []
  const monitor = createOnboardingMonitor({
    load: async () => (++calls === 1 ? 'pending' : 'claimed'),
    accept: (value) => {
      accepted.push(value)
      pending = value !== 'claimed'
    },
    error: () => assert.fail('unexpected error'),
    pending: () => pending,
    schedule: (callback, delay) => {
      assert.equal(delay, 5000)
      scheduled = callback
      return 1 as unknown as ReturnType<typeof setTimeout>
    },
    cancel: () => {
      scheduled = undefined
    },
  })
  await monitor.check()
  assert.deepEqual(accepted, ['pending'])
  assert.ok(scheduled)
  await monitor.check()
  assert.deepEqual(accepted, ['pending', 'claimed'])
  assert.equal(scheduled, undefined)
})

test('leaving or restarting aborts the request and ignores its late response', async () => {
  let resolve!: (value: string) => void
  let signal!: AbortSignal
  const monitor = createOnboardingMonitor({
    load: (requestSignal) => {
      signal = requestSignal
      return new Promise<string>((done) => {
        resolve = done
      })
    },
    accept: () => assert.fail('stale reply applied'),
    error: () => assert.fail('stale error applied'),
    pending: () => true,
    schedule: () => {
      throw new Error('stopped request rescheduled')
    },
  })
  const request = monitor.check()
  monitor.stop()
  assert.equal(signal.aborted, true)
  resolve('claimed')
  await request
})

test('transient failures retry, but expired setup does not keep polling', async () => {
  let pending = true
  let scheduled = 0
  let errors = 0
  const monitor = createOnboardingMonitor({
    load: async () => {
      throw new Error('network unavailable')
    },
    accept: () => assert.fail('unexpected success'),
    error: () => {
      errors++
    },
    pending: () => pending,
    schedule: () => {
      scheduled++
      return 1 as unknown as ReturnType<typeof setTimeout>
    },
    cancel: () => {},
  })
  await monitor.check()
  assert.equal(errors, 1)
  assert.equal(scheduled, 1)
  pending = false
  await monitor.check()
  assert.equal(errors, 2)
  assert.equal(scheduled, 1)
})

test('naive backend expiry is interpreted as UTC, including on phones in EAT', () => {
  const now = Date.parse('2026-10-21T15:00:00Z')
  assert.equal(onboardingExpired('2026-10-21T15:01:00', now), false)
  assert.equal(onboardingExpired('2026-10-21T15:00:00', now), true)
  assert.equal(onboardingExpired('2026-10-21T18:00:00+03:00', now), true)
})
