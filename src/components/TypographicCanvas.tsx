import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { AudioEngine } from '../audio/AudioEngine'
import { drawExportFrame, type ExportCanvasHandle } from '../export/exportCanvas'
import { getExportDimensions } from '../export/output'
import type { VisualConfig } from '../visual/config'
import { TypographicRenderer } from '../visual/TypographicRenderer'

interface TypographicCanvasProps {
  engine: AudioEngine
  config: VisualConfig
}

export const TypographicCanvas = forwardRef<ExportCanvasHandle, TypographicCanvasProps>(
  function TypographicCanvas({ engine, config }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<TypographicRenderer | null>(null)
    const exportTargetRef = useRef<HTMLCanvasElement | null>(null)
    const configRef = useRef(config)

    useEffect(() => {
      configRef.current = config
      rendererRef.current?.setConfig(config)
    }, [config])

    useImperativeHandle(
      ref,
      () => ({
        beginCapture: (resolution) => {
          const source = canvasRef.current
          if (!source) {
            return null
          }

          const dimensions = getExportDimensions(resolution, source.width, source.height)
          const target = document.createElement('canvas')
          target.width = dimensions.width
          target.height = dimensions.height
          const context = target.getContext('2d')
          if (!context) {
            return null
          }

          drawExportFrame(source, target, configRef.current.backgroundColor)
          exportTargetRef.current = target
          return target
        },
        endCapture: () => {
          exportTargetRef.current = null
        },
        resetMotion: () => {
          rendererRef.current?.resetMotion()
        },
      }),
      [],
    )

    useEffect(() => {
      const container = containerRef.current
      const canvas = canvasRef.current
      if (!container || !canvas) {
        return
      }

      const renderer = new TypographicRenderer(canvas, configRef.current)
      rendererRef.current = renderer
      let frameId = 0
      let lastTime = 0
      let frequencyData = new Uint8Array(engine.getFrequencyBinCount())

      const resize = () => {
        const bounds = container.getBoundingClientRect()
        renderer.resize(bounds.width, bounds.height, window.devicePixelRatio || 1)
      }
      const observer = new ResizeObserver(resize)
      observer.observe(container)
      window.addEventListener('resize', resize)
      resize()

      const frame = (timeMilliseconds: number) => {
        const binCount = engine.getFrequencyBinCount()
        if (frequencyData.length !== binCount) {
          frequencyData = new Uint8Array(binCount)
        }

        renderer.setAudioFormat(engine.getSampleRate(), engine.getFftSize(), binCount)
        engine.readFrequencyData(frequencyData)
        const timeSeconds = timeMilliseconds / 1_000
        const deltaSeconds = lastTime === 0 ? 0 : (timeMilliseconds - lastTime) / 1_000
        lastTime = timeMilliseconds
        renderer.render(frequencyData, timeSeconds, deltaSeconds, engine.isPlaying())

        const exportTarget = exportTargetRef.current
        if (exportTarget) {
          drawExportFrame(canvas, exportTarget, configRef.current.backgroundColor)
        }
        frameId = requestAnimationFrame(frame)
      }

      frameId = requestAnimationFrame(frame)

      return () => {
        cancelAnimationFrame(frameId)
        observer.disconnect()
        window.removeEventListener('resize', resize)
        rendererRef.current = null
        exportTargetRef.current = null
      }
    }, [engine])

    return (
      <div ref={containerRef} className="canvas-stage" aria-hidden="true">
        <canvas ref={canvasRef} className="typographic-canvas" />
      </div>
    )
  },
)
