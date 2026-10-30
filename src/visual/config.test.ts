import { describe, expect, it } from 'vitest'
import { CONFIG_LIMITS, DEFAULT_VISUAL_CONFIG, parseGlyphs, sanitizeVisualConfig } from './config'
import { FONT_CATALOG } from './fonts'

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

    expect(config.fontSize).toBe(96)
    expect(config.density).toBe(0.65)
    expect(config.gain).toBe(1.2)
    expect(config.attack).toBe(0.3)
    expect(config.decay).toBe(0.05)
    expect(config.chaos).toBe(0.57)
    expect(config.seed).toBe(12)
  })

  it('accepts the expanded font-size range', () => {
    expect(
      sanitizeVisualConfig({
        ...DEFAULT_VISUAL_CONFIG,
        fontSize: 72,
      }).fontSize,
    ).toBe(72)
    expect(
      sanitizeVisualConfig({
        ...DEFAULT_VISUAL_CONFIG,
        fontSize: 96,
      }).fontSize,
    ).toBe(96)
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

  it('preserves every bundled font up to the catalog limit', () => {
    const fontIds = FONT_CATALOG.map((font) => font.id)
    const config = sanitizeVisualConfig({
      ...DEFAULT_VISUAL_CONFIG,
      fontIds,
    })

    expect(fontIds).toHaveLength(CONFIG_LIMITS.maxFonts)
    expect(config.fontIds).toEqual(fontIds)
  })

  it('falls back when arrays and modes are empty or unknown', () => {
    const config = sanitizeVisualConfig({
      ...DEFAULT_VISUAL_CONFIG,
      fontIds: [],
      fontAssignment: 'frequency',
      randomWeightItalic: 'yes',
      colors: [],
      colorAssignment: 'frequency',
    })

    expect(config.fontIds).toEqual(DEFAULT_VISUAL_CONFIG.fontIds)
    expect(config.fontAssignment).toBe(DEFAULT_VISUAL_CONFIG.fontAssignment)
    expect(config.randomWeightItalic).toBe(DEFAULT_VISUAL_CONFIG.randomWeightItalic)
    expect(config.colors).toEqual(DEFAULT_VISUAL_CONFIG.colors)
    expect(config.colorAssignment).toBe(DEFAULT_VISUAL_CONFIG.colorAssignment)
  })

  it('preserves the random weight and italic toggle', () => {
    expect(
      sanitizeVisualConfig({
        ...DEFAULT_VISUAL_CONFIG,
        randomWeightItalic: true,
      }).randomWeightItalic,
    ).toBe(true)
  })

  it('handles completely invalid input', () => {
    expect(sanitizeVisualConfig(null)).toEqual(DEFAULT_VISUAL_CONFIG)
    expect(sanitizeVisualConfig('invalid')).toEqual(DEFAULT_VISUAL_CONFIG)
  })
})
