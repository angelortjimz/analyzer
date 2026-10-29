import { clamp, VISUAL_CONSTANTS } from './config'

export interface FrequencyBand {
  startBin: number
  endBin: number
}

export interface SpectrumSettings {
  sampleRate: number
  fftSize: number
  frequencyBinCount: number
  bandCount?: number
  minFrequency?: number
  maxFrequency?: number
}

export function createFrequencyBands(settings: SpectrumSettings): FrequencyBand[] {
  const sampleRate = Math.max(1, settings.sampleRate)
  const fftSize = Math.max(2, settings.fftSize)
  const binCount = Math.max(1, Math.floor(settings.frequencyBinCount))
  const bandCount = Math.max(1, Math.floor(settings.bandCount ?? VISUAL_CONSTANTS.bandCount))
  const nyquist = sampleRate / 2
  const minimum = clamp(settings.minFrequency ?? VISUAL_CONSTANTS.minFrequency, 1, nyquist)
  const maximum = clamp(settings.maxFrequency ?? VISUAL_CONSTANTS.maxFrequency, minimum, nyquist)
  const binWidth = sampleRate / fftSize
  const bands: FrequencyBand[] = []

  for (let index = 0; index < bandCount; index += 1) {
    const startFrequency = minimum * (maximum / minimum) ** (index / bandCount)
    const endFrequency = minimum * (maximum / minimum) ** ((index + 1) / bandCount)
    const firstBin = clamp(Math.floor(startFrequency / binWidth), 0, binCount - 1)
    const lastBin = clamp(
      Math.max(firstBin, Math.ceil(endFrequency / binWidth) - 1),
      0,
      binCount - 1,
    )

    bands.push({ startBin: firstBin, endBin: lastBin })
  }

  return bands
}

export class SpectrumProcessor {
  private readonly bands: FrequencyBand[]
  private readonly values: Float32Array

  constructor(settings: SpectrumSettings) {
    this.bands = createFrequencyBands(settings)
    this.values = new Float32Array(this.bands.length)
  }

  process(data: ArrayLike<number>, gain: number): Float32Array {
    if (data.length === 0) {
      this.values.fill(0)
      return this.values
    }

    for (let bandIndex = 0; bandIndex < this.bands.length; bandIndex += 1) {
      const band = this.bands[bandIndex]
      const startBin = Math.min(band.startBin, data.length - 1)
      const endBin = Math.min(band.endBin, data.length - 1)
      let total = 0
      let count = 0

      for (let bin = startBin; bin <= endBin; bin += 1) {
        total += clamp(data[bin], 0, 255)
        count += 1
      }

      const average = count > 0 ? total / count / 255 : 0
      const withoutNoise = Math.max(0, average - VISUAL_CONSTANTS.noiseFloor)
      const normalized = withoutNoise / (1 - VISUAL_CONSTANTS.noiseFloor)
      this.values[bandIndex] = clamp(normalized * gain) ** 0.82
    }

    return this.values
  }

  get bandCount(): number {
    return this.bands.length
  }
}
