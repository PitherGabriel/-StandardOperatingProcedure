import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['@phosphor-icons/react'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Behind the nginx dev proxy the app is served on :80, but Vite's HMR
    // websocket defaults to the server port (5173), which isn't published to the
    // host — so hot-reload silently fails and the tab freezes on a stale bundle.
    // Point the HMR client at :80 so the websocket goes through nginx, and poll
    // for file changes so edits are detected across the Docker volume mount.
    hmr: { clientPort: 80 },
    watch: { usePolling: true, interval: 150 },
  }
})