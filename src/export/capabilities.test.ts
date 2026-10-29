import { describe, expect, it } from 'vitest'
import { MP4_MIME_CANDIDATES, selectMp4MimeType } from './capabilities'

describe('selectMp4MimeType', () => {
  it('prefers the first reliably supported H.264/AAC combination', () => {
    const rejected = new Set(['video/mp4;codecs="avc1.640028,mp4a.40.2"'])

    expect(selectMp4MimeType((mimeType) => !rejected.has(mimeType))).toBe(MP4_MIME_CANDIDATES[1])
  })

  it('returns null when no MP4 recording type is supported', () => {
    expect(selectMp4MimeType(() => false)).toBeNull()
  })
})
