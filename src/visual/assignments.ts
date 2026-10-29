import { getColumnStyleIndex, type CrestColumn } from './columns'
import type { VisualConfig } from './config'
import { DEFAULT_FONT_ID, FONT_WEIGHTS, type FontId, type FontWeight } from './fonts'

export interface ColumnFontVariant {
  weight: FontWeight
  italic: boolean
}

const DEFAULT_FONT_VARIANT: ColumnFontVariant = { weight: 400, italic: false }

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
): ColumnFontVariant {
  if (!config.randomWeightItalic) {
    return DEFAULT_FONT_VARIANT
  }

  const weightIndex = getColumnStyleIndex(
    column,
    slot,
    'random',
    FONT_WEIGHTS.length,
    config.seed,
    17,
  )
  const italicIndex = getColumnStyleIndex(column, slot, 'random', 2, config.seed, 19)

  return {
    weight: FONT_WEIGHTS[weightIndex] ?? 400,
    italic: italicIndex === 1,
  }
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
