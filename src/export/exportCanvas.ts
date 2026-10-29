import type { ExportResolutionId } from './output'
import { getContainedRect } from './output'

export interface ExportCanvasHandle {
  beginCapture: (resolution: ExportResolutionId) => HTMLCanvasElement | null
  endCapture: () => void
  resetMotion: () => void
}

export function drawExportFrame(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  backgroundColor: string,
): void {
  const context = target.getContext('2d')
  if (!context || source.width <= 0 || source.height <= 0) {
    return
  }

  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.globalAlpha = 1
  context.fillStyle = backgroundColor
  context.fillRect(0, 0, target.width, target.height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  const frame = getContainedRect(source.width, source.height, target.width, target.height)
  context.drawImage(source, frame.x, frame.y, frame.width, frame.height)
  context.restore()
}
