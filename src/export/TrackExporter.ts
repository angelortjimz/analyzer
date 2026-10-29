import type { AudioEngine, AudioRecordingTap, PlaybackStatus } from '../audio/AudioEngine'
import { detectMp4ExportSupport, type ExportSupport } from './capabilities'
import type { ExportCanvasHandle } from './exportCanvas'
import {
  createExportFilename,
  estimateVideoBitrate,
  getExportProgress,
  hasMp4FileHeader,
  type ExportResolutionId,
} from './output'

export type ExportStatus = 'idle' | 'preparing' | 'recording' | 'finalizing' | 'complete' | 'error'

export interface ExportSnapshot {
  status: ExportStatus
  elapsed: number
  duration: number
  progress: number
  error: string | null
  fileName: string | null
}

interface ActiveExport {
  phase: 'preparing' | 'recording' | 'finalizing'
  cancelled: boolean
  endRequested: boolean
  duration: number
  mimeType: string
  recorder: MediaRecorder | null
  stream: MediaStream | null
  audioTap: AudioRecordingTap | null
  canvasHandle: ExportCanvasHandle | null
  chunks: Blob[]
  progressTimer: number | null
  engineUnsubscribe: (() => void) | null
}

const INITIAL_SNAPSHOT: ExportSnapshot = {
  status: 'idle',
  elapsed: 0,
  duration: 0,
  progress: 0,
  error: null,
  fileName: null,
}

type ExportStartStage = 'audio' | 'canvas' | 'recorder' | 'playback'

interface RecorderAttempt {
  mimeType: string
  option: 'bitrate' | 'browser-default'
  error: unknown
}

class ExportStartError extends Error {
  readonly stage: ExportStartStage
  readonly details: unknown

  constructor(stage: ExportStartStage, message: string, details?: unknown) {
    super(message)
    this.name = 'ExportStartError'
    this.stage = stage
    this.details = details
  }
}

class InvalidMp4Error extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidMp4Error'
  }
}

function getErrorName(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string' &&
    error.name.length > 0
  ) {
    return error.name
  }

  return 'UnknownError'
}

function getRecorderEventError(event: Event): unknown {
  if ('error' in event) {
    return event.error
  }

  return event
}

function getStartFailureCause(details: unknown): unknown {
  if (typeof details === 'object' && details !== null && 'error' in details) {
    return details.error
  }

  return details
}

function startMessageForStage(stage: ExportStartStage, error: unknown): string {
  const errorName = getErrorName(error)

  if (stage === 'audio') {
    return 'The browser could not create an export audio stream. Try playing the track once, then export again.'
  }
  if (stage === 'canvas') {
    return 'The browser could not capture the artwork for export. Try a standard output size or refresh the page.'
  }
  if (stage === 'playback') {
    return 'The track could not start for export. Try playing it once, then export again.'
  }
  if (errorName === 'NotSupportedError') {
    return 'This browser rejected every advertised MP4 H.264/AAC recording mode.'
  }

  return `MP4 recording could not start (${errorName}).`
}

const READY_STATUSES: readonly PlaybackStatus[] = ['ready', 'playing', 'paused', 'ended']
const GENERIC_ERROR =
  'The MP4 export could not be completed. Try a smaller output size or another Chromium build.'
const INVALID_MP4_ERROR =
  'The browser did not produce a valid MP4 file, so no download was kept. Try the Canvas size option or another Chromium build.'

export class TrackExporter {
  private readonly engine: AudioEngine
  private readonly support: ExportSupport
  private readonly listeners = new Set<() => void>()
  private snapshot: ExportSnapshot = INITIAL_SNAPSHOT
  private active: ActiveExport | null = null
  private downloadUrl: string | null = null
  private downloadUrlTimer: number | null = null

  constructor(engine: AudioEngine) {
    this.engine = engine
    this.support = detectMp4ExportSupport()
  }

  getSnapshot = (): ExportSnapshot => this.snapshot

  getSupport = (): ExportSupport => this.support

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async start(handle: ExportCanvasHandle, resolution: ExportResolutionId): Promise<void> {
    if (this.active) {
      return
    }

    if (!this.support.supported || !this.support.mimeType) {
      this.updateSnapshot({
        ...INITIAL_SNAPSHOT,
        status: 'error',
        error: this.support.message,
      })
      return
    }

    const audioSnapshot = this.engine.getSnapshot()
    if (!READY_STATUSES.includes(audioSnapshot.status) || audioSnapshot.duration <= 0) {
      this.updateSnapshot({
        ...INITIAL_SNAPSHOT,
        status: 'error',
        error: 'Load a track before exporting an MP4.',
      })
      return
    }

    this.releaseDownloadUrl()
    this.engine.pause()
    this.engine.seek(0)

    const session: ActiveExport = {
      phase: 'preparing',
      cancelled: false,
      endRequested: false,
      duration: audioSnapshot.duration,
      mimeType: this.support.mimeType,
      recorder: null,
      stream: null,
      audioTap: null,
      canvasHandle: null,
      chunks: [],
      progressTimer: null,
      engineUnsubscribe: null,
    }
    this.active = session
    this.updateSnapshot({
      status: 'preparing',
      elapsed: 0,
      duration: session.duration,
      progress: 0,
      error: null,
      fileName: null,
    })

    let stage: ExportStartStage = 'audio'

    try {
      const audioTap = this.engine.createRecordingTap()
      if (!audioTap) {
        throw new ExportStartError('audio', 'The browser could not create an export audio track.')
      }
      session.audioTap = audioTap

      stage = 'canvas'
      const target = handle.beginCapture(resolution)
      if (!target) {
        throw new ExportStartError('canvas', 'The browser could not create the export canvas.')
      }
      session.canvasHandle = handle

      const videoStream = target.captureStream(30)
      const videoTrack = videoStream.getVideoTracks()[0]
      if (!videoTrack) {
        throw new ExportStartError('canvas', 'The browser could not capture the artwork.')
      }

      session.stream = new MediaStream([videoTrack, ...audioTap.stream.getAudioTracks()])
      if (session.stream.getAudioTracks().length === 0) {
        throw new ExportStartError(
          'audio',
          'The browser created a recording stream without an audio track.',
        )
      }

      stage = 'recorder'
      const recorder = this.createRecorder(session, session.stream, target)
      session.recorder = recorder

      stage = 'playback'
      handle.resetMotion()
      this.engine.seek(0)
      session.engineUnsubscribe = this.engine.subscribe(() => {
        this.handleEngineChange(session)
      })

      session.phase = 'recording'
      this.updateSnapshot({
        status: 'recording',
        elapsed: 0,
        duration: session.duration,
        progress: 0,
        error: null,
        fileName: null,
      })
      session.progressTimer = window.setInterval(() => {
        this.updateProgress(session)
      }, 250)

      await this.engine.play()
      if (!this.isActive(session)) {
        this.engine.pause()
        return
      }

      const status = this.engine.getSnapshot().status
      if (status !== 'playing' && status !== 'ended') {
        throw new ExportStartError(
          'playback',
          this.engine.getSnapshot().error ?? 'Playback did not start for the export.',
        )
      }
    } catch (error) {
      const failure =
        error instanceof ExportStartError
          ? error
          : new ExportStartError(stage, 'The export could not start.', error)
      console.error(
        `[Typographic Spectrum] MP4 export failed during ${failure.stage} startup.`,
        failure.details ?? error,
      )

      if (this.isActive(session)) {
        this.failSession(
          session,
          startMessageForStage(failure.stage, getStartFailureCause(failure.details ?? error)),
        )
      }
    }
  }

  private createRecorder(
    session: ActiveExport,
    stream: MediaStream,
    target: HTMLCanvasElement,
  ): MediaRecorder {
    const attempts: RecorderAttempt[] = []
    const bitrates: MediaRecorderOptions = {
      videoBitsPerSecond: estimateVideoBitrate(target.width, target.height),
      audioBitsPerSecond: 192_000,
    }

    for (const mimeType of this.support.mimeTypes) {
      for (const option of ['bitrate', 'browser-default'] as const) {
        let recorder: MediaRecorder | null = null

        try {
          recorder = new MediaRecorder(stream, {
            mimeType,
            ...(option === 'bitrate' ? bitrates : {}),
          })
          this.attachRecorderHandlers(session, recorder)
          recorder.start()
          session.mimeType = mimeType
          return recorder
        } catch (error) {
          attempts.push({ mimeType, option, error })
          if (recorder) {
            recorder.ondataavailable = null
            recorder.onerror = null
            recorder.onstop = null
            if (recorder.state !== 'inactive') {
              try {
                recorder.stop()
              } catch {
                // A recorder that failed to start may already be inactive.
              }
            }
          }
        }
      }
    }

    const lastError = attempts.at(-1)?.error
    throw new ExportStartError('recorder', 'No supported MP4 recorder configuration could start.', {
      attempts,
      error: lastError,
    })
  }

  private attachRecorderHandlers(session: ActiveExport, recorder: MediaRecorder): void {
    recorder.ondataavailable = (event) => {
      if (this.isActive(session) && event.data.size > 0) {
        session.chunks.push(event.data)
      }
    }
    recorder.onerror = (event) => {
      const error = getRecorderEventError(event)
      console.error('[Typographic Spectrum] MediaRecorder stopped with an error.', error)
      this.failSession(
        session,
        `The browser stopped MP4 recording (${getErrorName(error)}). No file was kept.`,
      )
    }
    recorder.onstop = () => {
      void this.finalizeRecording(session, recorder)
    }
  }

  resetFeedback(): void {
    if (this.active) {
      return
    }

    this.updateSnapshot(INITIAL_SNAPSHOT)
  }

  cancel(): void {
    const session = this.active
    if (!session) {
      return
    }

    session.cancelled = true
    this.engine.pause()
    this.releaseResources(session)
    this.active = null
    this.updateSnapshot({
      status: 'idle',
      elapsed: 0,
      duration: session.duration,
      progress: 0,
      error: null,
      fileName: null,
    })
  }

  dispose(): void {
    const session = this.active
    if (session) {
      session.cancelled = true
      this.engine.pause()
      this.releaseResources(session)
      this.active = null
    }

    this.releaseDownloadUrl()
    this.listeners.clear()
  }

  private isActive(session: ActiveExport): boolean {
    return this.active === session && !session.cancelled
  }

  private handleEngineChange(session: ActiveExport): void {
    if (!this.isActive(session) || session.phase !== 'recording') {
      return
    }

    const status = this.engine.getSnapshot().status
    if (status === 'ended') {
      this.finishTrack(session)
    } else if (status === 'error') {
      console.error(
        '[Typographic Spectrum] Audio playback failed during MP4 export.',
        this.engine.getSnapshot().error,
      )
      this.failSession(
        session,
        'Playback stopped during the export. The partial file was discarded.',
      )
    }
  }

  private updateProgress(session: ActiveExport): void {
    if (!this.isActive(session) || session.phase !== 'recording') {
      return
    }

    const elapsed = Math.min(session.duration, this.engine.getCurrentTime())
    this.updateSnapshot({
      ...this.snapshot,
      elapsed,
      progress: getExportProgress(elapsed, session.duration),
    })
  }

  private finishTrack(session: ActiveExport): void {
    if (!this.isActive(session)) {
      return
    }

    session.phase = 'finalizing'
    session.endRequested = true
    this.clearProgressTimer(session)
    session.engineUnsubscribe?.()
    session.engineUnsubscribe = null
    this.updateSnapshot({
      ...this.snapshot,
      status: 'finalizing',
      elapsed: session.duration,
      progress: 1,
      error: null,
    })

    const recorder = session.recorder
    if (!recorder || recorder.state === 'inactive') {
      console.error('[Typographic Spectrum] MP4 recorder was not active when the track ended.')
      this.failSession(session, GENERIC_ERROR)
      return
    }

    try {
      recorder.stop()
    } catch (error) {
      console.error('[Typographic Spectrum] MP4 recorder could not be stopped.', error)
      this.failSession(session, GENERIC_ERROR)
    }
  }

  private async finalizeRecording(session: ActiveExport, recorder: MediaRecorder): Promise<void> {
    if (!this.isActive(session)) {
      return
    }

    if (!session.endRequested) {
      console.error('[Typographic Spectrum] MP4 recorder stopped before the track ended.')
      this.failSession(session, 'The export stopped before the track finished. No file was kept.')
      return
    }

    const chunks = session.chunks.slice()
    const blob = new Blob(chunks, {
      type: recorder.mimeType || session.mimeType || 'video/mp4',
    })
    this.releaseResources(session)

    try {
      if (blob.size === 0) {
        throw new InvalidMp4Error('The recorder produced an empty file.')
      }

      const header = await blob.slice(0, 12).arrayBuffer()
      if (!hasMp4FileHeader(header)) {
        throw new InvalidMp4Error('The recorder did not produce an MP4 container.')
      }

      if (!this.isActive(session)) {
        return
      }

      const fileName = createExportFilename(this.engine.getSnapshot().trackName)
      this.triggerDownload(blob, fileName)
      this.active = null
      this.updateSnapshot({
        status: 'complete',
        elapsed: session.duration,
        duration: session.duration,
        progress: 1,
        error: null,
        fileName,
      })
    } catch (error) {
      console.error('[Typographic Spectrum] MP4 finalization failed.', error)
      if (!this.isActive(session)) {
        return
      }

      this.active = null
      this.updateSnapshot({
        status: 'error',
        elapsed: session.duration,
        duration: session.duration,
        progress: 1,
        error: error instanceof InvalidMp4Error ? INVALID_MP4_ERROR : GENERIC_ERROR,
        fileName: null,
      })
    }
  }

  private failSession(session: ActiveExport, message: string): void {
    if (!this.isActive(session)) {
      return
    }

    const elapsed = Math.min(session.duration, this.engine.getCurrentTime())
    this.engine.pause()
    this.releaseResources(session)
    this.active = null
    this.updateSnapshot({
      status: 'error',
      elapsed,
      duration: session.duration,
      progress: getExportProgress(elapsed, session.duration),
      error: message,
      fileName: null,
    })
  }

  private releaseResources(session: ActiveExport): void {
    this.clearProgressTimer(session)
    session.engineUnsubscribe?.()
    session.engineUnsubscribe = null

    const recorder = session.recorder
    session.recorder = null
    if (recorder) {
      recorder.ondataavailable = null
      recorder.onerror = null
      recorder.onstop = null
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop()
        } catch {
          // The recorder may already have stopped while teardown was running.
        }
      }
    }

    session.canvasHandle?.endCapture()
    session.canvasHandle = null
    session.audioTap?.dispose()
    session.audioTap = null
    for (const track of session.stream?.getTracks() ?? []) {
      track.stop()
    }
    session.stream = null
    session.chunks = []
  }

  private clearProgressTimer(session: ActiveExport): void {
    if (session.progressTimer === null) {
      return
    }

    window.clearInterval(session.progressTimer)
    session.progressTimer = null
  }

  private triggerDownload(blob: Blob, fileName: string): void {
    this.releaseDownloadUrl()
    const url = URL.createObjectURL(blob)
    this.downloadUrl = url

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.rel = 'noopener'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()

    this.downloadUrlTimer = window.setTimeout(() => {
      if (this.downloadUrl === url) {
        this.releaseDownloadUrl()
      }
    }, 60_000)
  }

  private releaseDownloadUrl(): void {
    if (this.downloadUrlTimer !== null) {
      window.clearTimeout(this.downloadUrlTimer)
      this.downloadUrlTimer = null
    }

    if (!this.downloadUrl) {
      return
    }

    URL.revokeObjectURL(this.downloadUrl)
    this.downloadUrl = null
  }

  private updateSnapshot(snapshot: ExportSnapshot): void {
    this.snapshot = snapshot
    for (const listener of this.listeners) {
      listener()
    }
  }
}
