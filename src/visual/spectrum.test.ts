import { describe, expect, it } from 'vitest'
import { createFrequencyBands, SpectrumProcessor } from './spectrum'

const settings = {
  sampleRate: 48_000,
  fftSize: 2_048,
  frequencyBinCount: 1_024,
  bandCount: 48,
}

describe('createFrequencyBands', () => {
  it('creates valid, ascending logarithmic bands', () => {
    const bands = createFrequencyBands(settings)

    expect(bands).toHaveLength(48)
    for (const band of bands) {
      expect(band.startBin).toBeGreaterThanOrEqual(0)
      expect(band.endBin).toBeGreaterThanOrEqual(band.startBin)
      expect(band.endBin).toBeLessThan(settings.frequencyBinCount)
    }
    for (let index = 1; index < bands.length; index += 1) {
      expect(bands[index].startBin).toBeGreaterThanOrEqual(bands[index - 1].startBin)
    }
  })

  it('keeps narrow low-frequency bands non-empty', () => {
    const bands = createFrequencyBands({
      ...settings,
      minFrequency: 20,
      maxFrequency: 100,
      bandCount: 24,
    })

    expect(bands.every((band) => band.endBin >= band.startBin)).toBe(true)
  })
})

describe('SpectrumProcessor', () => {
  it('returns zero for silence', () => {
    const processor = new SpectrumProcessor(settings)
    const result = processor.process(new Uint8Array(settings.frequencyBinCount), 1.8)

    expect(Array.from(result)).toEqual(new Array(48).fill(0))
  })

  it('handles short and empty input without invalid values', () => {
    const processor = new SpectrumProcessor(settings)

    expect(Array.from(processor.process([], 1.8)).every((value) => value === 0)).toBe(true)
    expect(Array.from(processor.process(new Uint8Array([120]), 1.8)).every(Number.isFinite)).toBe(
      true,
    )
  })

  it('clamps loud input and responds to gain', () => {
    const processor = new SpectrumProcessor(settings)
    const data = new Uint8Array(settings.frequencyBinCount).fill(80)
    const lowGain = Array.from(processor.process(data, 0.5))
    const highGain = Array.from(processor.process(data, 4))

    expect(highGain.every((value) => value >= 0 && value <= 1)).toBe(true)
    expect(highGain[10]).toBeGreaterThan(lowGain[10])
    expect(Math.max(...highGain)).toBeLessThanOrEqual(1)
  })
})
