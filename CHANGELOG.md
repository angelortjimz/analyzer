# Changelog

All notable changes to Typographic Spectrum are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial client-only Typographic Spectrum application built with React, TypeScript, Vite, Web Audio API, and Canvas 2D.
- Local audio selection, drag-and-drop upload, decoding, playback, pause/resume, completion/restart, replacement, and readable decode/playback errors.
- Seeking, elapsed time, track duration, and volume controls.
- Typographic spectral crest with logarithmic frequency mapping, vertical amplitude envelopes, and deterministic seeded character shuffling.
- Character-pool, font, color, background, density, font-size, gain, attack, decay, and chaos customization.
- Bundled IBM Plex Mono, Space Mono, and IBM Plex Serif fonts, plus System Mono fallback and catalog preloading.
- Single-font, multi-font, monochrome, and multi-color compositions with By column and Random assignments.
- Deterministic Generate and Reset actions for the complete visual configuration.
- Confined, borderless canvas workspace with a fixed composition column, full-width transport row, and responsive mobile fallback.
- High-DPI rendering with device-pixel-ratio and glyph-column caps.
- Unit-test coverage for spectrum processing, envelopes, crest layout, deterministic shuffling, font/color assignments, configuration sanitization, generation, and playback-time formatting.

### Changed

- Player volume is applied after the analyser so listening level does not affect the visual response.
- Replaced the full-viewport overlay layout with a fixed workspace that keeps all interface elements outside the artwork.
- Playback time updates use a low-frequency timer instead of React state updates on every animation frame.

### Removed

- Removed preset and persistent visual-profile infrastructure in favor of session-local Generate and Reset actions.

### Fixed

- Corrected end-of-track offsets and seeking behavior when replaying or seeking near completion.
- Ignored stale decode and playback callbacks when tracks or playback generations change.
- Corrected displayed durations that decode slightly below a whole second.
