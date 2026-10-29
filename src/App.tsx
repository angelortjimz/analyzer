import { useRef, useState, type DragEvent } from 'react'
import { useAudioEngine } from './audio/useAudioEngine'
import { AudioUpload } from './components/AudioUpload'
import { ExportControls } from './components/ExportControls'
import { PlaybackControls } from './components/PlaybackControls'
import { TypographicCanvas } from './components/TypographicCanvas'
import { VisualControls } from './components/VisualControls'
import type { ExportCanvasHandle } from './export/exportCanvas'
import type { ExportResolutionId } from './export/output'
import { useTrackExporter } from './export/useTrackExporter'
import { DEFAULT_VISUAL_CONFIG, sanitizeVisualConfig, type VisualConfig } from './visual/config'
import { generateVisualConfig } from './visual/generator'
import { randomSeed } from './visual/random'

const EXPORTABLE_AUDIO_STATUSES = ['ready', 'playing', 'paused', 'ended'] as const

function isFileDrag(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
}

export default function App() {
  const { engine, snapshot } = useAudioEngine()
  const { exporter, snapshot: exportSnapshot } = useTrackExporter(engine)
  const [config, setConfig] = useState<VisualConfig>(() =>
    sanitizeVisualConfig(DEFAULT_VISUAL_CONFIG),
  )
  const [exportResolution, setExportResolution] = useState<ExportResolutionId>('1080p')
  const [isDragging, setIsDragging] = useState(false)
  const canvasHandleRef = useRef<ExportCanvasHandle>(null)
  const dragDepthRef = useRef(0)
  const isIdle = snapshot.status === 'idle'
  const exportActive = ['preparing', 'recording', 'finalizing'].includes(exportSnapshot.status)
  const canExportTrack = EXPORTABLE_AUDIO_STATUSES.some((status) => status === snapshot.status)
  const exportSupport = exporter.getSupport()

  const updateConfig = (patch: Partial<VisualConfig>) => {
    setConfig((current) => ({ ...current, ...patch }))
  }

  const generate = () => {
    setConfig(generateVisualConfig(randomSeed()))
  }

  const reset = () => {
    setConfig(sanitizeVisualConfig(DEFAULT_VISUAL_CONFIG))
  }

  const resetDragState = () => {
    dragDepthRef.current = 0
    setIsDragging(false)
  }

  const handleDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) {
      return
    }

    event.preventDefault()
    if (exportActive) {
      return
    }

    dragDepthRef.current += 1
    setIsDragging(true)
  }

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = exportActive ? 'none' : 'copy'
  }

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    if (dragDepthRef.current === 0) {
      return
    }

    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) {
      setIsDragging(false)
    }
  }

  const startExport = () => {
    const canvasHandle = canvasHandleRef.current
    if (!canvasHandle) {
      return
    }

    void exporter.start(canvasHandle, exportResolution)
  }

  const loadTrack = (file: File) => {
    exporter.resetFeedback()
    void engine.load(file)
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    resetDragState()

    if (exportActive) {
      return
    }

    const files = Array.from(event.dataTransfer.files)
    if (files.length === 0) {
      return
    }

    const audioFile = files.find((file) => file.type.startsWith('audio/')) ?? files[0]
    loadTrack(audioFile)
  }

  return (
    <main
      className={`app-shell${isDragging ? ' is-dragging' : ''}${isIdle ? ' is-idle' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TypographicCanvas ref={canvasHandleRef} engine={engine} config={config} />

      <section className="transport" aria-label="Audio controls">
        <div className="transport-row">
          <AudioUpload
            trackName={snapshot.trackName}
            loading={snapshot.status === 'loading'}
            disabled={exportActive}
            onSelect={loadTrack}
          />
          <PlaybackControls
            engine={engine}
            status={snapshot.status}
            duration={snapshot.duration}
            locked={exportActive}
          />
          {isDragging ? (
            <span className="drop-hint" role="status">
              Drop audio to load it
            </span>
          ) : (
            isIdle && (
              <span className="transport-note">
                Choose or drop a track. Playback stays in your browser.
              </span>
            )
          )}
        </div>
        <ExportControls
          snapshot={exportSnapshot}
          support={exportSupport}
          resolution={exportResolution}
          trackReady={canExportTrack}
          onResolutionChange={setExportResolution}
          onExport={startExport}
          onCancel={() => exporter.cancel()}
        />
        {snapshot.error && (
          <p className="error-message" role="alert">
            {snapshot.error}
          </p>
        )}
      </section>

      <div className="composition-panel">
        <header className="app-header">
          <h1>Typographic Spectrum</h1>
          <p>Audio, rendered as type.</p>
        </header>

        <VisualControls
          config={config}
          onChange={updateConfig}
          onGenerate={generate}
          onReset={reset}
        />
      </div>
    </main>
  )
}
