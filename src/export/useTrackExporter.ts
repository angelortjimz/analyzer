import { useEffect, useState, useSyncExternalStore } from 'react'
import type { AudioEngine } from '../audio/AudioEngine'
import { TrackExporter } from './TrackExporter'

export function useTrackExporter(engine: AudioEngine) {
  const [exporter] = useState(() => new TrackExporter(engine))
  const snapshot = useSyncExternalStore(exporter.subscribe, exporter.getSnapshot)

  useEffect(() => {
    return () => {
      exporter.dispose()
    }
  }, [exporter])

  return { exporter, snapshot }
}
