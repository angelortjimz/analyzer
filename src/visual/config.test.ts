import { describe, expect, it } from 'vitest'
import { DEFAULT_VISUAL_CONFIG, parseGlyphs } from './config'

describe('parseGlyphs', () => {
  it('preserves Unicode code points', () => {
    expect(parseGlyphs('a😀b')).toEqual(['a', '😀', 'b'])
  })

  it('uses the default ramp for empty input', () => {
    expect(parseGlyphs('  \n ')).toEqual(Array.from(DEFAULT_VISUAL_CONFIG.glyphs))
  })

  it('removes line breaks without removing intentional spaces', () => {
    expect(parseGlyphs(' a\nb ')).toEqual([' ', 'a', 'b', ' '])
  })
})
