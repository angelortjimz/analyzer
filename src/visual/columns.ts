import { clamp, VISUAL_CONSTANTS } from './config'

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

function hashToUnit(seed: number, column: number, slot: number, salt: number): number {
  let value =
    (seed ^
      Math.imul(column + 1, 0x85ebca77) ^
      Math.imul(slot + 1, 0xc2b2ae3d) ^
      Math.imul(salt + 1, 0x9e3779b1)) >>>
    0

  value = Math.imul(value ^ (value >>> 16), 0x7feb352d)
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b)
  value = (value ^ (value >>> 16)) >>> 0

  return value / 4_294_967_296
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
  const horizontalPadding = Math.min(safeWidth * 0.08, safeFontSize * 1.5)
  const usableWidth = Math.max(0, safeWidth - horizontalPadding * 2)
  const columnWidth = (safeFontSize * 0.9) / safeDensity
  const columnCount = Math.min(
    VISUAL_CONSTANTS.maxColumns,
    Math.max(1, Math.floor(usableWidth / columnWidth)),
  )
  const verticalPadding = Math.min(safeHeight * 0.2, Math.max(76, safeFontSize * 3))
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

export function getColumnGlyphIndex(
  column: CrestColumn,
  timeSeconds: number,
  chaos: number,
  glyphCount: number,
  seed: number,
): number {
  if (glyphCount <= 0) {
    return -1
  }

  const safeChaos = clamp(chaos)
  const interval =
    VISUAL_CONSTANTS.maxShuffleInterval *
    (VISUAL_CONSTANTS.minShuffleInterval / VISUAL_CONSTANTS.maxShuffleInterval) ** safeChaos
  const time = Math.max(0, Number.isFinite(timeSeconds) ? timeSeconds : 0)
  const slot = safeChaos === 0 ? 0 : Math.floor(time / interval + column.shufflePhase)
  const random = hashToUnit(seed, column.index, slot, 7)

  return Math.min(glyphCount - 1, Math.floor(random * glyphCount))
}
