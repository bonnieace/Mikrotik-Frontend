import assert from 'node:assert/strict'
import test from 'node:test'
import { allowedEndpoint, trustedOrigin, upstreamBase, safeError } from '../shared/api-policy.ts'
import { dateTime, money } from '../app/utils/format.ts'
const uid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
test('only supported UUID-based operator routes are available', () => {
  for (const [method, path] of [
    ['GET', 'routers'], ['POST', 'routers/onboarding'], ['PATCH', 'routers/' + uid],
    ['GET', 'routers/' + uid + '/status'], ['GET', 'routers/' + uid + '/active-users'],
    ['GET', 'routers/' + uid + '/traffic'],
    ['POST', 'routers/' + uid + '/portal/refresh'],
    ['POST', 'routers/' + uid + '/packages'], ['PATCH', 'routers/' + uid + '/packages/' + uid],
    ['POST', 'routers/' + uid + '/hotspot-users/' + uid + '/disable'],
    ['DELETE', 'routers/' + uid + '/pppoe-users/' + uid],
    ['POST', 'payments/' + uid + '/retry-provisioning'], ['POST', 'users/change-password'],
  ]) assert.equal(allowedEndpoint(method!, path!), true, path)
})
test('reject legacy IDs, secret query strings, public payments, admin jobs and arbitrary URLs', () => {
  for (const path of ['routers/1/packages', '/routers', 'https://evil.test', '../auth/token', 'routers?password=secret', 'routers/' + uid + '/status?x=1', 'jobs/expire-access', 'users', 'public/portals/example/payments', 'routers/' + uid + '/pppoe-users/' + uid + '/renew', 'routers/%2e%2e/users']) {
    for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) assert.equal(allowedEndpoint(method, path), false, path)
  }
  assert.equal(allowedEndpoint('PUT', 'routers'), false)
  assert.equal(allowedEndpoint('GET', 'routers/onboarding'), false)
})
test('CSRF trust requires exact explicit origin', () => {
  const origin = 'https://portal.example'
  assert.equal(trustedOrigin(origin, origin), true)
  for (const value of [undefined, 'null', 'https://evil.test', origin + '.evil.test', origin + '/', 'http://portal.example']) assert.equal(trustedOrigin(value, origin), false)
  assert.equal(trustedOrigin(origin, ''), false)
  assert.equal(trustedOrigin('null', 'file:///tmp'), false)
})
test('upstream config cannot contain credentials, query parameters or an unencrypted remote URL', () => {
  assert.equal(upstreamBase('https://api.uzanet.co.ke/api/v1/'), 'https://api.uzanet.co.ke/api/v1')
  assert.equal(upstreamBase('http://localhost:9000/api/v1'), 'http://localhost:9000/api/v1')
  for (const value of ['http://api.example/api/v1', 'https://user:secret@api.example/api/v1', 'https://api.example/token', 'https://api.example/api/v1?key=secret', 'https://api.example/api/v1#secret']) assert.throws(() => upstreamBase(value))
})
test('errors retain actionable known messages and safe validation text without reflecting inputs', () => {
  assert.equal(safeError(403, 'Account is disabled'), 'Account is disabled')
  assert.equal(safeError(403, 'Verify your email before signing in'), 'Verify your email before signing in')
  assert.equal(safeError(409, 'An account with this email already exists'), 'An account with this email already exists')
  assert.equal(safeError(429, 'A verification email was sent recently. Try again shortly'), 'A verification email was sent recently. Try again shortly')
  assert.equal(safeError(429, 'Account temporarily locked. Try again later'), 'Account temporarily locked. Try again later')
  assert.equal(safeError(502, 'Router traffic monitoring failed'), 'Router traffic monitoring failed')
  assert.equal(safeError(503, 'Router is unreachable'), 'Router is unreachable')
  assert.equal(safeError(409, 'No Uzanet-managed HotSpot login page was found'), 'No Uzanet-managed HotSpot login page was found')
  assert.equal(safeError(422, [{ msg: 'String should have at least 12 characters', input: 'secret' }]), 'String should have at least 12 characters')
  assert.equal(safeError(422, [{ msg: 'Value error, enter a valid email address', input: 'secret' }]), 'enter a valid email address')
  assert.ok(!safeError(500, 'mysql://root:secret@db').includes('secret'))
  assert.ok(!safeError(422, [{ input: 'secret' }]).includes('secret'))
  assert.equal(safeError(503, 'VPN provisioning agent is unavailable'), 'VPN provisioning agent is unavailable')
  assert.ok(safeError(409, 'Retire packages before deleting this router').includes('package records'))
})
test('backend naive UTC timestamps are shown in East Africa Time', () => {
  assert.equal(dateTime('2026-09-06T12:00:00'), dateTime('2026-09-06T12:00:00Z'))
  assert.equal(dateTime(null), '—')
  assert.equal(dateTime('bad'), '—')
  assert.ok(money('100.50').includes('100.50'))
})
