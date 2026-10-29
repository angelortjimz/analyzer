import { describe, expect, it } from 'vitest'
import { isHexColor, sanitizeVisualConfig, CONFIG_LIMITS } from './config'
import { isFontId } from './fonts'
import {
  BUILTIN_PRESETS,
  createUserPreset,
  generateVisualConfig,
  loadUserPresets,
  parseUserPresets,
  PRESET_STORAGE_KEY,
  saveUserPresets,
  serializeUserPresets,
  type PresetStorage,
  type UserPreset,
} from './presets'

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  } satisfies PresetStorage & { values: Map<string, string> }
}

describe('built-in presets', () => {
  it('contain valid, identifiable configurations', () => {
    expect(BUILTIN_PRESETS.map((preset) => preset.id)).toEqual([
      'default',
      'letters',
      'symbols',
      'duotone',
    ])

    for (const preset of BUILTIN_PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0)
      expect(sanitizeVisualConfig(preset.config)).toEqual(preset.config)
    }
  })

  it('provide dedicated letters and symbols pools', () => {
    const letters = BUILTIN_PRESETS.find((preset) => preset.id === 'letters')!
    const symbols = BUILTIN_PRESETS.find((preset) => preset.id === 'symbols')!

    expect(letters.config.glyphs).toMatch(/^[a-z]+$/i)
    expect(symbols.config.glyphs).not.toMatch(/^[a-z]+$/i)
  })
})

describe('generateVisualConfig', () => {
  it('is deterministic for a seed and changes for a new seed', () => {
    expect(generateVisualConfig(123)).toEqual(generateVisualConfig(123))
    expect(generateVisualConfig(123)).not.toEqual(generateVisualConfig(124))
  })

  it('produces valid fonts, colors, and bounded settings for many seeds', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const config = generateVisualConfig(seed)

      expect(config.fontIds.length).toBeGreaterThanOrEqual(1)
      expect(config.fontIds.length).toBeLessThanOrEqual(3)
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
      expect(sanitizeVisualConfig(config)).toEqual(config)
    }
  })
})

describe('user preset serialization', () => {
  const config = generateVisualConfig(55)
  const preset: UserPreset = {
    id: 'preset-1',
    name: 'My preset',
    createdAt: 123,
    config,
  }

  it('round trips saved presets', () => {
    expect(parseUserPresets(serializeUserPresets([preset]))).toEqual([preset])
  })

  it('rejects malformed data and unknown versions', () => {
    expect(parseUserPresets(null)).toEqual([])
    expect(parseUserPresets('{')).toEqual([])
    expect(parseUserPresets('{"version":2,"presets":[]}')).toEqual([])
    expect(parseUserPresets('{"version":1,"presets":"bad"}')).toEqual([])
  })

  it('filters invalid entries while keeping valid presets', () => {
    const raw = JSON.stringify({
      version: 1,
      presets: [{ name: 'Missing config' }, { id: 'ok', name: 'Valid', createdAt: 1, config }],
    })

    expect(parseUserPresets(raw)).toHaveLength(1)
    expect(parseUserPresets(raw)[0].id).toBe('ok')
  })

  it('loads and saves through a storage adapter', () => {
    const storage = memoryStorage()
    const result = saveUserPresets([preset], storage)

    expect(result.ok).toBe(true)
    expect(storage.values.has(PRESET_STORAGE_KEY)).toBe(true)
    expect(loadUserPresets(storage)).toEqual([preset])
  })

  it('handles unavailable and failing storage', () => {
    expect(loadUserPresets(null)).toEqual([])
    expect(saveUserPresets([], null).ok).toBe(false)

    const failingStorage: PresetStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('full')
      },
    }
    expect(loadUserPresets(failingStorage)).toEqual([])
    expect(saveUserPresets([], failingStorage).ok).toBe(false)
  })

  it('creates a sanitized named preset', () => {
    const created = createUserPreset('  Test preset  ', {
      ...config,
      fontSize: 999,
    })

    expect(created.name).toBe('Test preset')
    expect(created.id.length).toBeGreaterThan(0)
    expect(created.config.fontSize).toBe(CONFIG_LIMITS.fontSize.max)
  })
})
