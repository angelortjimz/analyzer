import { BandEnvelopes } from './envelope'
import { clamp, parseGlyphs, VISUAL_CONSTANTS, type VisualConfig } from './config'
import { createGrid, type GlyphCell, type GlyphGrid } from './grid'
import { SpectrumProcessor } from './spectrum'

function smoothstep(start: number, end: number, value: number): number {
  const normalized = clamp((value - start) / (end - start))
  return normalized * normalized * (3 - 2 * normalized)
}

function sampleBand(energies: Float32Array, position: number): number {
  if (energies.length === 0) {
    return 0
  }

  const clamped = clamp(position, 0, energies.length - 1)
  const lower = Math.floor(clamped)
  const upper = Math.min(energies.length - 1, lower + 1)
  const blend = clamped - lower
  return energies[lower] + (energies[upper] - energies[lower]) * blend
}

export class TypographicRenderer {
  private readonly canvas: HTMLCanvasElement
  private readonly context: CanvasRenderingContext2D
  private config: VisualConfig
  private glyphs: string[]
  private grid: GlyphGrid = { cells: [], columns: 0, rows: 0 }
  private spectrum: SpectrumProcessor
  private envelopes: BandEnvelopes
  private width = 1
  private height = 1
  private dpr = 1
  private audioFormat = { sampleRate: 0, fftSize: 0, frequencyBinCount: 0 }

  constructor(canvas: HTMLCanvasElement, config: VisualConfig) {
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas 2D is not available in this browser.')
    }

    this.canvas = canvas
    this.context = context
    this.config = { ...config }
    this.glyphs = parseGlyphs(config.glyphs)
    this.spectrum = new SpectrumProcessor({
      sampleRate: VISUAL_CONSTANTS.defaultSampleRate,
      fftSize: VISUAL_CONSTANTS.fftSize,
      frequencyBinCount: VISUAL_CONSTANTS.fftSize / 2,
    })
    this.envelopes = new BandEnvelopes(this.spectrum.bandCount)
  }

  setConfig(config: VisualConfig): void {
    const previous = this.config
    this.config = { ...config }
    this.glyphs = parseGlyphs(config.glyphs)

    if (
      previous.fontSize !== config.fontSize ||
      previous.density !== config.density ||
      previous.seed !== config.seed
    ) {
      this.rebuildGrid()
    }
  }

  setAudioFormat(sampleRate: number, fftSize: number, frequencyBinCount: number): void {
    if (
      this.audioFormat.sampleRate === sampleRate &&
      this.audioFormat.fftSize === fftSize &&
      this.audioFormat.frequencyBinCount === frequencyBinCount
    ) {
      return
    }

    this.audioFormat = { sampleRate, fftSize, frequencyBinCount }
    this.spectrum = new SpectrumProcessor({ sampleRate, fftSize, frequencyBinCount })
    this.envelopes = new BandEnvelopes(this.spectrum.bandCount)
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = Math.max(1, width)
    this.height = Math.max(1, height)
    this.dpr = clamp(dpr, 1, VISUAL_CONSTANTS.maxDpr)

    const backingWidth = Math.round(this.width * this.dpr)
    const backingHeight = Math.round(this.height * this.dpr)
    if (this.canvas.width !== backingWidth || this.canvas.height !== backingHeight) {
      this.canvas.width = backingWidth
      this.canvas.height = backingHeight
    }

    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.rebuildGrid()
  }

  render(
    frequencyData: Uint8Array<ArrayBuffer>,
    timeSeconds: number,
    deltaSeconds: number,
    isPlaying: boolean,
  ): void {
    const input = this.spectrum.process(isPlaying ? frequencyData : [], this.config.gain)
    const energies = this.envelopes.update(
      input,
      deltaSeconds,
      this.config.attack,
      this.config.decay,
    )

    const context = this.context
    context.clearRect(0, 0, this.width, this.height)
    context.fillStyle = VISUAL_CONSTANTS.paper
    context.fillRect(0, 0, this.width, this.height)
    context.fillStyle = VISUAL_CONSTANTS.ink
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    const restGlyphCount = Math.min(4, this.glyphs.length)
    const fontSize = this.config.fontSize

    for (const cell of this.grid.cells) {
      const energy = this.getCellEnergy(cell, energies)
      const wave = 0.94 + Math.sin(timeSeconds * 1.1 + cell.phase + cell.row * 0.17) * 0.06
      const localEnergy = clamp(energy * cell.sensitivity * wave)
      const threshold = cell.activationThreshold * 0.52
      const activation = smoothstep(threshold, threshold + 0.3, localEnergy)
      const opacity = Math.max(cell.restOpacity, activation * (0.3 + localEnergy * 0.7))

      if (opacity < 0.015 || this.glyphs.length === 0) {
        continue
      }

      const restIndex = Math.min(restGlyphCount - 1, Math.floor(cell.glyphBias * restGlyphCount))
      const energyIndex = Math.min(
        this.glyphs.length - 1,
        Math.floor(clamp(localEnergy * 0.9 + cell.glyphBias * 0.1) * this.glyphs.length),
      )
      const glyph = this.glyphs[activation > 0.04 ? energyIndex : restIndex]
      const travel = this.config.motion * activation * fontSize * 0.16
      const phase = cell.phase + timeSeconds * (0.35 + cell.sensitivity * 0.25)
      const x = cell.x + cell.driftX * travel + Math.sin(phase) * travel * 0.35
      const y = cell.y + cell.driftY * travel - activation * this.config.motion * fontSize * 0.12
      const scale = 1 + activation * this.config.motion * 0.16

      context.globalAlpha = opacity
      context.font = `400 ${fontSize * scale}px ${VISUAL_CONSTANTS.fontFamily}`
      context.fillText(glyph, x, y)
    }

    context.globalAlpha = 1
  }

  private getCellEnergy(cell: GlyphCell, energies: Float32Array): number {
    const columnRatio = this.grid.columns <= 1 ? 0.5 : cell.column / (this.grid.columns - 1)
    const position = columnRatio * Math.max(0, energies.length - 1) + cell.bandOffset
    return sampleBand(energies, position)
  }

  private rebuildGrid(): void {
    this.grid = createGrid(
      this.width,
      this.height,
      this.config.fontSize,
      this.config.density,
      this.config.seed,
    )
  }
}
