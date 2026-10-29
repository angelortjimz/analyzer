import { getColumnStyleIndex, type CrestColumn } from './columns'
import type { VisualConfig } from './config'
import { DEFAULT_FONT_ID, type FontId } from './fonts'

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
