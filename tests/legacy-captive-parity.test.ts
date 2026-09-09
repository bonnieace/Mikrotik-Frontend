import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const page = fs.readFileSync(new URL('../app/pages/portal/[portalSlug].vue', import.meta.url), 'utf8')
const middleware = fs.readFileSync(new URL('../app/middleware/auth.global.ts', import.meta.url), 'utf8')

test('legacy captive slug route keeps the old resolver and MikroTik query parameters', () => {
  assert.match(middleware, /portal\.isp_identifier/)
  assert.match(middleware, /query: to\.query/)
  assert.match(middleware, /\/portal\//)
})

test('captive page keeps the old portal visual and interaction contract', () => {
  for (const marker of [
    'Fast.<br>Reliable.<br>Instant.',
    'Choose an internet package',
    'Login with ticket',
    'PAYMENT PHONE NUMBER',
    'Cancel and go back',
  ]) assert.ok(page.includes(marker), `missing legacy captive marker: ${marker}`)
})

test('captive payment uses one STK initiation POST then status polling, not the new checkout state machine', () => {
  assert.doesNotMatch(page, /useCustomerCheckout/)
  assert.match(page, /method: 'POST'/)
  assert.match(page, /\/api\/customer\/portals\/.*\/payments/)
  assert.match(page, /pollPayment\(initial, attempt\)/)
  assert.match(page, /\/api\/customer\/payments\//)
})

test('provisioned hotspot credentials are submitted back to the MikroTik login target', () => {
  assert.match(page, /ticketUsername\.value = result\.credentials\.username/)
  assert.match(page, /ticketPassword\.value = result\.credentials\.password/)
  assert.match(page, /submitPortalLogin\(\)/)
  assert.match(page, /form\.method = 'POST'/)
})
