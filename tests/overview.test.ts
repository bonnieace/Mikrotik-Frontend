import assert from 'node:assert/strict'
import test from 'node:test'
import { todayEarnings, eatDateKey } from '../app/utils/overview.ts'
import type { Payment } from '../shared/types.ts'
const now = new Date('2026-09-08T10:00:00Z')
const payment = (values: Partial<Payment> = {}): Payment => ({
  uid: 'test',
  invoice: 'fixture',
  provider: 'mpesa',
  provider_receipt: null,
  status: 'completed',
  amount: '100.25',
  user_type: 'hotspot',
  created_at: '2026-09-08T01:00:00',
  ...values,
})
test('earnings distinguish an unavailable ledger from an empty ledger', () => {
  assert.equal(todayEarnings(null, 'hotspot', now), null)
  assert.equal(todayEarnings([], 'hotspot', now), 0)
})
test('earnings use completed entries for the selected service and EAT calendar day', () => {
  const rows = [
    payment(),
    payment({ created_at: '2026-09-07T21:00:00' }),
    payment({ amount: '999', created_at: '2026-09-07T20:59:59Z' }),
    payment({ amount: '999', status: 'pending' }),
    payment({ amount: '999', user_type: 'pppoe' }),
  ]
  assert.equal(todayEarnings(rows, 'hotspot', now), 200.5)
})
test('invalid money or dates cannot silently become zero earnings', () => {
  assert.equal(todayEarnings([payment({ amount: '' })], 'hotspot', now), null)
  assert.equal(todayEarnings([payment({ amount: 'bad' })], 'hotspot', now), null)
  assert.equal(todayEarnings([payment({ created_at: 'bad' })], 'hotspot', now), null)
})
test('billing date filters agree for UTC, offset and naive backend timestamps', () => {
  assert.equal(eatDateKey('2026-09-07T21:00:00'), '2026-09-08')
  assert.equal(eatDateKey('2026-09-07T21:00:00Z'), '2026-09-08')
  assert.equal(eatDateKey('2026-09-08T00:00:00+03:00'), '2026-09-08')
  assert.equal(eatDateKey('invalid'), '')
})
