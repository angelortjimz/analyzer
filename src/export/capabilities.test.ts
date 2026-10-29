import { describe, expect, it } from 'vitest'
import { MP4_MIME_CANDIDATES, getSupportedMp4MimeTypes, selectMp4MimeType } from './capabilities'

describe('selectMp4MimeType', () => {
  it('prefers the first reliably supported H.264/AAC combination', () => {
    const rejected = new Set(['video/mp4;codecs="avc1.640028,mp4a.40.2"'])

    expect(selectMp4MimeType((mimeType) => !rejected.has(mimeType))).toBe(MP4_MIME_CANDIDATES[1])
  })

  it('returns null when no MP4 recording type is supported', () => {
    expect(selectMp4MimeType(() => false)).toBeNull()
  })

  it('keeps all supported fallback configurations in preference order', () => {
    const rejected = new Set<string>([MP4_MIME_CANDIDATES[0], MP4_MIME_CANDIDATES[2]])
    const supported = getSupportedMp4MimeTypes((mimeType) => !rejected.has(mimeType))

    expect(supported).toEqual([
      MP4_MIME_CANDIDATES[1],
      MP4_MIME_CANDIDATES[3],
      MP4_MIME_CANDIDATES[4],
      MP4_MIME_CANDIDATES[5],
    ])
  })
})
