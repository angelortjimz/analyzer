import { describe, expect, it } from 'vitest'
import {
  DEFAULT_VISUAL_CONFIG,
  parseCharacterSource,
  parseGlyphs,
  parseSourceText,
  sanitizeVisualConfig,
} from './config'

describe('glyph parsing', () => {
  it('preserves Unicode code points in a pool', () => {
    expect(parseGlyphs('a😀b')).toEqual(['a', '😀', 'b'])
  })

  it('uses the default pool for empty input', () => {
    expect(parseGlyphs('  \n ')).toEqual(Array.from(DEFAULT_VISUAL_CONFIG.glyphs))
  })

  it('removes whitespace without deduplicating a pool', () => {
    expect(parseGlyphs(' a\nb a')).toEqual(['a', 'b', 'a'])
  })

  it('deduplicates source text in first-appearance order', () => {
    expect(parseSourceText('letter letter')).toEqual(['l', 'e', 't', 'r'])
  })

  it('falls back safely for empty source text', () => {
    expect(parseSourceText(' \n ')).toEqual(Array.from(DEFAULT_VISUAL_CONFIG.glyphs))
  })

  it('selects characters from the configured source', () => {
    expect(
      parseCharacterSource({
        characterSource: 'text',
        glyphs: 'ignored pool',
        sourceText: 'abcabc',
      }),
    ).toEqual(['a', 'b', 'c'])
    expect(
      parseCharacterSource({
        characterSource: 'pool',
        glyphs: 'abcabc',
        sourceText: 'ignored',
      }),
    ).toEqual(['a', 'b', 'c', 'a', 'b', 'c'])
  })
})

describe('sanitizeVisualConfig', () => {
  it('preserves a valid default configuration', () => {
    expect(sanitizeVisualConfig(DEFAULT_VISUAL_CONFIG)).toEqual(DEFAULT_VISUAL_CONFIG)
  })

  it('clamps numbers and rounds them to control precision', () => {
    const config = sanitizeVisualConfig({
      ...DEFAULT_VISUAL_CONFIG,
      fontSize: 200,
      density: -4,
      gain: 1.234,
      attack: 9,
      decay: 0,
      chaos: 0.567,
      seed: 12.8,
    })

    expect(config.fontSize).toBe(36)
    expect(config.density).toBe(0.65)
    expect(config.gain).toBe(1.2)
    expect(config.attack).toBe(0.3)
    expect(config.decay).toBe(0.05)
    expect(config.chaos).toBe(0.57)
    expect(config.seed).toBe(12)
  })

  it('filters invalid fonts and colors', () => {
    const config = sanitizeVisualConfig({
      ...DEFAULT_VISUAL_CONFIG,
      fontIds: ['ibm-plex-mono', 'missing-font', 'ibm-plex-mono'],
      colors: ['#FF0000', 'red', '#ff0000', '#00ff00'],
      backgroundColor: 'not-a-color',
    })

    expect(config.fontIds).toEqual(['ibm-plex-mono'])
    expect(config.colors).toEqual(['#ff0000', '#00ff00'])
    expect(config.backgroundColor).toBe(DEFAULT_VISUAL_CONFIG.backgroundColor)
  })

  it('falls back when arrays and modes are empty or unknown', () => {
    const config = sanitizeVisualConfig({
      ...DEFAULT_VISUAL_CONFIG,
      characterSource: 'unknown',
      fontIds: [],
      fontAssignment: 'frequency',
      colors: [],
      colorAssignment: 'frequency',
    })

    expect(config.characterSource).toBe(DEFAULT_VISUAL_CONFIG.characterSource)
    expect(config.fontIds).toEqual(DEFAULT_VISUAL_CONFIG.fontIds)
    expect(config.fontAssignment).toBe(DEFAULT_VISUAL_CONFIG.fontAssignment)
    expect(config.colors).toEqual(DEFAULT_VISUAL_CONFIG.colors)
    expect(config.colorAssignment).toBe(DEFAULT_VISUAL_CONFIG.colorAssignment)
  })

  it('handles completely invalid input', () => {
    expect(sanitizeVisualConfig(null)).toEqual(DEFAULT_VISUAL_CONFIG)
    expect(sanitizeVisualConfig('invalid')).toEqual(DEFAULT_VISUAL_CONFIG)
  })
})
