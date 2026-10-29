import { describe, expect, it } from 'vitest'
import { createSeededRandom, hashToUnit, randomSeed } from './random'

describe('hashToUnit', () => {
  it('is deterministic and stays in the unit interval', () => {
    for (let index = 0; index < 100; index += 1) {
      const value = hashToUnit(42, index, index * 3, 7)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
      expect(hashToUnit(42, index, index * 3, 7)).toBe(value)
    }
  })

  it('responds to seeds, indices, slots, and salts', () => {
    const value = hashToUnit(42, 4, 2, 7)

    expect(hashToUnit(43, 4, 2, 7)).not.toBe(value)
    expect(hashToUnit(42, 5, 2, 7)).not.toBe(value)
    expect(hashToUnit(42, 4, 3, 7)).not.toBe(value)
    expect(hashToUnit(42, 4, 2, 8)).not.toBe(value)
  })
})

describe('createSeededRandom', () => {
  it('repeats the same sequence for a seed', () => {
    const first = createSeededRandom(99)
    const second = createSeededRandom(99)
    const firstValues = Array.from({ length: 20 }, first)
    const secondValues = Array.from({ length: 20 }, second)

    expect(secondValues).toEqual(firstValues)
    expect(firstValues.every((value) => value >= 0 && value < 1)).toBe(true)
  })

  it('produces a usable random seed', () => {
    const seed = randomSeed()
    expect(Number.isInteger(seed)).toBe(true)
    expect(seed).toBeGreaterThanOrEqual(0)
    expect(seed).toBeLessThanOrEqual(4_294_967_295)
  })
})
