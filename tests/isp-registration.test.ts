import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const middleware = fs.readFileSync(new URL('../app/middleware/auth.global.ts', import.meta.url), 'utf8')
const signup = fs.readFileSync(new URL('../app/pages/signup.vue', import.meta.url), 'utf8')
const auth = fs.readFileSync(new URL('../app/composables/useAuth.ts', import.meta.url), 'utf8')
const registerHandler = fs.readFileSync(new URL('../server/api/onboarding/register.post.ts', import.meta.url), 'utf8')

test('signup is public and a new visitor to router onboarding is handed to signup', () => {
  assert.match(middleware, /to\.path === '\/login' \|\| to\.path === '\/signup'/)
  assert.match(middleware, /status === 401 && to\.path === '\/onboard'/)
  assert.match(middleware, /path: '\/signup'/)
  assert.match(middleware, /next: to\.fullPath/)
})

test('successful ISP signup returns to first-router onboarding', () => {
  assert.match(signup, /return '\/onboard'/)
  assert.match(signup, /await register\(username, form\.email\.trim\(\)\.toLowerCase\(\), form\.password\)/)
  assert.match(signup, /await navigateTo\(nextPath\.value\)/)
  assert.match(signup, /!next\.startsWith\('\/\/'\)/)
})

test('registration uses the portal BFF and keeps the backend token in the HttpOnly session', () => {
  assert.match(auth, /'\/api\/onboarding\/register'/)
  assert.match(registerHandler, /'auth\/register'/)
  assert.match(registerHandler, /setSession\(event, result\.access_token, result\.expires_in\)/)
  assert.doesNotMatch(signup, /access_token|localStorage|sessionStorage/)
})
