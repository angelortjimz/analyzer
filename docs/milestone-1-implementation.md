# Milestone 1 Implementation Plan

## Visual Proof of Concept

> Build the smallest complete version that proves audio-reactive typography can feel musical, intentional, and polished.

**Source:** `docs/roadmap.md`, Milestone 1  
**Current project state:** Empty application root; only `docs/roadmap.md` exists.  
**Target project documents after leaving Plan mode:** this implementation plan and a root `AGENTS.md`.

---

## 1. Scope and Success Criteria

### Included

- pnpm + Vite + React + strict TypeScript application
- Local audio-file selection and decoding
- Play, pause, resume, restart after completion, and playback error handling
- Real-time frequency analysis through Web Audio API
- One responsive, full-viewport Canvas 2D typographic scene
- Stable glyph identities and frame-rate-independent audio envelopes
- Controls for glyphs, density, font size, gain, attack, decay, and motion
- Minimal white interface and useful loading/error states
- Focused unit tests for pure signal-processing and deterministic-grid utilities

### Excluded until later milestones

- Seeking, volume UI, drag-and-drop, preset persistence, and clean mode
- Multiple fonts, multiple colors, or additional visualization modes
- MP4/WebM export and media-capture infrastructure
- Backend services, remote audio, microphone input, WebGL, or workers
- Glyph atlases or other optimizations without measured need

### Milestone is complete when

1. The application builds and runs using pnpm commands only.
2. A user can load a browser-supported audio file and control playback.
3. The default composition is attractive without adjusting controls.
4. Glyphs respond to musical energy with smooth, deterministic motion—not random flicker.
5. The canvas shows no axes, bars, borders, visible grid, glow, or decorative background.
6. Resizing, pausing, replacing a track, and reaching track end do not break rendering.
7. Pure processing utilities pass their unit tests, and production build/typecheck/lint pass.

---

## 2. Technical Design

### Runtime ownership

- **React owns:** track metadata, playback status, errors, and user-editable visual configuration.
- **AudioEngine owns:** `AudioContext`, buffer, current one-shot source, analyser, playback offset, and audio cleanup.
- **TypographicCanvas owns:** canvas/ref lifecycle, `ResizeObserver`, renderer instance, and `requestAnimationFrame` loop.
- **Renderer owns:** grid cells, visual envelopes, deterministic drawing, and canvas sizing.
- **Pure utilities own:** logarithmic bands, normalization, envelope math, glyph parsing, and seeded hashing.

React must not receive frequency frames or glyph positions. Updating React at 60 fps would create avoidable renders and make the visual engine harder to tune.

### Proposed source layout

```text
src/
├── audio/
│   ├── AudioEngine.ts
│   └── useAudioEngine.ts
├── components/
│   ├── AudioUpload.tsx
│   ├── PlaybackControls.tsx
│   ├── TypographicCanvas.tsx
│   └── VisualControls.tsx
├── visual/
│   ├── config.ts
│   ├── envelope.ts
│   ├── grid.ts
│   ├── spectrum.ts
│   └── TypographicRenderer.ts
├── App.tsx
├── main.tsx
└── styles.css
```

Tests should sit beside pure utilities as `*.test.ts`. Add Vitest; do not add browser-test infrastructure in this milestone.

### Core configuration

Use one exported `VisualConfig` interface and a `DEFAULT_VISUAL_CONFIG` object. Suggested fields:

| Field | Purpose | Initial behavior |
| --- | --- | --- |
| `glyphs` | Ordered low-to-high-energy characters | Letters/symbols with increasing visual density |
| `fontSize` | Base glyph size in CSS pixels | Readable at desktop sizes |
| `density` | Grid spacing and glyph count | Moderate, sparse composition |
| `gain` | Input energy multiplier | Tuned to make ordinary tracks responsive |
| `attack` | Rise response in seconds | Fast enough for transients |
| `decay` | Fall response in seconds | Slow enough for fluid motion |
| `motion` | Position/scale displacement strength | Restrained by default |
| `seed` | Stable composition identity | Fixed default; not exposed yet |

Keep non-UI constants—frequency range, band count, FFT size, DPR cap—in a separate constants object rather than scattering magic numbers.

Initial implementation values to tune visually:

- `fftSize`: 2048
- Frequency range: approximately 40 Hz to 16 kHz, clamped to Nyquist
- Band count: 48–64
- DPR cap: 2
- Maximum animation delta: 100 ms after tab suspension

These are starting points, not controls to expose in Milestone 1.

---

## 3. Ordered Implementation Steps

### Step 1 — Scaffold and establish checks

1. Scaffold Vite's React/TypeScript template into the existing root using pnpm, preserving `docs/roadmap.md`.
2. If the scaffolder refuses a non-empty directory, scaffold into a temporary location and copy only application scaffold files; do not overwrite `docs/`.
3. Add the standard Vite React ESLint setup, including hooks rules, and a minimal Prettier configuration.
4. Add Vitest for pure TypeScript utility tests.
5. Define scripts for development, production build, lint, and unit tests. Run all through pnpm.
6. Replace template styling and content with a minimal application shell.

**Verification:** The empty white application renders, and pnpm build/lint/test commands execute successfully.

### Step 2 — Build a static typographic canvas first

Implement the visual composition before connecting audio so the default layout can be judged independently.

1. Create `TypographicCanvas.tsx` with a canvas that fills its container.
2. Observe container dimensions with `ResizeObserver`.
3. Size the backing canvas to CSS dimensions × capped DPR, then draw in CSS-pixel coordinates using the canvas transform.
4. Implement `grid.ts`:
   - Calculate columns/rows from viewport, font size, and density.
   - Center the invisible grid within the canvas.
   - Assign each cell stable values from a hash of global seed + row + column.
   - Include band offset, activation threshold, phase, rest visibility, and drift direction.
   - Reuse the same seed during resize so unchanged cell coordinates retain their identity.
5. Parse glyph strings with `Array.from` so Unicode code points are not split incorrectly. Fall back to defaults for an empty/whitespace-only ramp.
6. Draw only the sparse resting composition initially: near-black monospace glyphs at low opacity on a pure white background.
7. Cancel animation and disconnect observers during effect cleanup. Ensure React Strict Mode does not duplicate loops.

**Verification:** The static scene is sparse and balanced; resizing remains sharp and does not regenerate unrelated cell traits.

### Step 3 — Implement the audio engine and React adapter

Create `AudioEngine.ts` as a small framework-independent class.

1. Lazily create one `AudioContext` and one `AnalyserNode` from a user action.
2. Decode `File.arrayBuffer()` with `decodeAudioData`.
3. Store the decoded `AudioBuffer`; no object URL or server upload is needed.
4. For each play/resume, create a new `AudioBufferSourceNode`, because source nodes are one-shot.
5. Connect the active source through the analyser to the context destination.
6. Track playback offset using context time and the buffer duration.
7. On pause, calculate the offset, stop/disconnect the current source, and retain the decoded buffer.
8. On natural completion, clear the active source and make the next play restart from the beginning.
9. Ignore stale `onended` callbacks when pause or track replacement intentionally stopped an older source.
10. On track replacement, stop old playback before decoding the new file. Use a load generation/token so a slower previous decode cannot replace a newer selection.
11. Resume a suspended context from play/load user gestures as required by the browser.
12. Expose frequency-byte retrieval, sample rate, FFT size, playback state, duration, and cleanup. Disconnect nodes and close the context on final disposal.

Add `useAudioEngine.ts` to adapt engine callbacks into low-frequency React state: idle, loading, ready, playing, paused, ended, and error. Do not expose AudioNodes through component state.

**Verification:** Upload, play, pause, resume, completion/restart, and replacement work without duplicate sound or stale completion events. Invalid files produce a readable error.

### Step 4 — Add spectrum processing

Implement pure utilities in `spectrum.ts` and `envelope.ts`.

1. Build logarithmically spaced frequency bands between the configured minimum and maximum frequencies.
2. Translate band edges into analyser-bin indices using sample rate and FFT size.
3. For very narrow low-frequency bands, use the nearest valid bin rather than producing an empty range or NaN.
4. Average magnitudes within each band and normalize bytes to the 0–1 range.
5. Apply a restrained noise floor, configurable gain, and clamping. Keep the response curve simple and tunable.
6. Maintain one envelope value per band.
7. Use separate attack and decay coefficients calculated from elapsed time, so behavior remains similar across frame rates.
8. Clamp frame delta after tab restoration. Feed zero input while not actively playing so paused scenes settle into silence.
9. Recalculate band mappings only when audio format/analyser parameters change, not every frame.

**Verification:** Tests cover ascending valid bands, zero input, clamping, short/empty input, envelope rise/fall, and finite outputs at unusual frame deltas.

### Step 5 — Connect energy to the typographic scene

Extend `TypographicRenderer.ts` with one deterministic visual mapping.

1. Map each grid column to a logarithmic frequency band, with only a small stable per-cell offset if needed for organic variation.
2. Combine band energy with the cell's fixed activation threshold to determine visibility.
3. Map smoothed energy to the ordered glyph ramp; never call `Math.random()` during rendering.
4. Map energy to opacity and a small scale change.
5. Add restrained displacement using stable cell phase/direction and elapsed time. Avoid large free-floating particle movement in this first mode.
6. Use `clearRect` and redraw the white background each frame; create persistence through envelopes, not dirty-canvas trails.
7. Skip fully invisible cells to reduce text draws.
8. Update configuration without remounting the canvas. Regenerate the grid only when dimensions or layout-affecting settings change.
9. Run one `requestAnimationFrame` loop regardless of React renders. Read current config and audio state from refs/engine methods.

The visual target is a field of letters whose intensity and movement propagate through the composition. Avoid mappings that fill columns from bottom to top or otherwise recreate bar charts.

**Verification:** Different frequency ranges visibly affect different areas; attacks are responsive, decays are smooth, and identical seeds remain compositionally stable.

### Step 6 — Add minimal controls and styling

1. `AudioUpload`: native file input with an accessible label, `accept="audio/*"`, selected filename, and loading state.
2. `PlaybackControls`: one play/pause/restart button with disabled states appropriate to loading/idle/error.
3. `VisualControls`: controlled inputs for glyph ramp, density, font size, gain, attack, decay, and motion.
4. Use labels and numeric range values where helpful; do not expose technical FFT/bin controls.
5. Keep controls outside the canvas drawing layer. Use a simple white interface with subtle text, generous spacing, no cards, and no decorative borders.
6. Establish global CSS variables for white, near-black, muted text, font stacks, and spacing.
7. Remove default page margins and prevent accidental scrollbars from the full-screen canvas.
8. Show concise errors near the upload/transport controls; do not use alerts.

**Verification:** Every control updates the scene without resetting playback, and keyboard users can reach all inputs.

### Step 7 — Tune, test, and close the milestone

1. Tune the default preset with several user-supplied tracks: quiet, loud, sparse, bass-heavy, and rhythmically dense.
2. Check that silence produces a calm resting composition rather than retained loud-frame data.
3. Test repeated track loads, rapid play/pause, window resizing, high-DPI displays, and tab hide/restore.
4. Inspect the console for AudioContext, disconnected-node, canvas, and React Strict Mode warnings.
5. Run unit tests, typecheck/build, and lint using pnpm.
6. Manually compare against all Milestone 1 exit criteria in `docs/roadmap.md`.
7. Update only the relevant roadmap checkboxes after verification; leave later-milestone items untouched.

---

## 4. Suggested Engine Boundaries

Keep public interfaces small; exact names may be adjusted during implementation without changing ownership.

```ts
type PlaybackStatus =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "ended"
  | "error";

interface AudioSnapshot {
  status: PlaybackStatus;
  trackName: string | null;
  duration: number;
  error: string | null;
}

interface AudioEngine {
  load(file: File): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  togglePlayback(): Promise<void>;
  readFrequencyData(target: Uint8Array): void;
  getFrequencyBinCount(): number;
  getSampleRate(): number;
  getFftSize(): number;
  isPlaying(): boolean;
  subscribe(listener: () => void): () => void;
  dispose(): Promise<void>;
}
```

The renderer should receive primitive data and configuration rather than import React or manipulate application state. Pure math utilities should not depend on canvas or Web Audio objects, which keeps them straightforward to test.

---

## 5. Risks and Deliberate Responses

| Risk | Response |
| --- | --- |
| Visual resembles a conventional spectrum | Use scattered stable thresholds and typographic displacement; explicitly test against bar-like mappings. |
| Random flicker | Seed cell traits, reuse them, and derive frame changes only from smoothed energy/time. |
| React causes frame drops | Keep the animation loop and audio frames outside React state. |
| Source-node lifecycle bugs | Create a new source per playback and invalidate stale callbacks on stop/load. |
| Resize changes composition unexpectedly | Preserve the global seed and hash cell coordinates; separate layout recalculation from identity generation. |
| High-DPI rendering is expensive or blurry | Cap DPR at 2, scale the canvas transform correctly, and skip invisible glyphs. |
| FFT mapping is technically precise but visually weak | Use 48–64 logarithmic bands and tune gain/envelopes for expression rather than measurement accuracy. |
| Scope grows into Milestones 2–4 | Defer multi-font/color, presets, clean mode, advanced player features, and export. |

---

## 6. Final Verification Checklist

- [ ] `pnpm dev` starts the application.
- [ ] `pnpm build` completes with strict TypeScript checks.
- [ ] `pnpm lint` passes.
- [ ] `pnpm test` passes.
- [ ] No npm commands or npm lockfiles were introduced.
- [ ] No backend or remote audio transfer exists.
- [ ] The canvas remains white, borderless, and typographic.
- [ ] Default output needs no manual tuning.
- [ ] No per-frame React updates or per-frame random identity generation exist.
- [ ] Upload/decode failures are understandable.
- [ ] Pause, resume, track end, restart, and replacement behave correctly.
- [ ] Resizing and high-DPI rendering remain sharp and stable.

---
---

# Draft: Root `AGENTS.md`

> The following content is intended for `AGENTS.md` at the project root. It is included here because Plan mode does not permit creating that project file.

## Project Purpose

This is a client-only, audio-reactive typographic canvas. The artwork consists of letters and symbols on a plain background, not conventional spectrum bars or lines. Prioritize one polished visual mode and a strong default composition over feature count.

Read `docs/roadmap.md` before changing scope. Implement only the current milestone unless the user requests otherwise.

## Non-Negotiable Rules

- Use **pnpm only**. Never run npm or create `package-lock.json`.
- Use React, TypeScript, Vite, Web Audio API, and Canvas 2D for the current architecture.
- Keep TypeScript strict. Avoid `any`; use focused types for configuration and engine state.
- Do not add a backend, accounts, remote audio upload, or analytics.
- Do not add WebGL, a state-management library, workers, FFmpeg, or export code without an approved requirement.
- Do not replace the typographic artwork with bars, axes, lines, a visible grid, glow, or decorative panels.
- Preserve `docs/roadmap.md` and update checkboxes only after their behavior is implemented and verified.
- Keep changes minimal and do not introduce additional visualization modes during Milestone 1.

## Design Patterns

### Separation of ownership

- React components manage controls, configuration, upload state, and accessible UI.
- `AudioEngine` encapsulates AudioContext, AudioNodes, playback offsets, and cleanup.
- `TypographicRenderer` owns canvas drawing and mutable frame data.
- Pure functions handle spectrum mapping, envelopes, glyph parsing, and seeded cell generation.
- Keep browser engines independent of React so they can be tested and tuned separately.

### Animation and state

- Use exactly one cleaned-up `requestAnimationFrame` loop for the canvas.
- Never store frequency arrays, glyph cells, or per-frame positions in React state.
- Use refs or engine instances for mutable real-time values.
- Clamp large frame deltas after tab suspension.
- Cancel animation frames, disconnect observers/nodes, and invalidate stale audio callbacks during cleanup.
- Ensure development Strict Mode does not create duplicate loops or playback.

### Deterministic visuals

- Never use `Math.random()` inside the frame loop.
- Derive stable cell traits from a seed and cell coordinates.
- Use attack/decay envelopes for smooth temporal changes.
- Preserve cell identity during resize and unrelated configuration changes.
- Parse user glyph strings safely and provide defaults for invalid or empty input.

### Audio lifecycle

- Create a new `AudioBufferSourceNode` for each play/resume; source nodes are one-shot.
- Resume AudioContext from a user gesture when required.
- Stop and disconnect old sources on pause, replacement, and disposal.
- Ignore stale decode and `onended` results after a newer action.
- Keep all audio local and surface decoding failures as readable UI errors.

### Canvas and styling

- Render glyphs with Canvas 2D, not one DOM element per glyph.
- Separate CSS-pixel layout from backing-store resolution and handle device pixel ratio correctly.
- Use a `ResizeObserver` and preserve composition seeds on resize.
- Use plain CSS/CSS Modules and shared custom properties.
- Default to a pure white background, near-black monospace glyphs, generous empty space, and restrained motion.
- Keep controls labeled, keyboard accessible, and visually subordinate to the artwork.

## Dependencies and Performance

- Prefer browser APIs and small pure modules over dependencies.
- Do not add a dependency for simple math, seeded hashing, class names, or state subscription.
- Measure before introducing glyph atlases, workers, or other optimization layers.
- Avoid per-frame object churn where practical, but do not complicate the first renderer prematurely.
- Cap excessive DPR/grid density if needed to keep the default scene responsive.

## Validation

Use pnpm scripts for development, build/typecheck, lint, and tests. Add focused Vitest coverage when changing pure spectrum, envelope, glyph, or deterministic-grid logic. After audio/canvas changes, manually verify upload, play, pause/resume, track end/restart, replacement, resize, tab restore, and error handling.

Do not mark roadmap work complete based only on compilation: the visual output must also satisfy the milestone's aesthetic and playback criteria.
