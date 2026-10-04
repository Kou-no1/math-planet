import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readdir, stat, writeFile } from 'node:fs/promises'
import { getManifest } from 'workbox-build'
import {
  APP_BASE,
  APP_CACHE_PREFIX,
  APP_NAME,
  APP_THEME_COLOR,
} from './src/pwa/config'

declare const self: {
  location: { origin: string }
  registration: { scope: string }
}

// https://vite.dev/config/
export default defineConfig({
  base: APP_BASE,
  define: {
    __PWA_BUILD_ID__: JSON.stringify(
      process.env.PWA_BUILD_ID ?? 'phase-18-pwa',
    ),
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'generateSW',
      injectRegister: false,
      registerType: 'prompt',
      scope: APP_BASE,
      filename: 'sw.js',
      includeAssets: [
        'icons.svg',
        'icons/app-icon.svg',
        'icons/*.png',
        'pwa-coordination.js',
      ],
      manifest: {
        id: APP_BASE,
        name: APP_NAME,
        short_name: APP_NAME,
        lang: 'ja',
        start_url: APP_BASE,
        scope: APP_BASE,
        display: 'standalone',
        theme_color: APP_THEME_COLOR,
        background_color: APP_THEME_COLOR,
        icons: [
          {
            src: 'icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cacheId: APP_CACHE_PREFIX,
        clientsClaim: false,
        skipWaiting: false,
        // Precache activation removes obsolete entries in our cache, not other apps' caches.
        cleanupOutdatedCaches: false,
        importScripts: ['pwa-coordination.js'],
        globPatterns: ['index.html', 'assets/*.js', 'assets/*.css'],
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [new RegExp(`^${APP_BASE}`)],
        navigateFallbackDenylist: [new RegExp(`^${APP_BASE}(?:assets|icons)/`)],
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' &&
              url.origin === self.location.origin &&
              url.pathname.startsWith(
                new URL(self.registration.scope).pathname,
              ),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: `${APP_CACHE_PREFIX}-media-v1`,
              expiration: { maxEntries: 40, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
    {
      name: 'pwa-cache-audit',
      closeBundle: {
        sequential: true,
        order: 'post',
        async handler() {
          // includeAssets entries are appended after Workbox manifestTransforms.
          const { manifestEntries } = await getManifest({
            globDirectory: 'dist',
            globPatterns: [
              'index.html',
              'assets/*.js',
              'assets/*.css',
              'icons.svg',
              'icons/app-icon.svg',
              'icons/*.png',
              'pwa-coordination.js',
              'manifest.webmanifest',
            ],
          })
          const files = []
          for (const entry of manifestEntries)
            files.push({
              url: `${APP_BASE}${entry.url}`,
              bytes: (await stat(`dist/${entry.url}`)).size,
            })
          const workerFiles = []
          for (const name of await readdir('dist')) {
            if (name === 'sw.js' || /^workbox-.*\.js$/.test(name))
              workerFiles.push({
                url: `${APP_BASE}${name}`,
                bytes: (await stat(`dist/${name}`)).size,
              })
          }
          await writeFile(
            'dist/pwa-cache-report.json',
            JSON.stringify(
              {
                build: process.env.PWA_BUILD_ID ?? 'phase-18-pwa',
                files,
                workerFiles,
                totalBytes: files.reduce(
                  (total, entry) => total + entry.bytes,
                  0,
                ),
              },
              null,
              2,
            ),
          )
        },
      },
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    css: true,
    testTimeout: 60000,
    // Keep file isolation while reusing one worker under memory pressure.
    pool: 'vmThreads',
    maxWorkers: 1,
  },
})
