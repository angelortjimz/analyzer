export interface ExportSupport {
  supported: boolean
  mimeType: string | null
  mimeTypes: readonly string[]
  message: string
}

export const MP4_MIME_CANDIDATES = [
  'video/mp4;codecs="avc1.640028,mp4a.40.2"',
  'video/mp4;codecs="avc1.4D4028,mp4a.40.2"',
  'video/mp4;codecs="avc1.64001F,mp4a.40.2"',
  'video/mp4;codecs="avc1.4D401F,mp4a.40.2"',
  'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
  'video/mp4;codecs="avc1,mp4a.40.2"',
] as const

const UNSUPPORTED_MESSAGE =
  'MP4 export needs a Chromium browser with canvas and MP4 recording support. Playback still works normally.'

export function getSupportedMp4MimeTypes(isTypeSupported: (mimeType: string) => boolean): string[] {
  return MP4_MIME_CANDIDATES.filter((mimeType) => isTypeSupported(mimeType))
}

export function selectMp4MimeType(isTypeSupported: (mimeType: string) => boolean): string | null {
  return getSupportedMp4MimeTypes(isTypeSupported)[0] ?? null
}

export function detectMp4ExportSupport(): ExportSupport {
  if (
    typeof window === 'undefined' ||
    typeof MediaRecorder === 'undefined' ||
    typeof HTMLCanvasElement === 'undefined' ||
    typeof AudioContext === 'undefined'
  ) {
    return {
      supported: false,
      mimeType: null,
      mimeTypes: [],
      message: UNSUPPORTED_MESSAGE,
    }
  }

  if (typeof HTMLCanvasElement.prototype.captureStream !== 'function') {
    return {
      supported: false,
      mimeType: null,
      mimeTypes: [],
      message: UNSUPPORTED_MESSAGE,
    }
  }

  if (typeof AudioContext.prototype.createMediaStreamDestination !== 'function') {
    return {
      supported: false,
      mimeType: null,
      mimeTypes: [],
      message: UNSUPPORTED_MESSAGE,
    }
  }

  const mimeTypes = getSupportedMp4MimeTypes((candidate) =>
    MediaRecorder.isTypeSupported(candidate),
  )
  const mimeType = mimeTypes[0] ?? null
  if (!mimeType) {
    return {
      supported: false,
      mimeType: null,
      mimeTypes: [],
      message:
        'This browser cannot record MP4 with H.264 video and AAC audio. Playback still works normally.',
    }
  }

  return {
    supported: true,
    mimeType,
    mimeTypes,
    message: 'Full-track MP4 export is available.',
  }
}
