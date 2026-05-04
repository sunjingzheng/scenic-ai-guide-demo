import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

function copyDirectory(from: string, to: string) {
  if (!fs.existsSync(from)) return
  fs.rmSync(to, { recursive: true, force: true })
  fs.mkdirSync(to, { recursive: true })

  for (const item of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, item.name)
    const target = path.join(to, item.name)
    if (item.isDirectory()) {
      copyDirectory(source, target)
    } else {
      fs.copyFileSync(source, target)
    }
  }
}

function dataJsonPlugin(): Plugin {
  const rootDir = process.cwd()
  const dataDir = path.join(rootDir, 'data')

  return {
    name: 'local-data-json',
    configureServer(server) {
      server.middlewares.use('/data', (req, res, next) => {
        const pathname = decodeURIComponent(req.url?.split('?')[0] || '/')
        const filePath = path.normalize(path.join(dataDir, pathname))

        if (!filePath.startsWith(dataDir) || !filePath.endsWith('.json') || !fs.existsSync(filePath)) {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(fs.readFileSync(filePath))
      })
    },
    closeBundle() {
      copyDirectory(dataDir, path.join(rootDir, 'dist', 'data'))
    }
  }
}

export default defineConfig({
  plugins: [vue(), dataJsonPlugin()],
  server: {
    host: process.env.WEB_HOST || 'localhost',
    port: Number(process.env.WEB_PORT || 5173)
  },
  preview: {
    host: process.env.WEB_HOST || 'localhost',
    port: Number(process.env.PREVIEW_PORT || 4173)
  }
})
