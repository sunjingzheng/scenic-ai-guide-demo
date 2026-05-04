import fs from 'node:fs'
import path from 'node:path'

export function loadEnv(rootDir) {
  const envPath = path.join(rootDir, '.env')
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator).trim()
    const rawValue = trimmed.slice(separator + 1).trim()
    if (!key || process.env[key] !== undefined) continue

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}
