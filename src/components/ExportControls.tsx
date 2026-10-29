import { useId } from 'react'
import type { ExportSnapshot, ExportStatus } from '../export/TrackExporter'
import type { ExportSupport } from '../export/capabilities'
import { EXPORT_SIZE_OPTIONS, type ExportResolutionId } from '../export/output'
import { formatPlaybackTime } from '../audio/playback'

interface ExportControlsProps {
  snapshot: ExportSnapshot
  support: ExportSupport
  resolution: ExportResolutionId
  trackReady: boolean
  onResolutionChange: (resolution: ExportResolutionId) => void
  onExport: () => void
  onCancel: () => void
}

const ACTIVE_STATUSES: readonly ExportStatus[] = ['preparing', 'recording', 'finalizing']

function isActiveStatus(status: ExportStatus): boolean {
  return ACTIVE_STATUSES.includes(status)
}

export function ExportControls({
  snapshot,
  support,
  resolution,
  trackReady,
  onResolutionChange,
  onExport,
  onCancel,
}: ExportControlsProps) {
  const selectId = useId()
  const active = isActiveStatus(snapshot.status)
  const canExport = support.supported && trackReady && !active
  const buttonLabel =
    snapshot.status === 'preparing'
      ? 'Preparing…'
      : snapshot.status === 'recording'
        ? 'Recording…'
        : snapshot.status === 'finalizing'
          ? 'Finalizing…'
          : 'Export MP4'

  let statusText: string
  let statusIsError = false

  if (snapshot.status === 'error' && snapshot.error) {
    statusText = snapshot.error
    statusIsError = true
  } else if (snapshot.status === 'complete' && snapshot.fileName) {
    statusText = `Downloaded ${snapshot.fileName}. Original audio included.`
  } else if (!support.supported) {
    statusText = support.message
  } else if (snapshot.status === 'preparing') {
    statusText = `Preparing ${formatPlaybackTime(snapshot.duration)} of audio. Keep this tab visible.`
  } else if (snapshot.status === 'recording') {
    statusText = `Recording the full track. About ${formatPlaybackTime(
      snapshot.duration,
    )} in real time. Keep this tab visible.`
  } else if (snapshot.status === 'finalizing') {
    statusText = 'Finalizing the MP4. Keep this tab visible.'
  } else if (!trackReady) {
    statusText = 'Load a track to export the full performance with its original audio.'
  } else {
    statusText = 'Full track with original audio. Real-time export — keep this tab visible.'
  }

  return (
    <div className="export-controls" aria-label="Video export">
      <div className="export-actions">
        <label className="export-size" htmlFor={selectId}>
          <span>Export size</span>
          <select
            id={selectId}
            value={resolution}
            disabled={active}
            onChange={(event) =>
              onResolutionChange(event.currentTarget.value as ExportResolutionId)
            }
          >
            {EXPORT_SIZE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="export-button" disabled={!canExport} onClick={onExport}>
          {buttonLabel}
        </button>

        {active && (
          <button type="button" className="text-button" onClick={onCancel}>
            Cancel export
          </button>
        )}
      </div>

      <div className="export-feedback">
        {(snapshot.status === 'recording' || snapshot.status === 'finalizing') && (
          <progress
            className="export-progress"
            max={1}
            value={snapshot.progress}
            aria-label="Export progress"
            aria-valuetext={`${formatPlaybackTime(snapshot.elapsed)} of ${formatPlaybackTime(
              snapshot.duration,
            )}`}
          />
        )}
        {snapshot.status === 'recording' && (
          <span className="export-time" aria-hidden="true">
            {formatPlaybackTime(snapshot.elapsed)} / {formatPlaybackTime(snapshot.duration)}
          </span>
        )}
        <p
          className={`export-status${statusIsError ? ' is-error' : ''}`}
          role={statusIsError ? 'alert' : 'status'}
        >
          {statusText}
        </p>
      </div>
    </div>
  )
}
