import { describe, expect, it } from 'vitest'
import {
  createExportFilename,
  estimateVideoBitrate,
  getContainedRect,
  getExportDimensions,
  getExportProgress,
  hasMp4FileHeader,
} from './output'

describe('getExportDimensions', () => {
  it('returns exact standard video dimensions', () => {
    expect(getExportDimensions('720p', 800, 600)).toEqual({ width: 1_280, height: 720 })
    expect(getExportDimensions('1080p', 800, 600)).toEqual({ width: 1_920, height: 1_080 })
  })

  it('keeps canvas output even and at least one codec-safe pixel', () => {
    expect(getExportDimensions('canvas', 1_001, 777)).toEqual({ width: 1_002, height: 778 })
    expect(getExportDimensions('canvas', 0, Number.NaN)).toEqual({ width: 2, height: 2 })
  })
})

describe('getContainedRect', () => {
  it('preserves aspect ratio inside a standard frame', () => {
    const rect = getContainedRect(800, 600, 1_920, 1_080)

    expect(rect.height).toBe(1_080)
    expect(rect.width).toBeCloseTo(1_440)
    expect(rect.x).toBeCloseTo(240)
    expect(rect.y).toBe(0)
  })

  it('letterboxes tall sources and pillarboxes wide sources', () => {
    const tall = getContainedRect(400, 800, 1_920, 1_080)
    const wide = getContainedRect(1_600, 400, 1_920, 1_080)

    expect(tall.width).toBe(540)
    expect(tall.y).toBe(0)
    expect(wide.height).toBe(480)
    expect(wide.x).toBe(0)
    expect(wide.y).toBe(300)
  })
})

describe('export progress and sizing helpers', () => {
  it('clamps progress to the track duration', () => {
    expect(getExportProgress(15, 60)).toBe(0.25)
    expect(getExportProgress(-4, 60)).toBe(0)
    expect(getExportProgress(90, 60)).toBe(1)
    expect(getExportProgress(10, 0)).toBe(0)
  })

  it('keeps estimated video bitrate within a bounded range', () => {
    expect(estimateVideoBitrate(1_280, 720)).toBe(4_000_000)
    expect(estimateVideoBitrate(1_920, 1_080)).toBe(8_294_400)
    expect(estimateVideoBitrate(7_680, 4_320)).toBe(24_000_000)
  })
})

describe('createExportFilename', () => {
  it('uses a safe track-derived MP4 name', () => {
    expect(createExportFilename('My Song.mp3')).toBe('My Song-typographic-spectrum.mp4')
    expect(createExportFilename('a:b/c?.wav')).toBe('a-b-c--typographic-spectrum.mp4')
  })

  it('provides a fallback for missing or unusable names', () => {
    expect(createExportFilename(null)).toBe('typographic-spectrum.mp4')
    expect(createExportFilename('...')).toBe('typographic-spectrum.mp4')
  })
})

describe('hasMp4FileHeader', () => {
  function makeHeader(type: string): ArrayBuffer {
    const bytes = new Uint8Array(12)
    new DataView(bytes.buffer).setUint32(0, 12)
    bytes.set(
      Array.from(type, (character) => character.charCodeAt(0)),
      4,
    )
    return bytes.buffer
  }

  it('accepts an ISO base media ftyp box', () => {
    expect(hasMp4FileHeader(makeHeader('ftyp'))).toBe(true)
  })

  it('rejects WebM and undersized data', () => {
    expect(hasMp4FileHeader(makeHeader('webm'))).toBe(false)
    expect(hasMp4FileHeader(new ArrayBuffer(4))).toBe(false)
  })
})
