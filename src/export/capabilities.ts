export interface ExportSupport {
  supported: boolean
  mimeType: string | null
  message: string
}

export const MP4_MIME_CANDIDATES = [
  'video/mp4;codecs="avc1.640028,mp4a.40.2"',
  'video/mp4;codecs="avc1.4D4028,mp4a.40.2"',
  'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
  'video/mp4;codecs="avc1,mp4a.40.2"',
] as const

const UNSUPPORTED_MESSAGE =
  'MP4 export needs a Chromium browser with canvas and MP4 recording support. Playback still works normally.'

export function selectMp4MimeType(isTypeSupported: (mimeType: string) => boolean): string | null {
  return MP4_MIME_CANDIDATES.find((mimeType) => isTypeSupported(mimeType)) ?? null
}

export function detectMp4ExportSupport(): ExportSupport {
  if (
    typeof window === 'undefined' ||
    typeof MediaRecorder === 'undefined' ||
    typeof HTMLCanvasElement === 'undefined' ||
    typeof AudioContext === 'undefined'
  ) {
    return { supported: false, mimeType: null, message: UNSUPPORTED_MESSAGE }
  }

  if (typeof HTMLCanvasElement.prototype.captureStream !== 'function') {
    return { supported: false, mimeType: null, message: UNSUPPORTED_MESSAGE }
  }

  if (typeof AudioContext.prototype.createMediaStreamDestination !== 'function') {
    return { supported: false, mimeType: null, message: UNSUPPORTED_MESSAGE }
  }

  const mimeType = selectMp4MimeType((candidate) => MediaRecorder.isTypeSupported(candidate))
  if (!mimeType) {
    return {
      supported: false,
      mimeType: null,
      message:
        'This browser cannot record MP4 with H.264 video and AAC audio. Playback still works normally.',
    }
  }

  return { supported: true, mimeType, message: 'Full-track MP4 export is available.' }
}
