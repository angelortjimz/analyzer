import { getColumnColor, getColumnFontId } from './assignments'
import {
  createCrestLayout,
  getColumnGlyphIndex,
  getColumnShuffleSlot,
  getCrestY,
  type CrestLayout,
} from './columns'
import { clamp, parseGlyphs, VISUAL_CONSTANTS, type VisualConfig } from './config'
import { BandEnvelopes } from './envelope'
import { getFontFamily } from './fonts'
import { SpectrumProcessor } from './spectrum'

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
  private layout: CrestLayout = { columns: [], topY: 0, baselineY: 1 }
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
      this.rebuildLayout()
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
    this.rebuildLayout()
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
    context.fillStyle = this.config.backgroundColor
    context.fillRect(0, 0, this.width, this.height)
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.globalAlpha = 1

    let activeFont = ''
    let activeColor = ''

    for (const column of this.layout.columns) {
      const bandPosition = column.frequencyPosition * Math.max(0, energies.length - 1)
      const energy = sampleBand(energies, bandPosition)
      if (energy <= 0.004) {
        continue
      }

      const slot = getColumnShuffleSlot(column, timeSeconds, this.config.chaos)
      const glyphIndex = getColumnGlyphIndex(column, slot, this.glyphs.length, this.config.seed)
      if (glyphIndex < 0) {
        continue
      }

      const font = getFontFamily(getColumnFontId(this.config, column, slot))
      const color = getColumnColor(this.config, column, slot)
      if (font !== activeFont) {
        context.font = `400 ${this.config.fontSize}px ${font}`
        activeFont = font
      }
      if (color !== activeColor) {
        context.fillStyle = color
        activeColor = color
      }

      context.fillText(this.glyphs[glyphIndex], column.x, getCrestY(energy, this.layout))
    }
  }

  private rebuildLayout(): void {
    this.layout = createCrestLayout(
      this.width,
      this.height,
      this.config.fontSize,
      this.config.density,
      this.config.seed,
    )
  }
}
