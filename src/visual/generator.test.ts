import { describe, expect, it } from 'vitest'
import { isHexColor, sanitizeVisualConfig, CONFIG_LIMITS } from './config'
import { generateVisualConfig } from './generator'
import { isFontId } from './fonts'

describe('generateVisualConfig', () => {
  it('is deterministic for a seed and changes for a new seed', () => {
    expect(generateVisualConfig(123)).toEqual(generateVisualConfig(123))
    expect(generateVisualConfig(123)).not.toEqual(generateVisualConfig(124))
  })

  it('always creates a character pool', () => {
    const config = generateVisualConfig(5)

    expect(config.glyphs.length).toBeGreaterThan(0)
    expect(config.glyphs.trim().length).toBeGreaterThan(0)
  })

  it('produces valid fonts, colors, and bounded settings for many seeds', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const config = generateVisualConfig(seed)

      expect(config.fontIds.length).toBeGreaterThanOrEqual(1)
      expect(config.fontIds.length).toBeLessThanOrEqual(3)
      expect(config.fontIds.length).toBeLessThanOrEqual(CONFIG_LIMITS.maxFonts)
      expect(new Set(config.fontIds).size).toBe(config.fontIds.length)
      expect(config.fontIds.every(isFontId)).toBe(true)
      expect(config.colors.length).toBeGreaterThanOrEqual(1)
      expect(config.colors.length).toBeLessThanOrEqual(CONFIG_LIMITS.maxColors)
      expect(config.colors.every(isHexColor)).toBe(true)
      expect(isHexColor(config.backgroundColor)).toBe(true)
      expect(config.fontSize).toBeGreaterThanOrEqual(CONFIG_LIMITS.fontSize.min)
      expect(config.fontSize).toBeLessThanOrEqual(CONFIG_LIMITS.fontSize.max)
      expect(config.density).toBeGreaterThanOrEqual(CONFIG_LIMITS.density.min)
      expect(config.density).toBeLessThanOrEqual(CONFIG_LIMITS.density.max)
      expect(config.chaos).toBeGreaterThanOrEqual(0)
      expect(config.chaos).toBeLessThanOrEqual(1)
      expect(typeof config.randomWeightItalic).toBe('boolean')
      expect(sanitizeVisualConfig(config)).toEqual(config)
    }
  })
})
