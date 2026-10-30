import { describe, expect, it } from 'vitest'
import { DEFAULT_FONT_ID, FONT_CATALOG, isFontId } from './fonts'

describe('font catalog', () => {
  it('contains eight unique families', () => {
    expect(FONT_CATALOG).toHaveLength(8)
    expect(new Set(FONT_CATALOG.map((font) => font.id)).size).toBe(FONT_CATALOG.length)
  })

  it('keeps System Mono as the default and first fallback', () => {
    expect(DEFAULT_FONT_ID).toBe('system-mono')
    expect(FONT_CATALOG[0].id).toBe('system-mono')
  })

  it('defines readable metadata for every family', () => {
    for (const font of FONT_CATALOG) {
      expect(font.label.trim().length).toBeGreaterThan(0)
      expect(font.family.trim().length).toBeGreaterThan(0)
      expect(font.stack.trim().length).toBeGreaterThan(0)
      expect(typeof font.hasItalic).toBe('boolean')
    }
  })

  it('accepts every bundled id and rejects unknown ids', () => {
    for (const font of FONT_CATALOG) {
      expect(isFontId(font.id)).toBe(true)
    }

    expect(isFontId('missing-font')).toBe(false)
  })
})
