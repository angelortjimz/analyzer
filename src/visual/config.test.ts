import { describe, expect, it } from 'vitest'
import { DEFAULT_VISUAL_CONFIG, parseGlyphs } from './config'

describe('parseGlyphs', () => {
  it('preserves Unicode code points', () => {
    expect(parseGlyphs('a😀b')).toEqual(['a', '😀', 'b'])
  })

  it('uses the default pool for empty input', () => {
    expect(parseGlyphs('  \n ')).toEqual(Array.from(DEFAULT_VISUAL_CONFIG.glyphs))
  })

  it('removes whitespace so the crest has no invisible glyphs', () => {
    expect(parseGlyphs(' a\nb\t')).toEqual(['a', 'b'])
  })
})
