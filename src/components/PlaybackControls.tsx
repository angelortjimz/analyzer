import type { PlaybackStatus } from '../audio/AudioEngine'

interface PlaybackControlsProps {
  status: PlaybackStatus
  onToggle: () => void
}

export function PlaybackControls({ status, onToggle }: PlaybackControlsProps) {
  const enabled = ['ready', 'playing', 'paused', 'ended'].includes(status)
  const label =
    status === 'playing'
      ? 'Pause'
      : status === 'paused'
        ? 'Resume'
        : status === 'ended'
          ? 'Play again'
          : status === 'loading'
            ? 'Loading'
            : 'Play'

  return (
    <button type="button" className="playback-button" disabled={!enabled} onClick={onToggle}>
      {label}
    </button>
  )
}
