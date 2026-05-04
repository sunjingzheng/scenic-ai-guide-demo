export function readStored(key: string) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export function writeStored(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

