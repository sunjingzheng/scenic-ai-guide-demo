import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const live2dProjectRoot = 'D:/工作项目/挑战杯/ai-live2d-go'
const live2dSourceRoot = `${live2dProjectRoot}/src`

export default defineConfig({
  plugins: [vue()],
  publicDir: `${live2dProjectRoot}/public`,
  resolve: {
    alias: {
      '@framework': `${live2dSourceRoot}/framework`
    }
  },
  server: {
    fs: {
      allow: ['D:/code/scenic-ai-guide-demo', live2dProjectRoot]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
})
