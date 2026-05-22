import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { execSync } from 'child_process'

const commitCount = execSync('git rev-list --count HEAD').toString().trim()
const now = new Date()
const kyiv = new Date(now.getTime() + 3 * 60 * 60 * 1000)
const pad = (n: number) => String(n).padStart(2, '0')
const time = `${pad(kyiv.getUTCHours())}:${pad(kyiv.getUTCMinutes())}:${pad(kyiv.getUTCSeconds())}`
const date = `${pad(kyiv.getUTCDate())}.${pad(kyiv.getUTCMonth() + 1)}.${String(kyiv.getUTCFullYear()).slice(2)}`
const buildLabel = `Каспер. Крок за кроком. v.0.1.${commitCount} ${time} ${date}`

export default defineConfig({
  test: {
    // Vitest: Node середовище (IndexedDB не тестується напряму)
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // resolve.alias успадковується з vite resolve нижче
  },
  define: {
    __BUILD_LABEL__: JSON.stringify(buildLabel),
  },
  // GitHub Pages serves at /casper-sbs/ — must match repo name
  base: '/casper-sbs/',
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Каспер. Крок за кроком.',
        short_name: 'Каспер',
        start_url: '/casper-sbs/',
        scope: '/casper-sbs/',
        display: 'standalone',
        background_color: '#FFF7EC',
        theme_color: '#053E35',
        lang: 'uk',
        icons: [
          { src: 'pwa-64x64.png',  sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mp3}'],
        navigateFallback: '/casper-sbs/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
