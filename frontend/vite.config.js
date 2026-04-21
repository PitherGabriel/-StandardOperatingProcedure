import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_BACKEND_API_URL': JSON.stringify(
      process.env.VITE_BACKEND_API_URL || '/api'  // fallback to /api
    )
  },
  build: {
    outDir: 'dist'
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  }
})