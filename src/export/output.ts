export type ExportResolutionId = 'canvas' | '720p' | '1080p'

export interface ExportSizeOption {
  id: ExportResolutionId
  label: string
}

export const EXPORT_SIZE_OPTIONS: readonly ExportSizeOption[] = [
  { id: 'canvas', label: 'Canvas size' },
  { id: '720p', label: '720p' },
  { id: '1080p', label: '1080p' },
]

const STANDARD_DIMENSIONS: Record<Exclude<ExportResolutionId, 'canvas'>, ExportDimension> = {
  '720p': { width: 1_280, height: 720 },
  '1080p': { width: 1_920, height: 1_080 },
}

export interface ExportDimension {
  width: number
  height: number
}

export interface ContainedRect extends ExportDimension {
  x: number
  y: number
}

function toEvenDimension(value: number): number {
  const rounded = Math.max(2, Math.round(Number.isFinite(value) ? value : 2))
  return rounded % 2 === 0 ? rounded : rounded + 1
}

export function getExportDimensions(
  resolution: ExportResolutionId,
  sourceWidth: number,
  sourceHeight: number,
): ExportDimension {
  if (resolution !== 'canvas') {
    return { ...STANDARD_DIMENSIONS[resolution] }
  }

  return {
    width: toEvenDimension(sourceWidth),
    height: toEvenDimension(sourceHeight),
  }
}

export function getContainedRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): ContainedRect {
  const safeSourceWidth = Math.max(1, sourceWidth)
  const safeSourceHeight = Math.max(1, sourceHeight)
  const safeTargetWidth = Math.max(1, targetWidth)
  const safeTargetHeight = Math.max(1, targetHeight)
  const scale = Math.min(safeTargetWidth / safeSourceWidth, safeTargetHeight / safeSourceHeight)
  const width = safeSourceWidth * scale
  const height = safeSourceHeight * scale

  return {
    x: (safeTargetWidth - width) / 2,
    y: (safeTargetHeight - height) / 2,
    width,
    height,
  }
}

export function getExportProgress(elapsed: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0
  }

  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0
  return Math.min(1, safeElapsed / duration)
}

export function estimateVideoBitrate(width: number, height: number): number {
  const pixels = Math.max(1, width) * Math.max(1, height)
  return Math.round(Math.min(24_000_000, Math.max(4_000_000, pixels * 4)))
}

export function createExportFilename(trackName: string | null): string {
  const withoutExtension = (trackName ?? '').replace(/\.[^.]+$/, '')
  const withoutControls = Array.from(withoutExtension, (character) =>
    character.charCodeAt(0) < 32 ? '-' : character,
  ).join('')
  const trackBase = withoutControls
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')
  const safeBase = Array.from(trackBase).slice(0, 80).join('')

  return safeBase ? `${safeBase}-typographic-spectrum.mp4` : 'typographic-spectrum.mp4'
}

export function hasMp4FileHeader(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 8) {
    return false
  }

  const view = new DataView(buffer)
  const boxSize = view.getUint32(0)
  const boxType = String.fromCharCode(
    view.getUint8(4),
    view.getUint8(5),
    view.getUint8(6),
    view.getUint8(7),
  )

  return boxSize >= 8 && boxType === 'ftyp'
}
