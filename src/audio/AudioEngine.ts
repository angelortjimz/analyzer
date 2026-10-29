import { VISUAL_CONSTANTS } from '../visual/config'

export type PlaybackStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error'

export interface AudioSnapshot {
  status: PlaybackStatus
  trackName: string | null
  duration: number
  error: string | null
}

const INITIAL_SNAPSHOT: AudioSnapshot = {
  status: 'idle',
  trackName: null,
  duration: 0,
  error: null,
}

export class AudioEngine {
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private buffer: AudioBuffer | null = null
  private source: AudioBufferSourceNode | null = null
  private snapshot: AudioSnapshot = INITIAL_SNAPSHOT
  private readonly listeners = new Set<() => void>()
  private loadGeneration = 0
  private playbackGeneration = 0
  private startedAt = 0
  private offset = 0

  getSnapshot = (): AudioSnapshot => this.snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async load(file: File): Promise<void> {
    const generation = ++this.loadGeneration
    this.stopSource()
    this.buffer = null
    this.offset = 0
    this.updateSnapshot({
      status: 'loading',
      trackName: file.name,
      duration: 0,
      error: null,
    })

    try {
      const { context } = this.ensureAudioGraph()
      if (context.state === 'suspended') {
        await context.resume()
      }

      const data = await file.arrayBuffer()
      const buffer = await context.decodeAudioData(data)
      if (generation !== this.loadGeneration) {
        return
      }

      this.buffer = buffer
      this.offset = 0
      this.updateSnapshot({
        status: 'ready',
        trackName: file.name,
        duration: buffer.duration,
        error: null,
      })
    } catch {
      if (generation !== this.loadGeneration) {
        return
      }

      this.buffer = null
      this.updateSnapshot({
        status: 'error',
        trackName: file.name,
        duration: 0,
        error: 'This file could not be decoded. Try an MP3, WAV, or another supported audio file.',
      })
    }
  }

  async play(): Promise<void> {
    const buffer = this.buffer
    if (!buffer || this.snapshot.status === 'playing' || this.snapshot.status === 'loading') {
      return
    }

    const loadGeneration = this.loadGeneration
    const playbackGeneration = ++this.playbackGeneration

    try {
      const { context, analyser } = this.ensureAudioGraph()
      if (context.state === 'suspended') {
        await context.resume()
      }
      if (
        playbackGeneration !== this.playbackGeneration ||
        loadGeneration !== this.loadGeneration ||
        this.buffer !== buffer
      ) {
        return
      }

      if (this.snapshot.status === 'ended' || this.offset >= buffer.duration) {
        this.offset = 0
      }

      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(analyser)
      this.source = source
      this.startedAt = context.currentTime

      source.onended = () => {
        if (playbackGeneration !== this.playbackGeneration) {
          return
        }

        source.disconnect()
        if (this.source === source) {
          this.source = null
        }
        this.offset = 0
        this.updateSnapshot({ ...this.snapshot, status: 'ended', error: null })
      }

      source.start(0, this.offset)
      this.updateSnapshot({ ...this.snapshot, status: 'playing', error: null })
    } catch {
      if (playbackGeneration !== this.playbackGeneration) {
        return
      }

      this.stopSource()
      this.updateSnapshot({
        ...this.snapshot,
        status: 'error',
        error: 'Playback could not start. Try selecting the audio file again.',
      })
    }
  }

  pause(): void {
    if (this.snapshot.status !== 'playing') {
      return
    }

    this.offset = this.getCurrentTime()
    this.stopSource()
    this.updateSnapshot({ ...this.snapshot, status: 'paused', error: null })
  }

  async togglePlayback(): Promise<void> {
    if (this.snapshot.status === 'playing') {
      this.pause()
      return
    }

    await this.play()
  }

  readFrequencyData(target: Uint8Array<ArrayBuffer>): void {
    if (!this.analyser) {
      target.fill(0)
      return
    }

    this.analyser.getByteFrequencyData(target)
  }

  getFrequencyBinCount(): number {
    return this.analyser?.frequencyBinCount ?? VISUAL_CONSTANTS.fftSize / 2
  }

  getSampleRate(): number {
    return this.context?.sampleRate ?? VISUAL_CONSTANTS.defaultSampleRate
  }

  getFftSize(): number {
    return this.analyser?.fftSize ?? VISUAL_CONSTANTS.fftSize
  }

  isPlaying(): boolean {
    return this.snapshot.status === 'playing'
  }

  async dispose(): Promise<void> {
    this.loadGeneration += 1
    this.stopSource()
    this.buffer = null
    this.offset = 0
    this.analyser?.disconnect()

    const context = this.context
    this.context = null
    this.analyser = null
    this.updateSnapshot(INITIAL_SNAPSHOT)

    if (context && context.state !== 'closed') {
      await context.close()
    }
  }

  private ensureAudioGraph(): { context: AudioContext; analyser: AnalyserNode } {
    if (this.context && this.analyser && this.context.state !== 'closed') {
      return { context: this.context, analyser: this.analyser }
    }

    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = VISUAL_CONSTANTS.fftSize
    analyser.smoothingTimeConstant = 0.55
    analyser.connect(context.destination)
    this.context = context
    this.analyser = analyser

    return { context, analyser }
  }

  private getCurrentTime(): number {
    if (!this.buffer || !this.context || this.snapshot.status !== 'playing') {
      return this.offset
    }

    return Math.min(
      this.buffer.duration,
      this.offset + Math.max(0, this.context.currentTime - this.startedAt),
    )
  }

  private stopSource(): void {
    this.playbackGeneration += 1
    const source = this.source
    this.source = null

    if (!source) {
      return
    }

    source.onended = null
    try {
      source.stop()
    } catch {
      // A source that already ended can be disconnected safely.
    }
    source.disconnect()
  }

  private updateSnapshot(snapshot: AudioSnapshot): void {
    this.snapshot = snapshot
    for (const listener of this.listeners) {
      listener()
    }
  }
}
