import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiHost = process.env.API_HOST || process.env.HOST || env.API_HOST || env.HOST || 'localhost'
  const apiPort = process.env.API_PORT || process.env.PORT || env.API_PORT || env.PORT || '8787'

  return {
    plugins: [vue()],
    server: {
      proxy: {
        '/api': {
          target: `http://${apiHost}:${apiPort}`,
          changeOrigin: true
        }
      }
    }
  }
})
