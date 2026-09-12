import assert from 'node:assert/strict'
import test from 'node:test'
import { checkoutBody, customerPaymentButton, customerPaymentMessage, hotspotLoginMap, normalizeCustomerPhone, paymentIsWaiting, publicCustomerPath, trustedHotspotLogin, type CustomerPayment, type CustomerPlan } from '../shared/customer.ts'

const uid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const plan = { uid, service_type: 'hotspot' } as CustomerPlan
test('public endpoints only expose catalogue, initiation and token-protected status', () => {
  assert.ok(publicCustomerPath('GET', 'portals/westlands'))
  assert.ok(publicCustomerPath('POST', 'portals/westlands/payments'))
  assert.ok(publicCustomerPath('GET', 'payments/' + uid))
  for (const path of ['routers', 'auth/token', 'portals/../../routers', 'portals/a', 'portals/Westlands', 'payments/1', 'payments/' + uid + '/retry-provisioning']) {
    assert.equal(publicCustomerPath('GET', path), false)
    assert.equal(publicCustomerPath('POST', path), false)
  }
  assert.equal(publicCustomerPath('DELETE', 'payments/' + uid), false)
})
test('checkout normalizes valid Kenya mobile numbers and sends no client price/provider', () => {
  for (const phone of ['0712345678', '+254 712 345 678', '254712345678']) assert.equal(normalizeCustomerPhone(phone), '254712345678')
  assert.equal(normalizeCustomerPhone('0112345678'), '254112345678')
  for (const phone of ['+12025550100', '07123', '0712345678oops', '254212345678']) assert.throws(() => normalizeCustomerPhone(phone))
  assert.deepEqual(checkoutBody(plan, '0712345678', 'ignored'), { package_uid: uid, phone_number: '254712345678' })
  assert.throws(() => checkoutBody({ ...plan, service_type: 'pppoe' }, '0712345678', ''))
  assert.equal(checkoutBody({ ...plan, service_type: 'pppoe' }, '0712345678', '  subscriber  ').customer_reference, 'subscriber')
})
test('paid, provisioning and review states never claim access is active', () => {
  for (const status of ['created', 'pending', 'paid', 'provisioning']) assert.ok(paymentIsWaiting(status))
  for (const status of ['provisioned', 'provisioning_failed', 'manual_review', 'failed', 'unknown']) assert.equal(paymentIsWaiting(status), false)
  for (const status of ['provisioning_failed', 'manual_review']) assert.match(customerPaymentMessage({ status } as CustomerPayment), /Do not pay again/)
  assert.match(customerPaymentMessage({ status: 'paid' } as CustomerPayment), /being activated/)
  assert.equal(customerPaymentButton('submitting'), 'Sending M-Pesa prompt…')
  assert.equal(customerPaymentButton('pending'), 'Confirm payment on your phone')
  assert.equal(customerPaymentButton('provisioning'), 'Activating your internet…')
  assert.equal(customerPaymentButton('provider-wording'), 'Checking payment status…')
  assert.match(customerPaymentMessage({ status: 'provisioned', service_type: 'pppoe' } as CustomerPayment), /renewed/)
})
test('captive targets are exact and per-ISP; query parameters cannot redirect credentials', () => {
  const config = JSON.stringify({ westlands: 'https://wifi.example/login', eastlands: 'http://192.168.88.1/login' })
  assert.equal(trustedHotspotLogin('westlands', '', config), 'https://wifi.example/login')
  assert.equal(trustedHotspotLogin('westlands', 'https://wifi.example/login', config), 'https://wifi.example/login')
  for (const target of ['https://evil.test/login', 'https://wifi.example/login?redirect=evil', 'https://wifi.example/login#evil', 'https://user:pass@wifi.example/login', 'http://192.168.88.1/login', 'javascript:alert(1)', '//wifi.example/login']) assert.equal(trustedHotspotLogin('westlands', target, config), '')
  assert.equal(trustedHotspotLogin('unknown', 'https://wifi.example/login', config), '')
  assert.equal(Object.keys(hotspotLoginMap('')).length, 0)
  assert.equal(hotspotLoginMap({ westlands: 'https://wifi.example/login' }).westlands, 'https://wifi.example/login')
  assert.equal(trustedHotspotLogin('constructor', '', '{}'), '')
  for (const value of ['[]', 'null', '{', '{"abc":"https://wifi.example/"}', '{"abc":"https://user:pass@wifi.example/login"}']) assert.throws(() => hotspotLoginMap(value))
})
