import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Allow overriding backend URL/port in dev to avoid proxy errors when backend chooses another port
  const backendTarget = env.VITE_DEV_BACKEND_URL || 'http://localhost:5000'

  return {
    plugins: [react()],
    esbuild: {
      charset: 'utf8'
    },
    server: {
      port: 5173,
      host: true, // Allow external connections
      fs: {
        strict: false
      },
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false
        },
        '/socket.io': {
          target: backendTarget,
          changeOrigin: true,
          ws: true
        }
      }
    }
  }
})