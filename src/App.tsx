import { useRef, useState, type DragEvent } from 'react'
import { useAudioEngine } from './audio/useAudioEngine'
import { AudioUpload } from './components/AudioUpload'
import { PlaybackControls } from './components/PlaybackControls'
import { TypographicCanvas } from './components/TypographicCanvas'
import { VisualControls } from './components/VisualControls'
import { DEFAULT_VISUAL_CONFIG, sanitizeVisualConfig, type VisualConfig } from './visual/config'
import { generateVisualConfig } from './visual/generator'
import { randomSeed } from './visual/random'

function isFileDrag(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
}

export default function App() {
  const { engine, snapshot } = useAudioEngine()
  const [config, setConfig] = useState<VisualConfig>(() =>
    sanitizeVisualConfig(DEFAULT_VISUAL_CONFIG),
  )
  const [isDragging, setIsDragging] = useState(false)
  const dragDepthRef = useRef(0)
  const isIdle = snapshot.status === 'idle'

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
    dragDepthRef.current += 1
    setIsDragging(true)
  }

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
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

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    resetDragState()

    const files = Array.from(event.dataTransfer.files)
    if (files.length === 0) {
      return
    }

    const audioFile = files.find((file) => file.type.startsWith('audio/')) ?? files[0]
    void engine.load(audioFile)
  }

  return (
    <main
      className={`app-shell${isDragging ? ' is-dragging' : ''}${isIdle ? ' is-idle' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TypographicCanvas engine={engine} config={config} />

      <section className="transport" aria-label="Audio controls">
        <div className="transport-row">
          <AudioUpload
            trackName={snapshot.trackName}
            loading={snapshot.status === 'loading'}
            onSelect={(file) => void engine.load(file)}
          />
          <PlaybackControls engine={engine} status={snapshot.status} duration={snapshot.duration} />
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
