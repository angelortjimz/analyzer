import { DEFAULT_FONT_ID, isFontId, type FontId } from './fonts'

export type AssignmentMode = 'column' | 'random'

export interface VisualConfig {
  glyphs: string
  fontIds: FontId[]
  fontAssignment: AssignmentMode
  randomWeightItalic: boolean
  backgroundColor: string
  colors: string[]
  colorAssignment: AssignmentMode
  fontSize: number
  density: number
  gain: number
  attack: number
  decay: number
  chaos: number
  seed: number
}

export const DEFAULT_VISUAL_CONFIG: VisualConfig = {
  glyphs: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ0123456789:;+=*#%@',
  fontIds: [DEFAULT_FONT_ID],
  fontAssignment: 'column',
  randomWeightItalic: false,
  backgroundColor: '#ffffff',
  colors: ['#171717'],
  colorAssignment: 'column',
  fontSize: 20,
  density: 1,
  gain: 1.8,
  attack: 0.045,
  decay: 0.28,
  chaos: 0.18,
  seed: 73421,
}

export const CONFIG_LIMITS = {
  fontSize: { min: 12, max: 36 },
  density: { min: 0.65, max: 1.5 },
  gain: { min: 0.4, max: 4 },
  attack: { min: 0.01, max: 0.3 },
  decay: { min: 0.05, max: 1 },
  chaos: { min: 0, max: 1 },
  maxFonts: 8,
  maxColors: 4,
  maxGlyphs: 500,
} as const

export const VISUAL_CONSTANTS = {
  fftSize: 2048,
  bandCount: 56,
  minFrequency: 40,
  maxFrequency: 16_000,
  noiseFloor: 0.035,
  maxDpr: 2,
  maxDeltaSeconds: 0.1,
  maxColumns: 320,
  minShuffleInterval: 0.055,
  maxShuffleInterval: 1.4,
  defaultSampleRate: 48_000,
} as const

const HEX_COLOR = /^#[0-9a-f]{6}$/i

export function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

export function parseGlyphs(value: string): string[] {
  const glyphs = Array.from(value).filter((glyph) => glyph.trim().length > 0)
  return glyphs.length > 0 ? glyphs : Array.from(DEFAULT_VISUAL_CONFIG.glyphs)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function numberInRange(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? clamp(value, minimum, maximum)
    : fallback
}

function limitedString(value: unknown, fallback: string, maximum: number): string {
  if (typeof value !== 'string') {
    return fallback
  }

  return Array.from(value).slice(0, maximum).join('')
}

function sanitizeFontIds(value: unknown): FontId[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_VISUAL_CONFIG.fontIds]
  }

  const fontIds = Array.from(new Set(value.filter(isFontId))).slice(0, CONFIG_LIMITS.maxFonts)
  return fontIds.length > 0 ? fontIds : [...DEFAULT_VISUAL_CONFIG.fontIds]
}

function sanitizeColors(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_VISUAL_CONFIG.colors]
  }

  const colors = Array.from(
    new Set(value.filter(isHexColor).map((color) => color.toLowerCase())),
  ).slice(0, CONFIG_LIMITS.maxColors)
  return colors.length > 0 ? colors : [...DEFAULT_VISUAL_CONFIG.colors]
}

export function sanitizeVisualConfig(value: unknown): VisualConfig {
  const record = isRecord(value) ? value : {}
  const seed =
    typeof record.seed === 'number' && Number.isFinite(record.seed)
      ? Math.trunc(clamp(record.seed, 0, 4_294_967_295))
      : DEFAULT_VISUAL_CONFIG.seed

  return {
    glyphs: limitedString(record.glyphs, DEFAULT_VISUAL_CONFIG.glyphs, CONFIG_LIMITS.maxGlyphs),
    fontIds: sanitizeFontIds(record.fontIds),
    fontAssignment:
      record.fontAssignment === 'random' || record.fontAssignment === 'column'
        ? record.fontAssignment
        : DEFAULT_VISUAL_CONFIG.fontAssignment,
    randomWeightItalic:
      typeof record.randomWeightItalic === 'boolean'
        ? record.randomWeightItalic
        : DEFAULT_VISUAL_CONFIG.randomWeightItalic,
    backgroundColor: isHexColor(record.backgroundColor)
      ? record.backgroundColor.toLowerCase()
      : DEFAULT_VISUAL_CONFIG.backgroundColor,
    colors: sanitizeColors(record.colors),
    colorAssignment:
      record.colorAssignment === 'random' || record.colorAssignment === 'column'
        ? record.colorAssignment
        : DEFAULT_VISUAL_CONFIG.colorAssignment,
    fontSize: Math.round(
      numberInRange(
        record.fontSize,
        DEFAULT_VISUAL_CONFIG.fontSize,
        CONFIG_LIMITS.fontSize.min,
        CONFIG_LIMITS.fontSize.max,
      ),
    ),
    density:
      Math.round(
        numberInRange(
          record.density,
          DEFAULT_VISUAL_CONFIG.density,
          CONFIG_LIMITS.density.min,
          CONFIG_LIMITS.density.max,
        ) * 100,
      ) / 100,
    gain:
      Math.round(
        numberInRange(
          record.gain,
          DEFAULT_VISUAL_CONFIG.gain,
          CONFIG_LIMITS.gain.min,
          CONFIG_LIMITS.gain.max,
        ) * 10,
      ) / 10,
    attack:
      Math.round(
        numberInRange(
          record.attack,
          DEFAULT_VISUAL_CONFIG.attack,
          CONFIG_LIMITS.attack.min,
          CONFIG_LIMITS.attack.max,
        ) * 1_000,
      ) / 1_000,
    decay:
      Math.round(
        numberInRange(
          record.decay,
          DEFAULT_VISUAL_CONFIG.decay,
          CONFIG_LIMITS.decay.min,
          CONFIG_LIMITS.decay.max,
        ) * 1_000,
      ) / 1_000,
    chaos:
      Math.round(
        numberInRange(
          record.chaos,
          DEFAULT_VISUAL_CONFIG.chaos,
          CONFIG_LIMITS.chaos.min,
          CONFIG_LIMITS.chaos.max,
        ) * 100,
      ) / 100,
    seed,
  }
}
