# Web Audio Spectrum Analyzer

## Implementation Roadmap

> **Product vision:** A borderless, audio-reactive typographic canvas where letters and symbols—not conventional analyzer graphics—respond to music.

---

## 1. Product Direction

The application is a client-only web experience built around one highly polished visual mode: **Typographic Spectrum**.

A white, full-viewport canvas contains an invisible grid of glyphs. Audio energy influences character selection, opacity, scale, position, and motion. Frequency mapping remains perceptual rather than technically exhaustive, prioritizing an expressive and musical result.

### Design principles

- **Typography first:** Letters and symbols are the artwork.
- **Restrained presentation:** White background, no visible grid, axes, bars, borders, glow, or decorative chrome.
- **Intentional motion:** Use smooth envelopes and stable glyph assignments instead of random frame-by-frame flickering.
- **Immediate visual quality:** The default preset must look good without configuration.
- **One excellent mode:** Perfect a single composition before adding alternatives.
- **Local by default:** Audio stays in the browser; no backend or account system.

### Default experience

1. The user opens a minimal white page with an upload prompt.
2. After selecting an audio file, a sparse arrangement of dark monospace glyphs appears.
3. During playback, glyphs darken, change, shift, and propagate in response to the music.
4. Controls recede when not in use, and a clean mode hides everything except the artwork.
5. Silence leaves a subtle resting composition rather than uncontrolled movement.

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
| Persistence | Visual presets stored in `localStorage` |
| Backend | None |
| Initial browser target | Simple Chromium-first desktop experience |
| Initial visual modes | One polished Typographic Spectrum mode |
| Video export | Full-track MP4 with the original audio included |

### Core modules

1. **Audio engine** — File decoding, playback, pause, seeking, volume, and analyser data.
2. **Spectrum processor** — Logarithmic bands, gain, smoothing, attack/decay, and normalized energy.
3. **Typographic renderer** — Grid creation, glyph selection, stable font/color assignments, motion, and drawing.
4. **Exporter** — Canvas video capture synchronized with the original track.
5. **React interface** — Upload, transport controls, customization, presets, and clean mode.

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
| 2. Typography customization | Fonts, multi-font scenes, colors, glyphs, and presets | High |
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

- [ ] Generate an invisible, responsive glyph grid.
- [ ] Map frequency data into a reduced set of perceptual bands.
- [ ] Add configurable gain, smoothing, attack, and decay.
- [ ] Map energy to glyph selection, opacity, and restrained movement.
- [ ] Keep cell identities and random seeds stable between frames.
- [ ] Provide a sparse, visually calm resting state for silence.
- [ ] Render at device pixel ratio without changing the composition's layout unexpectedly.

#### Initial controls

- [ ] Character set or ordered low-to-high-energy glyph ramp.
- [ ] Grid density and base font size.
- [ ] Audio gain/reactivity.
- [ ] Attack, decay, and motion intensity.

**Exit criteria**

- The default scene looks intentional before any manual tuning.
- Motion follows musical events without appearing like random character flicker.
- The output is recognizably typographic, with no bars, axes, or visible grid.
- Playback and rendering remain smooth at the default density.

---

### Milestone 2 — Typography Customization

**Goal:** Make typography and color the primary creative controls without making the interface overwhelming.

#### Character customization

- [ ] Support custom character sets.
- [ ] Support an ordered glyph ramp based on visual intensity.
- [ ] Optionally derive glyphs from user-provided source text.
- [ ] Add letters-only and symbols-only starting presets.
- [ ] Control the amount of character substitution.

#### Font customization

- [ ] Provide a small collection of bundled, export-safe font choices.
- [ ] Support a single-font composition.
- [ ] Support multiple enabled fonts in one composition.
- [ ] Assign fonts stably per cell, by frequency region, or by a regenerated composition seed.
- [ ] Wait for font loading before rendering or exporting.
- [ ] Ensure changing fonts does not cause uncontrolled layout jumps.

#### Color customization

- [ ] Default to near-black glyphs on a plain white background.
- [ ] Support custom foreground and background colors.
- [ ] Support multi-color palettes.
- [ ] Assign colors by frequency region or stable glyph/cell identity.
- [ ] Retain a simple monochrome mode.

#### Presets and interface

- [ ] Add curated presets that demonstrate distinct but restrained looks.
- [ ] Save and load user presets through `localStorage`.
- [ ] Add reset-to-default and regenerate-composition actions.
- [ ] Group controls progressively so common options remain easy to find.

**Exit criteria**

- Single-font, multi-font, monochrome, and multi-color compositions all work reliably.
- Font and color assignments do not change randomly on every animation frame.
- A saved preset reproduces the same visual configuration after reloading.
- The default preset remains the most immediate and polished experience.

---

### Milestone 3 — Player and Presentation Polish

**Goal:** Turn the proof of concept into a complete, focused creative tool.

#### Playback

- [ ] Add drag-and-drop audio upload.
- [ ] Add seeking, elapsed time, duration, and volume controls.
- [ ] Keep transport controls minimal and visually subordinate to the artwork.
- [ ] Handle track changes and playback completion cleanly.

#### Presentation

- [ ] Place customization in a collapsible, borderless drawer or panel.
- [ ] Add a clean mode that hides all interface elements.
- [ ] Preserve the composition across ordinary window resizing where practical.
- [ ] Support high-DPI screens and sensible mobile/layout fallbacks.

#### Performance and motion quality

- [ ] Avoid React state updates on every animation frame.
- [ ] Cap excessive glyph counts and device pixel ratios when necessary.
- [ ] Profile font/style changes and text drawing in dense scenes.
- [ ] Introduce glyph caching or atlases only if profiling justifies them.
- [ ] Tune envelopes, thresholds, and motion against varied music.
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
- [ ] Test stable seeded font, color, and cell assignments.
- [ ] Test preset serialization, defaults, and invalid stored settings.
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
- Presets survive reloads, and export works in the documented target environment.
- No backend, account, or external audio processing is required.

---

## 5. Deliberately Out of Scope for the First Release

- Multiple half-polished visualization modes
- Microphone or live-audio input
- Audio URLs and streaming-service integrations
- Accounts, cloud saves, sharing backends, or collaboration
- WebGL, shaders, and 3D scenes
- Offline/deterministic rendering pipelines
- Complex plugin systems
- FFmpeg-based conversion unless export validation proves it necessary

These can be reconsidered after the core typographic experience is excellent.

---

## 6. Recommended Execution Order

> **Aesthetic validation → typography controls → player polish → export → hardening**

Do not begin with MP4 infrastructure or a large component system. The project's differentiator is the quality of its reactive typography; the first milestone should prove that value as quickly as possible.
