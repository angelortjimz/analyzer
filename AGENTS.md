# Project Purpose

This is a client-only, audio-reactive typographic spectrum. The artwork consists of letters and symbols on a plain background: x represents frequency, y represents amplitude, and characters form a spectral crest rather than conventional bars or lines. Prioritize one polished visual mode and a strong default composition over feature count.

Read `docs/roadmap.md` before changing scope. Implement only the current milestone unless the user requests otherwise.

## Non-Negotiable Rules

- Use **pnpm only**. Never run npm or create `package-lock.json`.
- Use React, TypeScript, Vite, Web Audio API, and Canvas 2D for the current architecture.
- Keep TypeScript strict. Avoid `any`; use focused types for configuration and engine state.
- Do not add a backend, accounts, remote audio upload, or analytics.
- Do not add WebGL, a state-management library, workers, FFmpeg, or export code without an approved requirement.
- Do not replace the typographic crest with filled bars, axes, lines, a visible grid, glow, or decorative panels.
- Amplitude controls only vertical crest position. Do not encode it through glyph choice, opacity, scale, or horizontal displacement.
- Character selection is independent of amplitude. Chaos controls deterministic shuffle speed only.
- Font and color assignments support only **By column** and **Random**. Random styling changes on the same shuffle slot as the character.
- Fonts and colors must never represent amplitude or frequency regions.
- Silence resolves to the selected canvas background, which is white by default.
- Generate randomizes the complete visual configuration within bounded, readable ranges without affecting audio or playback.
- Do not add presets, persistent visual profiles, or `localStorage` configuration storage without a new approved requirement.
- Keep all controls permanently visible. Do not use collapsible groups or disclosure widgets for the composition panel.
- Preserve `docs/roadmap.md` and update checkboxes only after their behavior is implemented and verified.
- Keep changes minimal and do not introduce additional visualization modes without an approved requirement.

## Design Patterns

### Separation of ownership

- React components manage controls, configuration, upload state, and accessible UI.
- `AudioEngine` encapsulates AudioContext, AudioNodes, playback offsets, and cleanup.
- `TypographicRenderer` owns canvas drawing and mutable frame data.
- Pure functions handle spectrum mapping, envelopes, glyph parsing, crest layout, and seeded shuffling.
- Keep browser engines independent of React so they can be tested and tuned separately.

### Animation and state

- Use exactly one cleaned-up `requestAnimationFrame` loop for the canvas.
- Never store frequency arrays, crest columns, or per-frame positions in React state.
- Use refs or engine instances for mutable real-time values.
- Clamp large frame deltas after tab suspension.
- Cancel animation frames, disconnect observers/nodes, and invalidate stale audio callbacks during cleanup.
- Ensure development Strict Mode does not create duplicate loops or playback.

### Deterministic visuals

- Never use `Math.random()` inside the frame loop.
- Derive stable column traits from the composition seed and column identity.
- Derive shuffled glyphs from seed, column identity, and a time slot controlled by chaos.
- Zero chaos keeps glyphs fixed; increasing chaos shortens the shuffle interval without affecting amplitude.
- Random font and color assignments use the same column shuffle slot with distinct hash salts.
- By-column font and color assignments remain stable while characters shuffle.
- Use attack/decay envelopes for smooth vertical crest changes.
- Preserve column identity during resize and unrelated configuration changes.
- Parse character pools safely, remove whitespace, and provide defaults for empty input. Duplicate characters intentionally weight selection.

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
- Default to a pure white background, near-black monospace glyphs, generous empty space, and restrained vertical motion.
- Keep controls labeled, keyboard accessible, permanently visible, and visually subordinate to the artwork. Place Generate and Reset below all controls.

## Dependencies and Performance

- Prefer browser APIs and small pure modules over dependencies.
- Do not add a dependency for simple math, seeded hashing, class names, or state subscription.
- Bundled fonts must use local, export-safe assets with appropriate licenses. Preload the catalog and fall back to System Mono.
- Configuration is session-local. Do not add preset or persistence infrastructure without a new approved requirement.
- Measure before introducing glyph atlases, workers, or other optimization layers.
- Avoid per-frame object churn where practical, but do not complicate the first renderer prematurely.
- Cap excessive DPR/column density if needed to keep the default scene responsive.

## Documentation

- Update `CHANGELOG.md` for every notable user-visible, behavioral, performance, or architectural change. Add entries under `## [Unreleased]` using Keep a Changelog categories before considering the work complete.
- Do not rewrite released changelog entries. When cutting a release, move `Unreleased` entries under a dated version heading.

## Validation

Use pnpm scripts for development, build/typecheck, lint, and tests. Add focused Vitest coverage when changing pure spectrum, envelope, glyph, crest-layout, deterministic-shuffle, style-assignment, or generation logic. After audio/canvas changes, manually verify upload, play, pause/resume, track end/restart, replacement, resize, tab restore, font loading, assignments, generation, reset, and error handling.

Do not mark roadmap work complete based only on compilation: the visual output must also satisfy the milestone's aesthetic and playback criteria.
