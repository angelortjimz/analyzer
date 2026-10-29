import { describe, expect, it } from 'vitest'
import { createGrid } from './grid'

const dimensions = { width: 1_280, height: 720, fontSize: 20, density: 1 }

describe('createGrid', () => {
  it('is deterministic for the same seed and layout', () => {
    const first = createGrid(dimensions.width, dimensions.height, 20, 1, 42)
    const second = createGrid(dimensions.width, dimensions.height, 20, 1, 42)

    expect(second).toEqual(first)
  })

  it('changes cell traits when the seed changes', () => {
    const first = createGrid(dimensions.width, dimensions.height, 20, 1, 42)
    const second = createGrid(dimensions.width, dimensions.height, 20, 1, 43)

    expect(second.cells[0]).not.toEqual(first.cells[0])
  })

  it('preserves shared cell identities across resizing', () => {
    const first = createGrid(dimensions.width, dimensions.height, 20, 1, 42)
    const resized = createGrid(900, 600, 20, 1, 42)
    const shared = resized.cells.find((cell) => cell.row === 1 && cell.column === 1)
    const original = first.cells.find((cell) => cell.row === 1 && cell.column === 1)

    expect(shared).toBeDefined()
    expect(original).toBeDefined()
    expect(shared?.activationThreshold).toBe(original?.activationThreshold)
    expect(shared?.phase).toBe(original?.phase)
    expect(shared?.glyphBias).toBe(original?.glyphBias)
  })

  it('keeps positions finite and inside unusually small layouts', () => {
    const grid = createGrid(0, 0, 20, 1, 42)

    expect(grid.cells).toHaveLength(1)
    expect(Number.isFinite(grid.cells[0].x)).toBe(true)
    expect(Number.isFinite(grid.cells[0].y)).toBe(true)
  })

  it('caps very dense grids', () => {
    const grid = createGrid(8_000, 4_000, 12, 2, 42)

    expect(grid.cells.length).toBeLessThanOrEqual(12_000)
  })
})
