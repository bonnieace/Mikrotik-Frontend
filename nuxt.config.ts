// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'https://api.uzanet.co.ke',
      apiClientId: process.env.NUXT_PUBLIC_API_CLIENT_ID ?? 'string',
      apiClientSecret: process.env.NUXT_PUBLIC_API_CLIENT_SECRET ?? 'string',
    },
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
  ],

  // Tailwind: utility-only, preflight OFF (prevents reset from overriding Stitch styles)
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: '~/tailwind.config.ts',
    exposeConfig: false,
    viewer: false,
  },

  // Global CSS — keep minimal; per-feature Stitch styles live in app/features/<name>/styles/
  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  app: {
    head: {
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
        },
      ],
    },
  },
})
