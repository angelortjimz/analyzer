export interface VisualConfig {
  glyphs: string
  fontSize: number
  density: number
  gain: number
  attack: number
  decay: number
  motion: number
  seed: number
}

export const DEFAULT_VISUAL_CONFIG: VisualConfig = {
  glyphs: ' .:;ilosvxO0#@',
  fontSize: 20,
  density: 1,
  gain: 1.8,
  attack: 0.045,
  decay: 0.28,
  motion: 0.55,
  seed: 73421,
}

export const VISUAL_CONSTANTS = {
  fftSize: 2048,
  bandCount: 56,
  minFrequency: 40,
  maxFrequency: 16_000,
  noiseFloor: 0.035,
  maxDpr: 2,
  maxDeltaSeconds: 0.1,
  maxGridCells: 12_000,
  defaultSampleRate: 48_000,
  fontFamily: "ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace",
  ink: '#171717',
  paper: '#ffffff',
} as const

export function parseGlyphs(value: string): string[] {
  if (value.trim().length === 0) {
    return Array.from(DEFAULT_VISUAL_CONFIG.glyphs)
  }

  const glyphs = Array.from(value).filter((glyph) => !'\n\r\t'.includes(glyph))
  return glyphs.length > 0 ? glyphs : Array.from(DEFAULT_VISUAL_CONFIG.glyphs)
}

export function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value))
}
