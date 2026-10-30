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
- Bundled Fraunces, Bodoni Moda, Archivo Narrow, and Caveat, expanding the font catalog to eight families with display serif, didone, condensed grotesque, and handwritten options.
- Single-font, multi-font, monochrome, and multi-color compositions with By column and Random assignments.
- Optional per-character normal, bold, or italic styling that changes on the character shuffle slot and follows Chaos speed.
- Deterministic Generate and Reset actions for the complete visual configuration.
- Confined, borderless canvas workspace with a fixed composition column, full-width transport row, and responsive mobile fallback.
- High-DPI rendering with device-pixel-ratio and glyph-column caps.
- Full-track, real-time MP4 export from the beginning of the track with canvas-size, 720p, and 1080p output options.
- MP4 capability detection with clear unsupported-browser messaging instead of producing an invalid file.
- Export progress, expected real-time duration, tab-visibility guidance, and cancellation with partial-file discard.
- Unit-test coverage for spectrum processing, envelopes, crest layout, deterministic shuffling, font/color assignments, configuration sanitization, generation, playback-time formatting, export sizing, MP4 validation, and MP4 capability selection.

### Changed

- Raised the font-size control's upper bound from 36px to 96px and widened Generate's font-size range while keeping generated compositions readable.
- Raised the enabled-font limit from four to eight so every bundled family can be combined in one composition.
- Random weight and italic styling stays upright for families without an italic face.
- Player volume is applied after the analyser so listening level does not affect either the visual response or the exported audio.
- Replaced the full-viewport overlay layout with a fixed workspace that keeps all interface elements outside the artwork.
- Playback time updates use a low-frequency timer instead of React state updates on every animation frame.
- Export capture reuses the existing canvas frame loop and keeps its controls outside the captured artwork.

### Removed

- Removed preset and persistent visual-profile infrastructure in favor of session-local Generate and Reset actions.

### Fixed

- Hardened MP4 export startup by retaining the export click's user activation, trying all advertised H.264/AAC recorder configurations, removing the optional recording timeslice, and reporting the failing startup stage instead of one generic error.
- Corrected end-of-track offsets and seeking behavior when replaying or seeking near completion.
- Ignored stale decode and playback callbacks when tracks or playback generations change.
- Corrected displayed durations that decode slightly below a whole second.
