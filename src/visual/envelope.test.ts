import { describe, expect, it } from 'vitest'
import { BandEnvelopes } from './envelope'

describe('BandEnvelopes', () => {
  it('rises quickly with attack and falls with decay', () => {
    const envelopes = new BandEnvelopes(1)

    const attacked = envelopes.update([1], 0.05, 0.04, 0.4)[0]
    const decayed = envelopes.update([0], 0.05, 0.04, 0.4)[0]

    expect(attacked).toBeGreaterThan(0.7)
    expect(decayed).toBeLessThan(attacked)
    expect(decayed).toBeGreaterThan(0)
  })

  it('produces comparable results at different frame rates', () => {
    const sixtyFps = new BandEnvelopes(1)
    const thirtyFps = new BandEnvelopes(1)

    for (let frame = 0; frame < 60; frame += 1) {
      sixtyFps.update([1], 1 / 60, 0.08, 0.3)
    }
    for (let frame = 0; frame < 30; frame += 1) {
      thirtyFps.update([1], 1 / 30, 0.08, 0.3)
    }

    expect(sixtyFps.update([1], 0, 0.08, 0.3)[0]).toBeCloseTo(
      thirtyFps.update([1], 0, 0.08, 0.3)[0],
      5,
    )
  })

  it('handles empty, invalid, and unusual frame input safely', () => {
    const envelopes = new BandEnvelopes(2)

    expect(Array.from(envelopes.update([], 0.016, 0.05, 0.3))).toEqual([0, 0])
    expect(Array.from(envelopes.update([Number.NaN, 2], 10, 0.05, 0.3))).toEqual([
      0,
      expect.closeTo(0.8647, 3),
    ])
  })
})
