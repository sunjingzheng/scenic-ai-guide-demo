import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: process.env.WEB_HOST || 'localhost',
    port: Number(process.env.WEB_PORT || 5173)
  },
  preview: {
    host: process.env.WEB_HOST || 'localhost',
    port: Number(process.env.PREVIEW_PORT || 4173)
  }
})
