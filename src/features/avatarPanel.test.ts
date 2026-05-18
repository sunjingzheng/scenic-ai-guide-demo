import { describe, expect, it } from 'vitest'
import { DEFAULT_CHAT_EXPANDED } from './avatarPanel'

describe('avatarPanel', () => {
  it('keeps the chat box collapsed by default so the digital human is the main focus', () => {
    expect(DEFAULT_CHAT_EXPANDED).toBe(false)
  })
})
