import { sanitizeVisualConfig, type VisualConfig } from './config'
import { FONT_CATALOG, type FontId } from './fonts'
import { createSeededRandom } from './random'

const LETTERS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
const SYMBOLS = '!@#$%^&*()_+-=[]{};:,.<>?/\\|~'
const MIXED = 'abcdefghijkmnopqrstuvwxyz0123456789:;+=*#%@'
const CHARACTER_POOLS = [LETTERS, SYMBOLS, MIXED]

const COLOR_SCHEMES = [
  { background: '#ffffff', colors: ['#171717'] },
  { background: '#ffffff', colors: ['#171717', '#d1492f'] },
  { background: '#ffffff', colors: ['#173f5f', '#2d7d62'] },
  { background: '#f5f1e8', colors: ['#20201d', '#a43f28'] },
  { background: '#fffaf0', colors: ['#1e293b', '#c2410c', '#2563eb'] },
  { background: '#111111', colors: ['#f4efe5', '#ff6b45'] },
  { background: '#101820', colors: ['#f2f2e8', '#50b8a7'] },
] as const

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
    glyphs: characters,
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
