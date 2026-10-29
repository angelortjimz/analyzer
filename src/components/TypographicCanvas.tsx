import { useEffect, useRef } from 'react'
import type { AudioEngine } from '../audio/AudioEngine'
import type { VisualConfig } from '../visual/config'
import { TypographicRenderer } from '../visual/TypographicRenderer'

interface TypographicCanvasProps {
  engine: AudioEngine
  config: VisualConfig
}

export function TypographicCanvas({ engine, config }: TypographicCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<TypographicRenderer | null>(null)
  const configRef = useRef(config)

  useEffect(() => {
    configRef.current = config
    rendererRef.current?.setConfig(config)
  }, [config])

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
      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      rendererRef.current = null
    }
  }, [engine])

  return (
    <div ref={containerRef} className="canvas-stage" aria-hidden="true">
      <canvas ref={canvasRef} className="typographic-canvas" />
    </div>
  )
}
