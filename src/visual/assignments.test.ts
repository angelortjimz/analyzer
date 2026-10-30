import { describe, expect, it } from 'vitest'
import { getColumnColor, getColumnFontId, getColumnFontVariant } from './assignments'
import { createCrestLayout, getColumnShuffleSlot, getColumnStyleIndex } from './columns'
import { DEFAULT_VISUAL_CONFIG } from './config'

const columns = createCrestLayout(1_280, 720, 20, 1, 42).columns
const column = columns[4]
const fonts = ['system-mono', 'ibm-plex-mono', 'space-mono'] as const
const colors = ['#171717', '#c4452c', '#2f6b8a']

describe('font and color assignments', () => {
  it('keeps by-column styles fixed across shuffle slots', () => {
    const config = {
      ...DEFAULT_VISUAL_CONFIG,
      fontIds: [...fonts],
      fontAssignment: 'column' as const,
      colors,
      colorAssignment: 'column' as const,
      seed: 42,
    }

    for (let slot = 0; slot < 20; slot += 1) {
      expect(getColumnFontId(config, column, slot)).toBe(getColumnFontId(config, column, 0))
      expect(getColumnColor(config, column, slot)).toBe(getColumnColor(config, column, 0))
    }
  })

  it('changes random styles as the character slot advances', () => {
    const config = {
      ...DEFAULT_VISUAL_CONFIG,
      fontIds: [...fonts],
      fontAssignment: 'random' as const,
      colors,
      colorAssignment: 'random' as const,
      seed: 42,
    }
    const fontSelections = new Set<string>()
    const colorSelections = new Set<string>()

    for (const testColumn of columns.slice(0, 20)) {
      for (let time = 0; time < 5; time += 0.2) {
        const slot = getColumnShuffleSlot(testColumn, time, 0.9)
        fontSelections.add(getColumnFontId(config, testColumn, slot))
        colorSelections.add(getColumnColor(config, testColumn, slot))
      }
    }

    expect(fontSelections.size).toBeGreaterThan(1)
    expect(colorSelections.size).toBeGreaterThan(1)
  })

  it('freezes random styles at zero chaos', () => {
    const config = {
      ...DEFAULT_VISUAL_CONFIG,
      fontIds: [...fonts],
      fontAssignment: 'random' as const,
      colors,
      colorAssignment: 'random' as const,
      seed: 42,
    }
    const initialSlot = getColumnShuffleSlot(column, 0, 0)
    const laterSlot = getColumnShuffleSlot(column, 1_000, 0)

    expect(laterSlot).toBe(initialSlot)
    expect(getColumnFontId(config, column, laterSlot)).toBe(
      getColumnFontId(config, column, initialSlot),
    )
    expect(getColumnColor(config, column, laterSlot)).toBe(
      getColumnColor(config, column, initialSlot),
    )
  })

  it('uses different salts for font and color selection', () => {
    const fontSequence = columns
      .slice(0, 20)
      .map((testColumn) => getColumnStyleIndex(testColumn, 10, 'random', 4, 42, 11))
    const colorSequence = columns
      .slice(0, 20)
      .map((testColumn) => getColumnStyleIndex(testColumn, 10, 'random', 4, 42, 13))

    expect(fontSequence).not.toEqual(colorSequence)
  })

  it('uses the sole item for single-font and monochrome modes', () => {
    const config = {
      ...DEFAULT_VISUAL_CONFIG,
      fontIds: ['space-mono' as const],
      fontAssignment: 'random' as const,
      colors: ['#123456'],
      colorAssignment: 'random' as const,
    }

    expect(getColumnFontId(config, column, 99)).toBe('space-mono')
    expect(getColumnColor(config, column, 99)).toBe('#123456')
  })

  it('keeps normal weight when the toggle is off', () => {
    const config = {
      ...DEFAULT_VISUAL_CONFIG,
      randomWeightItalic: false,
      seed: 42,
    }

    for (let slot = 0; slot < 20; slot += 1) {
      expect(getColumnFontVariant(config, column, slot)).toEqual({
        weight: 400,
        italic: false,
      })
    }
  })

  it('selects normal, bold, or italic per character', () => {
    const config = {
      ...DEFAULT_VISUAL_CONFIG,
      randomWeightItalic: true,
      seed: 42,
    }
    const variants = new Set<string>()

    for (const testColumn of columns.slice(0, 20)) {
      for (let time = 0; time < 5; time += 0.2) {
        const slot = getColumnShuffleSlot(testColumn, time, 0.9)
        const variant = getColumnFontVariant(config, testColumn, slot)
        variants.add(`${variant.weight}|${variant.italic ? 'italic' : 'upright'}`)
      }
    }

    expect(variants).toEqual(new Set(['400|upright', '700|upright', '400|italic']))
    expect(variants.has('700|italic')).toBe(false)
  })

  it('uses only upright variants for fonts without an italic face', () => {
    const config = {
      ...DEFAULT_VISUAL_CONFIG,
      randomWeightItalic: true,
      seed: 42,
    }
    const variants = new Set<string>()

    for (const testColumn of columns.slice(0, 20)) {
      for (let time = 0; time < 5; time += 0.2) {
        const slot = getColumnShuffleSlot(testColumn, time, 0.9)
        const variant = getColumnFontVariant(config, testColumn, slot, 'caveat')
        variants.add(`${variant.weight}|${variant.italic ? 'italic' : 'upright'}`)
      }
    }

    expect(variants).toEqual(new Set(['400|upright', '700|upright']))
  })

  it('freezes random styling at zero chaos', () => {
    const config = {
      ...DEFAULT_VISUAL_CONFIG,
      randomWeightItalic: true,
      seed: 42,
    }
    const initialSlot = getColumnShuffleSlot(column, 0, 0)
    const laterSlot = getColumnShuffleSlot(column, 1_000, 0)

    expect(getColumnFontVariant(config, column, laterSlot)).toEqual(
      getColumnFontVariant(config, column, initialSlot),
    )
  })

  it('is deterministic for the same column and shuffle slot', () => {
    const config = {
      ...DEFAULT_VISUAL_CONFIG,
      randomWeightItalic: true,
      seed: 42,
    }

    expect(getColumnFontVariant(config, column, 7)).toEqual(getColumnFontVariant(config, column, 7))
  })
})
