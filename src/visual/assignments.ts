import { getColumnStyleIndex, type CrestColumn } from './columns'
import type { VisualConfig } from './config'
import {
  BOLD_FONT_WEIGHT,
  DEFAULT_FONT_ID,
  DEFAULT_FONT_WEIGHT,
  getFontDefinition,
  type FontId,
  type FontWeight,
} from './fonts'

export interface ColumnFontVariant {
  weight: FontWeight
  italic: boolean
}

const DEFAULT_FONT_VARIANT: ColumnFontVariant = {
  weight: DEFAULT_FONT_WEIGHT,
  italic: false,
}

const RANDOM_FONT_VARIANTS: readonly ColumnFontVariant[] = [
  DEFAULT_FONT_VARIANT,
  { weight: BOLD_FONT_WEIGHT, italic: false },
  { weight: DEFAULT_FONT_WEIGHT, italic: true },
]

const UPRIGHT_FONT_VARIANTS: readonly ColumnFontVariant[] = [
  DEFAULT_FONT_VARIANT,
  { weight: BOLD_FONT_WEIGHT, italic: false },
]

export function getColumnFontId(
  config: Pick<VisualConfig, 'fontIds' | 'fontAssignment' | 'seed'>,
  column: CrestColumn,
  slot: number,
): FontId {
  const index = getColumnStyleIndex(
    column,
    slot,
    config.fontAssignment,
    config.fontIds.length,
    config.seed,
    11,
  )
  return config.fontIds[index] ?? DEFAULT_FONT_ID
}

export function getColumnFontVariant(
  config: Pick<VisualConfig, 'randomWeightItalic' | 'seed'>,
  column: CrestColumn,
  slot: number,
  fontId: FontId = DEFAULT_FONT_ID,
): ColumnFontVariant {
  if (!config.randomWeightItalic) {
    return DEFAULT_FONT_VARIANT
  }

  const variants = getFontDefinition(fontId).hasItalic
    ? RANDOM_FONT_VARIANTS
    : UPRIGHT_FONT_VARIANTS
  const index = getColumnStyleIndex(column, slot, 'random', variants.length, config.seed, 17)

  return variants[index] ?? DEFAULT_FONT_VARIANT
}

export function getColumnColor(
  config: Pick<VisualConfig, 'colors' | 'colorAssignment' | 'seed'>,
  column: CrestColumn,
  slot: number,
): string {
  const index = getColumnStyleIndex(
    column,
    slot,
    config.colorAssignment,
    config.colors.length,
    config.seed,
    13,
  )
  return config.colors[index] ?? config.colors[0] ?? '#171717'
}
