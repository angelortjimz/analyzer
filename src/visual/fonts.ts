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
  await Promise.allSettled(
    bundledFonts.map((font) => document.fonts.load(`400 20px "${font.family}"`)),
  )
}
