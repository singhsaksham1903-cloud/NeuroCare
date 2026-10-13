import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'


export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.svg',
      ],

      manifest: {
        name: 'Cognicare NER',
        short_name: 'Cognicare',
        description:
          'Cognitive gaming and memory assistance platform for elderly users.',
        theme_color: '#ffffff',
        background_color: '#f5f8f6',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },

      devOptions: {
        enabled: true,
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
        ],
      },
    }),
  ],
})