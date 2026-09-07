// Exercises the built Nuxt server against an isolated fake backend. Never calls the live API.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'

test('production BFF authentication, CSRF, proxy, error and cookie boundaries', { timeout: 60000 }, async t => {
  const requests = []
  let scenario = 'ok'
  const user = { id: 1, username: 'test-operator', email: null, role: 'isp' }
  const uid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
  const fakeToken = 'integration-only-token'
  let customerService = 'hotspot'
  let customerState = 'pending'
  const customerToken = 'customer-capability-not-an-operator-token'
  const customerPayment = () => ({ payment_id: uid, status: customerState, service_type: customerService, amount: '100.00', currency: 'KES', provider: 'mpesa', phone_number: '2547***678', expires_at: '2026-09-07T12:00:00', message: null, ...(customerState === 'provisioned' ? customerService === 'hotspot' ? { credentials: { username: 'hs-test', password: 'voucher-test-only' } } : { account: 'subscriber-test' } : {}) })
  const upstream = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    requests.push({ url: req.url, method: req.method, headers: req.headers, body })
    res.setHeader('content-type', 'application/json')
    if (scenario === 'disabled') { res.statusCode = 403; res.end(JSON.stringify({ detail: 'Account is disabled' })); return }
    if (scenario === 'locked') { res.statusCode = 429; res.end(JSON.stringify({ detail: 'Account temporarily locked. Try again later' })); return }
    if (scenario === 'expired') { res.statusCode = 401; res.end(JSON.stringify({ detail: 'Invalid credentials' })); return }
    if (scenario === 'fail') { res.statusCode = 503; res.end(JSON.stringify({ detail: 'mysql://root:secret@db' })); return }
    if (scenario === 'redirect') { res.statusCode = 302; res.setHeader('location', '/stolen'); res.end(); return }
    if (req.url === '/api/v1/public/portals/westlands' && req.method === 'GET') { res.end(JSON.stringify({ portal_slug: 'westlands', name: 'Test ISP', payment_provider: 'mpesa', packages: [] })); return }
    if (req.url === '/api/v1/public/portals/westlands/payments' && req.method === 'POST') { res.statusCode = 202; res.end(JSON.stringify({ ...customerPayment(), status_token: customerToken })); return }
    if (req.url === '/api/v1/public/payments/' + uid) {
      if (req.headers['x-payment-token'] !== customerToken) { res.statusCode = 404; res.end('{}'); return }
      res.end(JSON.stringify(customerPayment())); return
    }
    if (req.url === '/api/v1/auth/token') { res.end(JSON.stringify({ access_token: fakeToken, expires_in: 3600 })); return }
    if (req.url === '/api/v1/me') { res.end(JSON.stringify(user)); return }
    if (req.url === '/api/v1/auth/logout' || req.url === '/api/v1/users/change-password' || req.method === 'DELETE') { res.statusCode = 204; res.end(); return }
    if (req.url === '/api/v1/routers' && req.method === 'GET') { res.end(JSON.stringify([{ uid, name: 'Test router' }])); return }
    res.end(JSON.stringify({ ok: true }))
  })
  upstream.listen(0, '127.0.0.1')
  await once(upstream, 'listening')
  const reservation = createServer()
  reservation.listen(0, '127.0.0.1')
  await once(reservation, 'listening')
  const port = reservation.address().port
  await new Promise(resolve => reservation.close(resolve))
  const origin = 'http://127.0.0.1:' + port
  const processHandle = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), HOST: '127.0.0.1', NUXT_SITE_ORIGIN: origin, NUXT_API_BASE: 'http://127.0.0.1:' + upstream.address().port + '/api/v1', NUXT_PUBLIC_HOTSPOT_LOGIN_URLS: '{"westlands":"https://wifi.example/login"}', NUXT_CUSTOMER_IP_HEADER: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  processHandle.stdout.on('data', chunk => { output += chunk })
  processHandle.stderr.on('data', chunk => { output += chunk })
  t.after(async () => {
    processHandle.kill('SIGTERM')
    await new Promise(resolve => upstream.close(resolve))
  })
  let ready = false
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(origin + '/api/health')).ok) { ready = true; break } } catch { /* Wait for local server startup. */ }
    await delay(100)
  }
  assert.ok(ready, 'Nuxt server did not start: ' + output)
  const headers = { Origin: origin, 'X-Portal-Request': '1', 'Content-Type': 'application/json' }
  const cookie = 'uzanet_session=' + fakeToken
  async function request(path, options = {}) { return fetch(origin + path, options) }

  await t.test('health and application shell have defensive headers and no credentials', async () => {
    for (const path of ['/api/health', '/login', '/dashboard', '/routers', '/network-users', '/hotspot-users', '/service-plans', '/billing', '/settings']) {
      const result = await request(path)
      assert.equal(result.status, 200, path)
      assert.match(result.headers.get('cache-control'), /no-store/)
      assert.equal(result.headers.get('x-frame-options'), 'DENY')
      assert.match(result.headers.get('content-security-policy'), /frame-ancestors 'none'/)
      assert.ok(!(await result.text()).includes(fakeToken))
    }
  })
  await t.test('anonymous API calls fail even with a caller-supplied bearer token', async () => {
    const count = requests.length
    assert.equal((await request('/api/backend/routers', { headers: { Authorization: 'Bearer injected' } })).status, 401)
    assert.equal((await request('/api/auth/me')).status, 401)
    assert.equal(requests.length, count)
  })
  await t.test('login and mutations reject missing or foreign origins', async () => {
    const count = requests.length
    for (const Origin of ['', 'https://evil.test']) {
      assert.equal((await request('/api/auth/login', { method: 'POST', headers: { ...headers, Origin }, body: '{}' })).status, 403)
      assert.equal((await request('/api/backend/routers', { method: 'POST', headers: { ...headers, Origin, Cookie: cookie }, body: '{}' })).status, 403)
    }
    assert.equal((await request('/api/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{}' })).status, 403)
    assert.equal(requests.length, count)
  })
  await t.test('login sets a secure HttpOnly cookie but returns only operator information', async () => {
    const result = await request('/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ username: 'test-operator', password: 'test-password' }) })
    assert.equal(result.status, 200)
    assert.deepEqual(await result.json(), user)
    const cookies = result.headers.getSetCookie()
    const session = cookies.find(value => value.startsWith('uzanet_session=' + fakeToken))
    for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Max-Age=3600']) assert.ok(session.includes(attribute))
    assert.ok(cookies.some(value => value.startsWith('uzanet_token=') && value.includes('Max-Age=0')))
    assert.equal(requests.at(-2).url, '/api/v1/auth/token')
    assert.equal(requests.at(-2).body, 'username=test-operator&password=test-password&grant_type=password')
    assert.equal(requests.at(-1).url, '/api/v1/me')
  })
  await t.test('disabled and locked accounts retain a useful error; failed login clears the prior cookie', async () => {
    for (const [mode, status, message] of [['disabled', 403, 'Account is disabled'], ['locked', 429, 'Account temporarily locked. Try again later']]) {
      scenario = mode
      const result = await request('/api/auth/login', { method: 'POST', headers: { ...headers, Cookie: cookie }, body: JSON.stringify({ username: 'test-operator', password: 'test-password' }) })
      assert.equal(result.status, status)
      assert.equal((await result.json()).message, message)
      assert.ok(result.headers.getSetCookie().some(value => value.startsWith('uzanet_session=') && value.includes('Max-Age=0')))
    }
    scenario = 'ok'
  })
  await t.test('identity and UUID requests use only the cookie bearer; secrets stay in JSON not URLs', async () => {
    assert.deepEqual(await (await request('/api/auth/me', { headers: { Cookie: cookie } })).json(), user)
    const result = await request('/api/backend/routers', { headers: { Cookie: cookie, Authorization: 'Bearer attacker', 'X-Admin-Secret': 'attacker' } })
    assert.equal(result.status, 200)
    assert.equal(requests.at(-1).headers.authorization, 'Bearer ' + fakeToken)
    assert.equal(requests.at(-1).headers['x-admin-secret'], undefined)
    assert.equal(requests.at(-1).headers.cookie, undefined)
    await request('/api/backend/routers', { method: 'POST', headers: { ...headers, Cookie: cookie }, body: JSON.stringify({ password: 'router-secret' }) })
    assert.equal(requests.at(-1).url, '/api/v1/routers')
    assert.equal(JSON.parse(requests.at(-1).body).password, 'router-secret')
    for (const suffix of ['packages', 'hotspot-users', 'pppoe-users', 'payments', 'payment-sessions', 'logs', 'active-users', 'traffic', 'status']) {
      assert.equal((await request('/api/backend/routers/' + uid + '/' + suffix, { headers: { Cookie: cookie } })).status, 200)
      assert.equal(requests.at(-1).url, '/api/v1/routers/' + uid + '/' + suffix)
    }
  })
  await t.test('unsupported endpoints, methods and query strings never reach the backend', async () => {
    const count = requests.length
    for (const path of ['routers?password=secret', 'routers/1/packages', 'users', 'jobs/expire-access', 'https://evil.test', 'public/portals/test/payments']) {
      assert.equal((await request('/api/backend/' + path, { headers: { Cookie: cookie } })).status, 404, path)
    }
    assert.equal((await request('/api/backend/routers', { method: 'PUT', headers: { ...headers, Cookie: cookie }, body: '{}' })).status, 404)
    assert.equal(requests.length, count)
  })
  await t.test('malformed, oversized and non-JSON bodies are rejected', async () => {
    const count = requests.length
    for (const [body, status, contentType] of [['{', 400, 'application/json'], ['[]', 400, 'application/json'], ['x'.repeat(17000), 413, 'application/json'], ['{}', 415, 'text/plain'], ['{}', 415, 'application/jsonp']]) {
      assert.equal((await request('/api/backend/routers', { method: 'POST', headers: { ...headers, Cookie: cookie, 'Content-Type': contentType }, body })).status, status)
    }
    assert.equal(requests.length, count)
  })
  await t.test('failed mutations are not retried and internal backend errors are not leaked', async () => {
    scenario = 'fail'
    const count = requests.length
    const result = await request('/api/backend/routers/onboarding', { method: 'POST', headers: { ...headers, Cookie: cookie }, body: '{}' })
    assert.equal(result.status, 503)
    assert.ok(!(await result.text()).includes('mysql://'))
    assert.equal(requests.length, count + 1)
    scenario = 'ok'
  })
  await t.test('upstream redirects are not followed with authentication', async () => {
    scenario = 'redirect'
    const count = requests.length
    assert.equal((await request('/api/backend/routers', { headers: { Cookie: cookie } })).status, 502)
    assert.equal(requests.length, count + 1)
    scenario = 'ok'
  })
  await t.test('expired upstream session is rejected without overwriting a newer login cookie', async () => {
    scenario = 'expired'
    const result = await request('/api/backend/routers', { headers: { Cookie: cookie } })
    assert.equal(result.status, 401)
    assert.equal(result.headers.getSetCookie().length, 0)
    scenario = 'ok'
  })
  await t.test('204 deletes and password changes work; password change clears session', async () => {
    assert.equal((await request('/api/backend/routers/' + uid, { method: 'DELETE', headers: { ...headers, Cookie: cookie } })).status, 204)
    const result = await request('/api/backend/users/change-password', { method: 'POST', headers: { ...headers, Cookie: cookie }, body: JSON.stringify({ current_password: 'old', new_password: 'new-test-password' }) })
    assert.equal(result.status, 204)
    assert.ok(result.headers.getSetCookie().some(value => value.startsWith('uzanet_session=') && value.includes('Max-Age=0')))
  })
  await t.test('logout revokes at backend and clears local cookie even if revocation fails', async () => {
    for (const mode of ['ok', 'fail']) {
      scenario = mode
      const result = await request('/api/auth/logout', { method: 'POST', headers: { ...headers, Cookie: cookie } })
      assert.equal(result.status, mode === 'ok' ? 200 : 503)
      assert.equal(requests.at(-1).url, '/api/v1/auth/logout')
      assert.ok(result.headers.getSetCookie().some(value => value.startsWith('uzanet_session=') && value.includes('Max-Age=0')))
    }
    scenario = 'ok'
  })
  await t.test('customer portal and catalogue are public; operator routes stay protected', async () => {
    const page = await request('/portal/westlands?link-login=https://evil.test/login')
    assert.equal(page.status, 200)
    assert.match(page.headers.get('content-security-policy'), /form-action 'self' https:\/\/wifi.example/)
    assert.ok(!page.headers.get('content-security-policy').includes('evil.test'))
    assert.ok(!(await request('/login')).headers.get('content-security-policy').includes('wifi.example'))
    const catalogue = await request('/api/customer/portals/westlands', { headers: { Cookie: cookie, Authorization: 'Bearer attacker' } })
    assert.equal(catalogue.status, 200)
    assert.equal((await catalogue.json()).name, 'Test ISP')
    assert.equal(requests.at(-1).headers.authorization, undefined)
    assert.equal(requests.at(-1).headers.cookie, undefined)
    assert.equal((await request('/api/backend/routers')).status, 401)
  })
  await t.test('checkout forwards the original idempotency key and keeps status capability HttpOnly', async () => {
    const body = JSON.stringify({ package_uid: uid, phone_number: '0712345678' })
    for (let i = 0; i < 2; i++) {
      const response = await request('/api/customer/portals/westlands/payments', { method: 'POST', headers: { ...headers, 'Idempotency-Key': 'same-original-request', Cookie: cookie, Authorization: 'Bearer attacker', 'X-Forwarded-For': '203.0.113.99' }, body })
      assert.equal(response.status, 202)
      const result = await response.json()
      assert.equal(result.payment_id, uid)
      assert.equal(result.status_token, undefined)
      const capability = response.headers.getSetCookie().find(c => c.startsWith('uzanet_payment='))
      for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/api/customer/payments/' + uid]) assert.ok(capability.includes(attribute))
      assert.ok(!response.headers.getSetCookie().some(c => c.startsWith('uzanet_session=')))
      const last = requests.at(-1)
      assert.equal(last.headers['idempotency-key'], 'same-original-request')
      assert.equal(last.headers.authorization, undefined)
      assert.equal(last.headers.cookie, undefined)
      assert.notEqual(last.headers['x-forwarded-for'], '203.0.113.99')
      assert.equal(JSON.parse(last.body).phone_number, '254712345678')
    }
  })
  await t.test('customer writes reject foreign origins, missing keys, price overrides and unsupported paths', async () => {
    const count = requests.length
    const body = { package_uid: uid, phone_number: '0712345678' }
    for (const [extraHeaders, payload, status] of [
      [{ Origin: 'https://evil.test', 'Idempotency-Key': 'original-request' }, body, 403],
      [{}, body, 400],
      [{ 'Idempotency-Key': 'original-request' }, { ...body, amount: 1 }, 400],
      [{ 'Idempotency-Key': 'original-request' }, { ...body, phone_number: '07123' }, 400],
    ]) assert.equal((await request('/api/customer/portals/westlands/payments', { method: 'POST', headers: { ...headers, ...extraHeaders }, body: JSON.stringify(payload) })).status, status)
    for (const path of ['routers', 'auth/token', 'payments/' + uid + '?token=secret', 'payments/' + uid + '/retry-provisioning']) assert.equal((await request('/api/customer/' + path)).status, 404)
    assert.equal(requests.length, count)
  })
  await t.test('payment status requires its own capability and never uses operator authentication', async () => {
    const count = requests.length
    assert.equal((await request('/api/customer/payments/' + uid, { headers: { Cookie: cookie, 'X-Payment-Token': customerToken } })).status, 404)
    assert.equal(requests.length, count)
    for (const service of ['hotspot', 'pppoe']) {
      customerService = service
      for (const status of ['pending', 'paid', 'provisioning', 'provisioning_failed', 'manual_review', 'provisioned', 'failed']) {
        customerState = status
        const result = await request('/api/customer/payments/' + uid, { headers: { Cookie: 'uzanet_payment=' + customerToken + '; ' + cookie } })
        assert.equal(result.status, 200)
        const value = await result.json()
        assert.equal(value.status, status)
        assert.equal(Boolean(value.credentials), service === 'hotspot' && status === 'provisioned')
        assert.equal(Boolean(value.account), service === 'pppoe' && status === 'provisioned')
        assert.equal(requests.at(-1).headers.authorization, undefined)
        assert.equal(requests.at(-1).headers['x-payment-token'], customerToken)
      }
    }
  })
})
