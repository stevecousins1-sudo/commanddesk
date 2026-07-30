import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Stamped once when the bundle is built, so it identifies the deployed build
// rather than tracking the viewer's clock.
const buildTime = new Date().toISOString()

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
