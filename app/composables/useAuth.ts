/**
 * useAuth — handles authentication against the Uzanet API.
 *
 * Token is stored in a cookie so it survives page reloads and is
 * accessible server-side for future SSR-guarded routes.
 * The cookie is NOT httpOnly (JS-set) — for production, proxy the
 * /token endpoint through a Nuxt server route so the cookie can be
 * set httpOnly by the server.
 */

interface TokenResponse {
  access_token: string
  token_type: string
}

export function useAuth() {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('uzanet_token', {
    maxAge: 60 * 60 * 8, // 8 hours — matches typical JWT exp
    sameSite: 'strict',
    secure: import.meta.env.PROD,
  })

  const isAuthenticated = computed(() => !!token.value)

  async function login(username: string, password: string): Promise<void> {
    const body = new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      scope: '',
      client_id: config.public.apiClientId,
      client_secret: config.public.apiClientSecret,
    })

    const data = await $fetch<TokenResponse>(`${config.public.apiBase}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    token.value = data.access_token
  }

  function logout() {
    token.value = null
    navigateTo('/login')
  }

  return { token, isAuthenticated, login, logout }
}
