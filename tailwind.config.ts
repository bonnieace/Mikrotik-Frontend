import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/components/**/*.{js,vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/features/**/*.{js,vue,ts}',
    './app/app.vue',
    './app/error.vue',
  ],
  /**
   * Preflight DISABLED — prevents Tailwind's CSS reset from overriding
   * Stitch-exported styles. Tailwind is utility-only in this project.
   */
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
