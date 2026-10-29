import { sanitizeVisualConfig, type VisualConfig } from './config'
import { FONT_CATALOG, type FontId } from './fonts'
import { createSeededRandom, randomSeed } from './random'

export interface BuiltinPreset {
  id: string
  name: string
  config: VisualConfig
}

export interface UserPreset {
  id: string
  name: string
  createdAt: number
  config: VisualConfig
}

interface StoredPresetDocument {
  version: 1
  presets: UserPreset[]
}

export interface PresetStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface SavePresetsResult {
  ok: boolean
  error: string | null
}

export const PRESET_STORAGE_KEY = 'typographic-spectrum:user-presets'
const PRESET_STORAGE_VERSION = 1

const LETTERS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
const SYMBOLS = '!@#$%^&*()_+-=[]{};:,.<>?/\\|~'
const MIXED = 'abcdefghijkmnopqrstuvwxyz0123456789:;+=*#%@'
const CHARACTER_POOLS = [LETTERS, SYMBOLS, MIXED]
const SOURCE_PHRASES = [
  'listen closely to the shape of sound',
  'noise becomes language',
  'every frequency leaves a letter',
  'sound held briefly in type',
  'read the space between notes',
]

const COLOR_SCHEMES = [
  { background: '#ffffff', colors: ['#171717'] },
  { background: '#ffffff', colors: ['#171717', '#d1492f'] },
  { background: '#ffffff', colors: ['#173f5f', '#2d7d62'] },
  { background: '#f5f1e8', colors: ['#20201d', '#a43f28'] },
  { background: '#fffaf0', colors: ['#1e293b', '#c2410c', '#2563eb'] },
  { background: '#111111', colors: ['#f4efe5', '#ff6b45'] },
  { background: '#101820', colors: ['#f2f2e8', '#50b8a7'] },
] as const

function cloneDefault(): VisualConfig {
  return sanitizeVisualConfig(undefined)
}

const lettersPreset = sanitizeVisualConfig({
  ...cloneDefault(),
  characterSource: 'pool',
  glyphs: LETTERS,
  fontIds: ['ibm-plex-mono'],
  fontAssignment: 'column',
  colors: ['#171717'],
  colorAssignment: 'column',
  chaos: 0.12,
})

const symbolsPreset = sanitizeVisualConfig({
  ...cloneDefault(),
  characterSource: 'pool',
  glyphs: SYMBOLS,
  fontIds: ['space-mono'],
  fontAssignment: 'column',
  colors: ['#171717'],
  colorAssignment: 'column',
  fontSize: 22,
  chaos: 0.24,
})

const duotonePreset = sanitizeVisualConfig({
  ...cloneDefault(),
  characterSource: 'pool',
  glyphs: MIXED,
  fontIds: ['ibm-plex-mono', 'ibm-plex-serif'],
  fontAssignment: 'column',
  colors: ['#171717', '#c4452c'],
  colorAssignment: 'column',
  fontSize: 19,
  density: 1.08,
  chaos: 0.2,
})

export const BUILTIN_PRESETS: BuiltinPreset[] = [
  {
    id: 'default',
    name: 'Default',
    config: sanitizeVisualConfig(undefined),
  },
  {
    id: 'letters',
    name: 'Letters',
    config: lettersPreset,
  },
  {
    id: 'symbols',
    name: 'Symbols',
    config: symbolsPreset,
  },
  {
    id: 'duotone',
    name: 'Duotone',
    config: duotonePreset,
  },
]

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] ?? items[0]
}

function rounded(value: number, step: number): number {
  return Math.round(value / step) * step
}

function generateFontIds(random: () => number): FontId[] {
  const shuffled = FONT_CATALOG.map((font) => font.id)
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }
  const count = 1 + Math.floor(random() * 3)
  return shuffled.slice(0, count)
}

export function generateVisualConfig(seed: number): VisualConfig {
  const normalizedSeed = Math.trunc(Math.max(0, Math.min(4_294_967_295, seed)))
  const random = createSeededRandom(normalizedSeed)
  const scheme = pick(COLOR_SCHEMES, random)
  const characters = pick(CHARACTER_POOLS, random)
  const chaos = random() < 0.15 ? 0 : rounded(0.1 + random() * 0.9, 0.05)

  return sanitizeVisualConfig({
    characterSource: random() < 0.24 ? 'text' : 'pool',
    glyphs: characters,
    sourceText: pick(SOURCE_PHRASES, random),
    fontIds: generateFontIds(random),
    fontAssignment: random() < 0.55 ? 'column' : 'random',
    backgroundColor: scheme.background,
    colors: [...scheme.colors],
    colorAssignment: random() < 0.55 ? 'column' : 'random',
    fontSize: 14 + Math.round(random() * 16),
    density: rounded(0.7 + random() * 0.7, 0.05),
    gain: rounded(0.8 + random() * 2.7, 0.1),
    attack: rounded(0.02 + random() * 0.16, 0.01),
    decay: rounded(0.12 + random() * 0.58, 0.01),
    chaos,
    seed: normalizedSeed,
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseUserPreset(value: unknown): UserPreset | null {
  if (!isRecord(value) || !isRecord(value.config)) {
    return null
  }

  const id = typeof value.id === 'string' ? value.id.trim() : ''
  const name = typeof value.name === 'string' ? value.name.trim().slice(0, 60) : ''
  const createdAt =
    typeof value.createdAt === 'number' && Number.isFinite(value.createdAt)
      ? value.createdAt
      : Date.now()

  if (id.length === 0 || name.length === 0) {
    return null
  }

  return {
    id,
    name,
    createdAt,
    config: sanitizeVisualConfig(value.config),
  }
}

export function parseUserPresets(raw: string | null): UserPreset[] {
  if (!raw) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      !isRecord(parsed) ||
      parsed.version !== PRESET_STORAGE_VERSION ||
      !Array.isArray(parsed.presets)
    ) {
      return []
    }

    return parsed.presets
      .map(parseUserPreset)
      .filter((preset): preset is UserPreset => preset !== null)
      .slice(0, 100)
  } catch {
    return []
  }
}

export function serializeUserPresets(presets: UserPreset[]): string {
  const document: StoredPresetDocument = {
    version: PRESET_STORAGE_VERSION,
    presets,
  }
  return JSON.stringify(document)
}

function getLocalStorage(): PresetStorage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadUserPresets(storage: PresetStorage | null = getLocalStorage()): UserPreset[] {
  if (!storage) {
    return []
  }

  try {
    return parseUserPresets(storage.getItem(PRESET_STORAGE_KEY))
  } catch {
    return []
  }
}

export function saveUserPresets(
  presets: UserPreset[],
  storage: PresetStorage | null = getLocalStorage(),
): SavePresetsResult {
  if (!storage) {
    return { ok: false, error: 'Local storage is unavailable in this browser.' }
  }

  try {
    storage.setItem(PRESET_STORAGE_KEY, serializeUserPresets(presets))
    return { ok: true, error: null }
  } catch {
    return { ok: false, error: 'The preset could not be saved. Local storage may be full.' }
  }
}

export function createUserPreset(name: string, config: VisualConfig): UserPreset {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${randomSeed().toString(36)}`

  return {
    id,
    name: name.trim().slice(0, 60) || 'Untitled',
    createdAt: Date.now(),
    config: sanitizeVisualConfig(config),
  }
}
