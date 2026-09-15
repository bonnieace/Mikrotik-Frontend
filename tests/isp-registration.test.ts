import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const middleware = fs.readFileSync(new URL('../app/middleware/auth.global.ts', import.meta.url), 'utf8')
const signup = fs.readFileSync(new URL('../app/pages/signup.vue', import.meta.url), 'utf8')
const verifyPage = fs.readFileSync(new URL('../app/pages/verify-email.vue', import.meta.url), 'utf8')
const auth = fs.readFileSync(new URL('../app/composables/useAuth.ts', import.meta.url), 'utf8')
const registerHandler = fs.readFileSync(new URL('../server/api/onboarding/register.post.ts', import.meta.url), 'utf8')
const verifyHandler = fs.readFileSync(new URL('../server/api/onboarding/verify-email.post.ts', import.meta.url), 'utf8')

test('signup and email verification are public and router onboarding hands new visitors to signup', () => {
  assert.match(middleware, /to\.path === '\/verify-email'/)
  assert.match(middleware, /status === 401 && to\.path === '\/onboard'/)
  assert.match(middleware, /path: '\/signup'/)
  assert.match(middleware, /next: to\.fullPath/)
})

test('signup asks for an ISP name and does not expose identifier formatting rules', () => {
  assert.match(signup, />ISP name<\/label>/)
  assert.match(signup, /v-model="form\.ispName"/)
  assert.doesNotMatch(signup, /ISP identifier|Lowercase letters, numbers and hyphens|customer portal links/)
  assert.match(signup, /await register\(form\.ispName\.trim\(\), form\.email\.trim\(\)\.toLowerCase\(\), form\.password\)/)
})

test('signup waits for verification before first-router onboarding', () => {
  assert.match(signup, /path: '\/verify-email'/)
  assert.match(verifyPage, /await verifyEmail\(token\.value\)/)
  assert.match(verifyPage, /await navigateTo\(nextPath\.value\)/)
  assert.match(verifyPage, /return '\/onboard'/)
})

test('registration exposes no backend token until verification establishes the HttpOnly session', () => {
  assert.match(auth, /'\/api\/onboarding\/register'/)
  assert.match(auth, /'\/api\/onboarding\/verify-email'/)
  assert.match(registerHandler, /'auth\/register'/)
  assert.doesNotMatch(registerHandler, /setSession|access_token/)
  assert.match(verifyHandler, /'auth\/verify-email'/)
  assert.match(verifyHandler, /setSession\(event, result\.access_token, result\.expires_in\)/)
  assert.doesNotMatch(signup, /access_token|localStorage|sessionStorage/)
  assert.doesNotMatch(verifyPage, /localStorage|sessionStorage/)
})
