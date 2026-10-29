import { describe, expect, it } from 'vitest'
import { createCrestLayout, getColumnGlyphIndex, getCrestY, type CrestLayout } from './columns'

function makeLayout(): CrestLayout {
  return { columns: [], topY: 60, baselineY: 660 }
}

describe('createCrestLayout', () => {
  it('creates deterministic, frequency-ordered columns', () => {
    const first = createCrestLayout(1_280, 720, 20, 1, 42)
    const second = createCrestLayout(1_280, 720, 20, 1, 42)

    expect(second).toEqual(first)
    expect(first.columns[0].frequencyPosition).toBe(0)
    expect(first.columns.at(-1)?.frequencyPosition).toBe(1)
    for (let index = 1; index < first.columns.length; index += 1) {
      expect(first.columns[index].frequencyPosition).toBeGreaterThan(
        first.columns[index - 1].frequencyPosition,
      )
    }
  })

  it('preserves column identity across resizing', () => {
    const first = createCrestLayout(1_280, 720, 20, 1, 42)
    const resized = createCrestLayout(900, 600, 20, 1, 42)

    expect(resized.columns[1].shufflePhase).toBe(first.columns[1].shufflePhase)
    expect(resized.columns[1].x).not.toBe(first.columns[1].x)
  })

  it('uses density for horizontal sampling only', () => {
    const sparse = createCrestLayout(1_280, 720, 20, 0.7, 42)
    const dense = createCrestLayout(1_280, 720, 20, 1.4, 42)

    expect(dense.columns.length).toBeGreaterThan(sparse.columns.length)
    expect(dense.topY).toBe(sparse.topY)
    expect(dense.baselineY).toBe(sparse.baselineY)
  })

  it('caps columns and handles unusually small layouts', () => {
    const capped = createCrestLayout(8_000, 4_000, 12, 2, 42)
    const tiny = createCrestLayout(0, 0, 20, 1, 42)

    expect(capped.columns.length).toBeLessThanOrEqual(320)
    expect(tiny.columns).toHaveLength(1)
    expect(Number.isFinite(tiny.columns[0].x)).toBe(true)
    expect(tiny.baselineY).toBeGreaterThan(tiny.topY)
  })
})

describe('getCrestY', () => {
  it('maps amplitude monotonically to vertical position', () => {
    const layout = makeLayout()

    expect(getCrestY(0, layout)).toBe(660)
    expect(getCrestY(0.5, layout)).toBe(360)
    expect(getCrestY(1, layout)).toBe(60)
    expect(getCrestY(2, layout)).toBe(60)
  })
})

describe('getColumnGlyphIndex', () => {
  const column = createCrestLayout(1_280, 720, 20, 1, 42).columns[3]

  it('keeps glyphs stable at zero chaos', () => {
    const first = getColumnGlyphIndex(column, 0, 0, 64, 42)
    const later = getColumnGlyphIndex(column, 1_000, 0, 64, 42)

    expect(later).toBe(first)
  })

  it('changes deterministically as shuffle time advances', () => {
    const indices = new Set(
      Array.from({ length: 12 }, (_, index) =>
        getColumnGlyphIndex(column, index * 0.2, 0.8, 64, 42),
      ),
    )

    expect(indices.size).toBeGreaterThan(1)
    expect(getColumnGlyphIndex(column, 2, 0.8, 64, 42)).toBe(
      getColumnGlyphIndex(column, 2, 0.8, 64, 42),
    )
  })

  it('keeps selections inside the character pool', () => {
    for (let time = 0; time < 5; time += 0.1) {
      const index = getColumnGlyphIndex(column, time, 1, 17, 42)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(17)
    }
    expect(getColumnGlyphIndex(column, 0, 1, 0, 42)).toBe(-1)
  })
})
