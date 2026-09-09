import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'

const middleware = fs.readFileSync(new URL('../app/middleware/auth.global.ts', import.meta.url), 'utf8')
const login = fs.readFileSync(new URL('../app/features/admin-login/components/AdminLoginPage.vue', import.meta.url), 'utf8')
const onboard = fs.readFileSync(new URL('../app/pages/onboard.vue', import.meta.url), 'utf8')

test('auth middleware preserves the requested operator destination', () => {
  assert.match(middleware, /query: \{ next: to\.fullPath \}/)
})

test('login only accepts local return paths and otherwise falls back to dashboard', () => {
  assert.match(login, /next\.startsWith\('\/'\)/)
  assert.match(login, /!next\.startsWith\('\/\/'\)/)
  assert.match(login, /return '\/dashboard'/)
  assert.match(login, /navigateTo\(destinationAfterLogin\(\)\)/)
})

test('marketing onboarding route creates guided router onboarding through the existing API', () => {
  assert.match(onboard, /api<Onboarding>\('routers\/onboarding'/)
  assert.match(onboard, /Generate setup command/)
  assert.match(onboard, /Copy setup command/)
})
