import { describe, expect, it } from 'vitest'
import { clampPlaybackTime, clampVolume, formatPlaybackTime } from './playback'

describe('clampPlaybackTime', () => {
  it('clamps values to the track duration', () => {
    expect(clampPlaybackTime(-2, 180)).toBe(0)
    expect(clampPlaybackTime(45.5, 180)).toBe(45.5)
    expect(clampPlaybackTime(240, 180)).toBe(180)
  })

  it('handles invalid values and missing durations', () => {
    expect(clampPlaybackTime(Number.NaN, 180)).toBe(0)
    expect(clampPlaybackTime(12, 0)).toBe(0)
    expect(clampPlaybackTime(12, Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('clampVolume', () => {
  it('keeps volume between silence and full level', () => {
    expect(clampVolume(-1)).toBe(0)
    expect(clampVolume(0.42)).toBe(0.42)
    expect(clampVolume(2)).toBe(1)
    expect(clampVolume(Number.NaN)).toBe(0)
  })
})

describe('formatPlaybackTime', () => {
  it('formats minutes and seconds', () => {
    expect(formatPlaybackTime(0)).toBe('0:00')
    expect(formatPlaybackTime(9.9)).toBe('0:09')
    expect(formatPlaybackTime(75)).toBe('1:15')
  })

  it('accounts for tiny decoded-duration rounding errors', () => {
    expect(formatPlaybackTime(0.999_98)).toBe('0:01')
    expect(formatPlaybackTime(59.999_98)).toBe('1:00')
  })

  it('adds hours when needed', () => {
    expect(formatPlaybackTime(3_600)).toBe('1:00:00')
    expect(formatPlaybackTime(7_384)).toBe('2:03:04')
  })

  it('never displays invalid time as a negative value', () => {
    expect(formatPlaybackTime(-4)).toBe('0:00')
    expect(formatPlaybackTime(Number.NaN)).toBe('0:00')
  })
})
