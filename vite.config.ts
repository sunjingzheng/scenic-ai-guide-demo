import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiHost = process.env.API_HOST || process.env.HOST || env.API_HOST || env.HOST || 'localhost'
  const apiPort = process.env.API_PORT || process.env.PORT || env.API_PORT || env.PORT || '8787'
  const webHost = process.env.WEB_HOST || env.WEB_HOST || 'localhost'
  const webPort = Number(process.env.WEB_PORT || env.WEB_PORT || 5173)

  return {
    plugins: [vue()],
    server: {
      host: webHost,
      port: webPort,
      proxy: {
        '/api': {
          target: `http://${apiHost}:${apiPort}`,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: webHost,
      port: Number(process.env.PREVIEW_PORT || env.PREVIEW_PORT || 4173)
    }
  }
})
