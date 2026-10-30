import { clamp, VISUAL_CONSTANTS, type AssignmentMode } from './config'
import { hashToUnit } from './random'

export interface CrestColumn {
  index: number
  x: number
  frequencyPosition: number
  shufflePhase: number
}

export interface CrestLayout {
  columns: CrestColumn[]
  topY: number
  baselineY: number
}

export function createCrestLayout(
  width: number,
  height: number,
  fontSize: number,
  density: number,
  seed: number,
): CrestLayout {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)
  const safeFontSize = Math.max(1, fontSize)
  const safeDensity = clamp(density, 0.1, 4)
  const horizontalPadding = Math.min(safeWidth * 0.2, safeFontSize * 1.5)
  const usableWidth = Math.max(0, safeWidth - horizontalPadding * 2)
  const columnWidth = (safeFontSize * 0.9) / safeDensity
  const columnCount = Math.min(
    VISUAL_CONSTANTS.maxColumns,
    Math.max(1, Math.floor(usableWidth / columnWidth)),
  )
  const verticalPadding = Math.min(safeHeight * 0.3, Math.max(76, safeFontSize * 3))
  const topY = verticalPadding
  const baselineY = safeHeight - verticalPadding
  const columns: CrestColumn[] = []

  for (let index = 0; index < columnCount; index += 1) {
    const frequencyPosition = columnCount <= 1 ? 0.5 : index / (columnCount - 1)
    columns.push({
      index,
      x: columnCount <= 1 ? safeWidth / 2 : horizontalPadding + frequencyPosition * usableWidth,
      frequencyPosition,
      shufflePhase: hashToUnit(seed, index, 0, 0),
    })
  }

  return { columns, topY, baselineY }
}

export function getCrestY(energy: number, layout: CrestLayout): number {
  return layout.baselineY - clamp(energy) * (layout.baselineY - layout.topY)
}

export function getColumnShuffleSlot(
  column: CrestColumn,
  timeSeconds: number,
  chaos: number,
): number {
  const safeChaos = clamp(chaos)
  if (safeChaos === 0) {
    return 0
  }

  const interval =
    VISUAL_CONSTANTS.maxShuffleInterval *
    (VISUAL_CONSTANTS.minShuffleInterval / VISUAL_CONSTANTS.maxShuffleInterval) ** safeChaos
  const time = Math.max(0, Number.isFinite(timeSeconds) ? timeSeconds : 0)
  return Math.floor(time / interval + column.shufflePhase)
}

export function getColumnGlyphIndex(
  column: CrestColumn,
  slot: number,
  glyphCount: number,
  seed: number,
): number {
  if (glyphCount <= 0) {
    return -1
  }

  const random = hashToUnit(seed, column.index, slot, 7)
  return Math.min(glyphCount - 1, Math.floor(random * glyphCount))
}

export function getColumnStyleIndex(
  column: CrestColumn,
  slot: number,
  mode: AssignmentMode,
  entryCount: number,
  seed: number,
  salt: number,
): number {
  if (entryCount <= 0) {
    return -1
  }
  if (entryCount === 1) {
    return 0
  }

  const assignmentSlot = mode === 'random' ? slot : 0
  const random = hashToUnit(seed, column.index, assignmentSlot, salt)
  return Math.min(entryCount - 1, Math.floor(random * entryCount))
}
