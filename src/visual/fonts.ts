export const FONT_CATALOG = [
  {
    id: 'system-mono',
    label: 'System Mono',
    family: 'System Mono',
    stack: "ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace",
  },
  {
    id: 'ibm-plex-mono',
    label: 'IBM Plex Mono',
    family: 'IBM Plex Mono',
    stack: "'IBM Plex Mono', ui-monospace, monospace",
  },
  {
    id: 'space-mono',
    label: 'Space Mono',
    family: 'Space Mono',
    stack: "'Space Mono', ui-monospace, monospace",
  },
  {
    id: 'ibm-plex-serif',
    label: 'IBM Plex Serif',
    family: 'IBM Plex Serif',
    stack: "'IBM Plex Serif', Georgia, serif",
  },
] as const

export type FontId = (typeof FONT_CATALOG)[number]['id']

export const DEFAULT_FONT_WEIGHT = 400

export const BOLD_FONT_WEIGHT = 700

export type FontWeight = typeof DEFAULT_FONT_WEIGHT | typeof BOLD_FONT_WEIGHT

export const DEFAULT_FONT_ID: FontId = 'system-mono'

export function isFontId(value: unknown): value is FontId {
  return FONT_CATALOG.some((font) => font.id === value)
}

export function getFontDefinition(id: FontId) {
  return FONT_CATALOG.find((font) => font.id === id) ?? FONT_CATALOG[0]
}

export function getFontFamily(id: FontId): string {
  return getFontDefinition(id).stack
}

export async function preloadFontCatalog(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) {
    return
  }

  const bundledFonts = FONT_CATALOG.filter((font) => font.id !== 'system-mono')
  const loads: Array<Promise<FontFace[]>> = []
  for (const font of bundledFonts) {
    loads.push(document.fonts.load(`${DEFAULT_FONT_WEIGHT} 20px "${font.family}"`))
    loads.push(document.fonts.load(`${BOLD_FONT_WEIGHT} 20px "${font.family}"`))
    loads.push(document.fonts.load(`italic ${DEFAULT_FONT_WEIGHT} 20px "${font.family}"`))
  }
  await Promise.allSettled(loads)
}
