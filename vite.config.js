/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // ---- Vitest test configuration ----
  // Kept inside vite.config.js (not a separate vitest.config.ts) so tests reuse
  // the same plugins/resolve config as the app. This block only affects tests.
  test: {
    globals: true,            // use describe/it/expect without importing them
    environment: 'jsdom',     // simulate a browser (document/window) in Node
    setupFiles: './src/test/setupTests.ts', // runs before every test file
    css: false,               // skip CSS processing in tests (faster)
    // Vitest auto-discovers any *.test.ts(x) / *.spec.ts(x) under src/.
    // Exclude build output and (future) Playwright e2e tests.
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],          // terminal summary + HTML report in /coverage
      exclude: [
        '**/*.config.*', '**/*.d.ts', 'src/index.tsx', 'src/main.tsx',
        'src/vite-env.d.ts', '**/types/**', 'src/test/**', 'e2e/**',
      ],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['prajakeeya.png', 'images/**/*'],
      devOptions: { enabled: false },
      manifest: {
        name: 'Prajaakeeya - Multi-Election Democratic Platform',
        short_name: 'Prajaakeeya',
        description: 'Prajaakeeya - Your Voice, Your Rule, Your Vote',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#0A0808',
        background_color: '#0A0808',
        categories: ['politics', 'social'],
        icons: [
          {
            src: '/images/favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png',
          },
          {
            src: '/images/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png',
          },
          {
            src: '/images/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: '/images/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/prajakeeya.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        screenshots: [
          {
            src: '/prajakeeya.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Keep React + MUI + emotion + framer-motion in ONE chunk.
          // Splitting React away from MUI creates a circular chunk reference
          // that can break module init order at runtime — keep them together.
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('react-router') ||
            id.includes('@mui') ||
            id.includes('@emotion') ||
            id.includes('framer-motion')
          ) {
            return 'vendor';
          }
          if (id.includes('i18next')) return 'i18n-vendor';
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    },
  }
});
