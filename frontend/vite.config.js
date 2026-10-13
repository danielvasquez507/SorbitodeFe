import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://sorbito-backend:3000'
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Sorbito de Fé',
        short_name: 'Sorbito Fé',
        description: 'Dashboard financiero para Sorbito de Fé',
        theme_color: '#5b21b6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'icon-512.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
})
