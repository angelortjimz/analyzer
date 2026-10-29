import { clamp, VISUAL_CONSTANTS } from './config'

export class BandEnvelopes {
  private readonly values: Float32Array

  constructor(bandCount: number) {
    this.values = new Float32Array(Math.max(0, bandCount))
  }

  update(
    input: ArrayLike<number>,
    deltaSeconds: number,
    attack: number,
    decay: number,
  ): Float32Array {
    const delta = clamp(
      Number.isFinite(deltaSeconds) ? deltaSeconds : 0,
      0,
      VISUAL_CONSTANTS.maxDeltaSeconds,
    )
    const attackSeconds = Math.max(0.001, attack)
    const decaySeconds = Math.max(0.001, decay)

    for (let index = 0; index < this.values.length; index += 1) {
      const current = this.values[index]
      const target = clamp(Number.isFinite(input[index]) ? input[index] : 0)
      const timeConstant = target > current ? attackSeconds : decaySeconds
      const blend = 1 - Math.exp(-delta / timeConstant)
      this.values[index] = current + (target - current) * blend
    }

    return this.values
  }

  reset(): void {
    this.values.fill(0)
  }
}
