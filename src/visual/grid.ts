import { clamp, VISUAL_CONSTANTS } from './config'

export interface GlyphCell {
  row: number
  column: number
  x: number
  y: number
  bandOffset: number
  activationThreshold: number
  phase: number
  driftX: number
  driftY: number
  restOpacity: number
  glyphBias: number
  sensitivity: number
}

export interface GlyphGrid {
  cells: GlyphCell[]
  columns: number
  rows: number
}

function hashToUnit(seed: number, row: number, column: number, salt: number): number {
  let value =
    (seed ^
      Math.imul(row + 1, 0x9e3779b1) ^
      Math.imul(column + 1, 0x85ebca77) ^
      Math.imul(salt + 1, 0xc2b2ae3d)) >>>
    0

  value = Math.imul(value ^ (value >>> 16), 0x7feb352d)
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b)
  value = (value ^ (value >>> 16)) >>> 0

  return value / 4_294_967_296
}

function createCell(seed: number, row: number, column: number, x: number, y: number): GlyphCell {
  const phase = hashToUnit(seed, row, column, 2) * Math.PI * 2
  const driftAngle = hashToUnit(seed, row, column, 3) * Math.PI * 2
  const restChance = hashToUnit(seed, row, column, 4)

  return {
    row,
    column,
    x,
    y,
    bandOffset: (hashToUnit(seed, row, column, 0) - 0.5) * 1.4,
    activationThreshold: 0.08 + hashToUnit(seed, row, column, 1) * 0.72,
    phase,
    driftX: Math.cos(driftAngle),
    driftY: Math.sin(driftAngle),
    restOpacity: restChance > 0.86 ? 0.07 + (restChance - 0.86) * 0.65 : 0,
    glyphBias: hashToUnit(seed, row, column, 5),
    sensitivity: 0.84 + hashToUnit(seed, row, column, 6) * 0.32,
  }
}

export function createGrid(
  width: number,
  height: number,
  fontSize: number,
  density: number,
  seed: number,
): GlyphGrid {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)
  const safeFontSize = Math.max(1, fontSize)
  const safeDensity = clamp(density, 0.1, 4)

  let cellWidth = (safeFontSize * 0.9) / safeDensity
  let cellHeight = (safeFontSize * 1.65) / safeDensity
  let columns = Math.max(1, Math.floor(safeWidth / cellWidth))
  let rows = Math.max(1, Math.floor(safeHeight / cellHeight))
  const cellCount = columns * rows

  if (cellCount > VISUAL_CONSTANTS.maxGridCells) {
    const reduction = Math.sqrt(cellCount / VISUAL_CONSTANTS.maxGridCells)
    cellWidth *= reduction
    cellHeight *= reduction
    columns = Math.max(1, Math.floor(safeWidth / cellWidth))
    rows = Math.max(1, Math.floor(safeHeight / cellHeight))
  }

  const gridWidth = (columns - 1) * cellWidth
  const gridHeight = (rows - 1) * cellHeight
  const startX = (safeWidth - gridWidth) / 2
  const startY = (safeHeight - gridHeight) / 2
  const cells: GlyphCell[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      cells.push(
        createCell(seed, row, column, startX + column * cellWidth, startY + row * cellHeight),
      )
    }
  }

  return { cells, columns, rows }
}
