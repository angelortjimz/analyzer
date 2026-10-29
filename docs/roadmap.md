# Web Audio Spectrum Analyzer

## Implementation Roadmap

> **Product vision:** A borderless, audio-reactive typographic canvas where letters and symbols—not conventional analyzer graphics—respond to music.

---

## 1. Product Direction

The application is a client-only web experience built around one highly polished visual mode: **Typographic Spectrum**.

A white, full-viewport canvas contains a typographic spectral crest. The x axis represents frequency and the y axis represents amplitude, with one character drawn at each frequency column’s crest. Character selection is independent of amplitude and shuffles at a configurable speed, prioritizing an expressive display without sacrificing the recognizable spectrum shape.

### Design principles

- **Typography first:** Letters and symbols are the artwork.
- **Restrained presentation:** White background, no visible grid, axes, bars, borders, glow, or decorative chrome.
- **Intentional motion:** Use smooth vertical envelopes and deterministic character shuffling instead of uncontrolled frame-by-frame randomness.
- **Immediate visual quality:** The default composition must look good without configuration.
- **One excellent mode:** Perfect a single composition before adding alternatives.
- **Local by default:** Audio stays in the browser; no backend or account system.

### Default experience

1. The user opens a minimal white page with an upload prompt.
2. After selecting an audio file, the canvas remains white until playback produces audible energy.
3. During playback, a crest of randomly shuffling letters and symbols follows frequency on the x axis and amplitude on the y axis.
4. Controls remain visible for continuous tuning, and a clean mode can hide everything except the artwork.
5. Silence returns the canvas to empty white after the decay envelopes settle.

---

## 2. Confirmed Scope and Technical Choices

| Area | Decision |
| --- | --- |
| Audio input | Local file upload with drag-and-drop support |
| Audio processing | Web Audio API and `AnalyserNode` |
| Framework | React with TypeScript |
| Build tooling | Vite |
| Package manager | **pnpm only; never npm** |
| Rendering | HTML Canvas 2D, not per-glyph DOM elements |
| Animation | `requestAnimationFrame` outside React's render cycle |
| Styling | Plain CSS or CSS Modules with custom properties |
| State | React state for configuration; refs/engine objects for real-time data |
| Persistence | None; visual configuration remains session-local |
| Backend | None |
| Initial browser target | Simple Chromium-first desktop experience |
| Initial visual modes | One polished Typographic Spectrum mode |
| Video export | Full-track MP4 with the original audio included |

### Core modules

1. **Audio engine** — File decoding, playback, pause, seeking, volume, and analyser data.
2. **Spectrum processor** — Logarithmic bands, gain, smoothing, attack/decay, and normalized energy.
3. **Typographic renderer** — Crest-column layout, deterministic character shuffling, amplitude-to-y mapping, and drawing.
4. **Exporter** — Canvas video capture synchronized with the original track.
5. **React interface** — Upload, transport controls, persistent customization controls, and clean mode.

```text
Audio file
    → Web Audio playback
    → AnalyserNode
    → Frequency and envelope processing
    → Typographic renderer
    → Canvas
    → Optional MP4 export
```

---

## 3. Milestone Overview

| Milestone | Outcome | Priority |
| --- | --- | --- |
| 1. Visual proof of concept | Audio-driven typography validates the aesthetic | Highest |
| 2. Typography customization | Pool characters, fonts, multi-font scenes, colors, and generation | High |
| 3. Player and presentation polish | Complete player, clean mode, responsiveness, and performance | High |
| 4. Full-track MP4 export | Shareable video containing the original audio | Medium |
| 5. Release hardening | Browser validation, tests, accessibility, and documentation | Medium |

---

## 4. Detailed Roadmap

### Milestone 1 — Visual Proof of Concept

**Goal:** Prove that reactive typography can look musical, expressive, and polished without conventional spectrum graphics.

#### Application foundation

- [ ] Initialize the project with pnpm, Vite, React, and TypeScript.
- [ ] Enable strict TypeScript configuration and establish basic linting/formatting.
- [ ] Create a full-viewport, borderless white canvas.
- [ ] Separate audio processing, visual processing, rendering, and React UI responsibilities.
- [ ] Define typed visual configuration with sensible defaults.

#### Audio foundation

- [ ] Add local audio-file selection.
- [ ] Decode audio through Web Audio API.
- [ ] Implement play, pause, and end-of-track handling.
- [ ] Resume `AudioContext` from a valid user gesture where required.
- [ ] Extract real-time frequency data through `AnalyserNode`.
- [ ] Display useful errors for unsupported or unreadable files.

#### Typographic renderer

- [ ] Generate a responsive horizontal crest-column layout.
- [ ] Map frequency data into a reduced set of perceptual bands.
- [ ] Add configurable gain, smoothing, attack, and decay.
- [ ] Map frequency to the x axis and amplitude exclusively to crest height on the y axis.
- [ ] Select characters independently of amplitude using deterministic, speed-controlled shuffling.
- [ ] Keep column identities and random seeds stable between frames.
- [ ] Return to an empty white canvas after silent decay.
- [ ] Render at device pixel ratio without changing the composition's layout unexpectedly.

#### Initial controls

- [ ] Unordered character pool.
- [ ] Horizontal density and base font size.
- [ ] Audio gain/reactivity.
- [ ] Attack, decay, and character-shuffle chaos.

**Exit criteria**

- The default scene looks intentional before any manual tuning.
- Crest height follows musical events smoothly while character shuffling remains controlled by chaos.
- The output is a recognizably typographic spectral crest, with no filled bars, axes, or visible grid.
- Playback and rendering remain smooth at the default density.

---

### Milestone 2 — Typography Customization

**Goal:** Make typography and color the primary creative controls without making the interface overwhelming.

#### Character customization

- [ ] Support custom character pools, including weighted duplicates.
- [ ] Keep character selection independent of amplitude through the existing Chaos control.
- [ ] Provide letters, symbols, and mixed pools for generated compositions.

#### Font customization

- [ ] Provide a small collection of bundled, export-safe font choices.
- [ ] Support a single-font composition.
- [ ] Support multiple enabled fonts in one composition.
- [ ] Assign fonts stably per column or reshuffle them whenever the column's character changes.
- [ ] Wait for the font catalog to load before rendering or exporting.
- [ ] Ensure changing fonts does not cause uncontrolled layout jumps.

#### Color customization

- [ ] Default to near-black glyphs on a plain white background.
- [ ] Support custom foreground and background colors.
- [ ] Support multi-color palettes.
- [ ] Assign colors stably per column or reshuffle them whenever the column's character changes.
- [ ] Retain a simple monochrome mode.

#### Generation and interface

- [ ] Keep every control permanently visible without collapsible groups.
- [ ] Add Reset-to-default and Generate actions below all other controls.
- [ ] Make Generate randomize the complete visual configuration within valid, readable ranges.
- [ ] Keep configuration session-local, with no presets or persistence.

**Exit criteria**

- Single-font, multi-font, monochrome, and multi-color compositions all work reliably.
- By-column font and color assignments remain fixed while characters shuffle.
- Random font and color assignments change on exactly the character's shuffle slot.
- Zero Chaos freezes characters, fonts, and Random color assignments.
- Silence uses the selected background, which is white by default.
- Every control is visible without expanding a section.
- Generate and Reset appear below all controls.
- The default composition remains the most immediate and polished experience.

---

### Milestone 3 — Player and Presentation Polish

**Goal:** Turn the proof of concept into a complete, focused creative tool.

#### Playback

- [ ] Add drag-and-drop audio upload.
- [ ] Add seeking, elapsed time, duration, and volume controls.
- [ ] Keep transport controls minimal and visually subordinate to the artwork.
- [ ] Handle track changes and playback completion cleanly.

#### Presentation

- [ ] Keep customization in a persistent, borderless panel.
- [ ] Add a clean mode that hides all interface elements.
- [ ] Preserve the composition across ordinary window resizing where practical.
- [ ] Support high-DPI screens and sensible mobile/layout fallbacks.

#### Performance and motion quality

- [ ] Avoid React state updates on every animation frame.
- [ ] Cap excessive glyph counts and device pixel ratios when necessary.
- [ ] Profile font/style changes and text drawing in dense scenes.
- [ ] Introduce glyph caching or atlases only if profiling justifies them.
- [ ] Tune envelopes, gain, and character shuffling against varied music.
- [ ] Verify quiet, loud, sparse, and bass-heavy tracks.

**Exit criteria**

- The interface can disappear completely, leaving only the typographic canvas.
- Playback, seeking, resizing, and changing tracks do not break the renderer.
- Dense scenes degrade gracefully rather than making controls unusable.
- The visual response feels consistent across different kinds of audio.

---

### Milestone 4 — Full-Track MP4 Export

**Goal:** Export the complete visual performance with the original audio, without requiring a backend.

#### Export validation spike

- [ ] Feature-detect MP4 video/audio recording support in the target browser.
- [ ] Validate canvas capture and audio routing in a small prototype.
- [ ] Choose `MediaRecorder` only if it reliably supports the required MP4 codecs.
- [ ] Otherwise evaluate WebCodecs with a lightweight MP4 muxer for Chromium-first export.
- [ ] Do not treat renaming a WebM file as valid MP4 export.

#### Export experience

- [ ] Start export from the beginning of the track.
- [ ] Capture the canvas and route the original audio into the recording stream.
- [ ] Avoid double playback through duplicate audio routing.
- [ ] Offer canvas-size and standard-resolution output options.
- [ ] Show recording progress and the expected real-time duration.
- [ ] Support cancellation and clean up streams, nodes, and object URLs.
- [ ] Keep export controls outside the captured artwork.
- [ ] Communicate that the export tab should remain visible if real-time capture requires it.

**Exit criteria**

- The downloaded file is a valid MP4 in the supported target environment.
- The full original track is present and synchronized with the visuals.
- Export completion and cancellation leave normal playback functional.
- Unsupported configurations produce a clear message rather than a broken file.

---

### Milestone 5 — Release Hardening

**Goal:** Make the focused release dependable and easy to maintain.

- [ ] Unit-test logarithmic band mapping and normalization.
- [ ] Unit-test envelope, attack/decay, and glyph-selection utilities.
- [ ] Test stable seeded font, color, and column assignments.
- [ ] Test configuration sanitization and deterministic full-composition generation.
- [ ] Verify upload errors, audio-context restrictions, and unsupported files.
- [ ] Check keyboard access and visible focus states for controls.
- [ ] Respect reduced-motion preferences where practical without disabling the core artwork unexpectedly.
- [ ] Document pnpm setup, development, testing, and production-build commands.
- [ ] Document browser and export limitations honestly.
- [ ] Run final production-build and browser smoke tests.

**Release criteria**

- A new user can upload a track and immediately get a polished result.
- All primary controls are understandable without technical audio knowledge.
- The clean canvas contains only letters and symbols.
- Generated configurations remain valid, and export works in the documented target environment.
- No backend, account, or external audio processing is required.

---

## 5. Deliberately Out of Scope for the First Release

- Multiple half-polished visualization modes
- Microphone or live-audio input
- Audio URLs and streaming-service integrations
- Accounts, cloud saves, sharing backends, or collaboration
- Presets, preset import/export, or persistent visual profiles
- WebGL, shaders, and 3D scenes
- Offline/deterministic rendering pipelines
- Complex plugin systems
- FFmpeg-based conversion unless export validation proves it necessary

These can be reconsidered after the core typographic experience is excellent.

---

## 6. Recommended Execution Order

> **Aesthetic validation → typography controls → player polish → export → hardening**

Do not begin with MP4 infrastructure or a large component system. The project's differentiator is the quality of its reactive typography; the first milestone should prove that value as quickly as possible.
