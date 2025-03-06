// vite.config.js
// Update your Vite configuration for production deployment

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add PWA support (optional but recommended for mobile apps)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'PRITE Study Tool',
        short_name: 'PRITE Study',
        description: 'A collaborative flashcard system for PRITE exam preparation',
        theme_color: '#4f46e5',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  define: {
    // Make sure environment variables are properly passed to the client
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  },
  build: {
    // Configure build options
    outDir: 'dist',
    sourcemap: false, // Set to true for debugging production issues
    // Optimize chunks for better loading performance
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-components': ['./src/components/common']
        }
      }
    }
  },
  // Optimize dev server during development
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Proxy API requests during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})