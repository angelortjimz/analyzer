import { useState } from 'react'
import { useAudioEngine } from './audio/useAudioEngine'
import { AudioUpload } from './components/AudioUpload'
import { PlaybackControls } from './components/PlaybackControls'
import { TypographicCanvas } from './components/TypographicCanvas'
import { VisualControls } from './components/VisualControls'
import { DEFAULT_VISUAL_CONFIG, type VisualConfig } from './visual/config'

export default function App() {
  const { engine, snapshot } = useAudioEngine()
  const [config, setConfig] = useState<VisualConfig>(DEFAULT_VISUAL_CONFIG)
  const isIdle = snapshot.status === 'idle'

  const updateConfig = (patch: Partial<VisualConfig>) => {
    setConfig((current) => ({ ...current, ...patch }))
  }

  return (
    <main className={`app-shell${isIdle ? ' is-idle' : ''}`}>
      <TypographicCanvas engine={engine} config={config} />

      <header className="app-header">
        <h1>Typographic Spectrum</h1>
        <p>Audio, rendered as type.</p>
      </header>

      <section
        className={`transport${isIdle ? ' transport--idle' : ''}`}
        aria-label="Audio controls"
      >
        {isIdle && (
          <div className="transport-intro">
            <p>Give a track a typographic life.</p>
            <span>Plays locally. Nothing leaves your browser.</span>
          </div>
        )}
        <div className="transport-row">
          <AudioUpload
            trackName={snapshot.trackName}
            loading={snapshot.status === 'loading'}
            onSelect={(file) => void engine.load(file)}
          />
          {!isIdle && (
            <PlaybackControls
              status={snapshot.status}
              onToggle={() => void engine.togglePlayback()}
            />
          )}
        </div>
        {snapshot.error && (
          <p className="error-message" role="alert">
            {snapshot.error}
          </p>
        )}
      </section>

      {!isIdle && <VisualControls config={config} onChange={updateConfig} />}
    </main>
  )
}
