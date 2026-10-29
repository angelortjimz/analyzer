# Milestone 2 Implementation Plan

## Typography Customization

> Extend the spectral crest with expressive pool-based characters, fonts, and colors while preserving its unchanged axes: frequency horizontally, amplitude vertically, and character styling independently.

**Source:** `docs/roadmap.md`, Milestone 2  
**Prerequisite:** Milestone 1 crest renderer, deterministic character shuffling, and local audio playback.

---

## 1. Scope

### Included

- Custom character pools with weighted duplicates
- Bundled, export-safe fonts
- Single-font and multi-font compositions
- Font and color assignment by column or random character-shuffle slot
- Configurable canvas background and glyph palette
- Fully visible, non-collapsible controls
- Generate and Reset actions at the bottom of the panel
- Focused tests and updated project guidance

### Excluded

- Presets or saved configurations
- Built-in visual presets
- `localStorage` or any persistence layer
- Source-text character mode
- Frequency-region font or color assignment
- Seeking, drag-and-drop, volume controls, clean mode, or export
- Backend storage, accounts, or configuration sharing
- WebGL, workers, or UI component libraries

### Non-negotiable behavior

- Amplitude controls crest Y only.
- Character, font, and color never encode volume.
- Character selection remains independent of audio amplitude.
- `Chaos = 0` freezes character and Random style assignments.
- Silence becomes the selected background, white by default.
- Font loading or assignment must not move column X positions or crest Y positions.
- Every control remains visible; there are no collapsible control groups.

---

## 2. Configuration Model

`VisualConfig` contains:

```ts
type AssignmentMode = 'column' | 'random'

interface VisualConfig {
  glyphs: string
  fontIds: FontId[]
  fontAssignment: AssignmentMode
  backgroundColor: string
  colors: string[]
  colorAssignment: AssignmentMode
  fontSize: number
  density: number
  gain: number
  attack: number
  decay: number
  chaos: number
  seed: number
}
```

A single entry in `fontIds` or `colors` provides single-font or monochrome mode.

### Character pool

- Always active; no source mode.
- Whitespace is ignored.
- Duplicate characters intentionally weight selection.
- Unicode code points are preserved.
- Empty pools fall back to the default pool.
- Parsing happens outside the animation frame.

### Assignment modes

**By column**

- One seeded font and color per column.
- Styling remains fixed while the character shuffles.
- Seed changes may alter assignments.

**Random**

- Font and color reselect at each column's character-shuffle slot.
- Character, font, and color share the same time slot.
- Different hash salts prevent their random choices from being artificially linked.
- Column phase offsets avoid synchronized global changes.
- Random choices may repeat by chance.
- Zero Chaos freezes all Random assignments.

### Sanitization

All configurations pass through `sanitizeVisualConfig()`:

- Numeric values are clamped to control ranges.
- Font IDs must exist in the catalog.
- Arrays contain at least one entry and are deduplicated.
- Colors must be six-digit hex values.
- Assignment modes must be known values.
- Invalid input falls back to safe defaults.

---

## 3. Shared Shuffle Slot

Pure utilities provide:

```ts
getColumnShuffleSlot(column, timeSeconds, chaos)
getColumnGlyphIndex(column, slot, glyphCount, seed)
getColumnStyleIndex(column, slot, mode, entryCount, seed, salt)
```

Character, font, and color use the same slot calculation. By-column styles ignore the live slot; Random styles consume it.

Different selectors use distinct salts for characters, fonts, and colors.

---

## 4. Font System

### Catalog

Bundled local Fontsource assets:

- System Mono (default fallback)
- IBM Plex Mono
- Space Mono
- IBM Plex Serif

Only Latin 400-weight assets are imported.

### Rendering and loading

- Preload the catalog once during application initialization.
- Continue with System Mono fallbacks if loading fails.
- Select a family per glyph from the active assignment.
- Keep font size and opacity fixed.
- Do not derive positions from glyph metrics.

---

## 5. Rendering

`TypographicRenderer`:

- Parses the character pool.
- Fills the canvas with `backgroundColor`.
- Uses the existing spectrum processor and envelopes.
- Keeps crest mapping and shuffle timing unchanged.
- Resolves per-column font and color from the active modes and shared slot.
- Draws one unchanged-size glyph per active column.
- Preserves fixed opacity.
- Returns to an empty selected background when energies decay to zero.

Font and color changes do not rebuild layout. Layout rebuilds remain limited to font size, density, seed, and canvas dimensions.

---

## 6. Generate and Reset

### Generate

**Generate** replaces the complete visual configuration within valid ranges:

- Character pool
- One to three fonts
- Font assignment
- Coordinated background and glyph palette
- Color assignment
- Font size and density
- Gain, attack, decay, and Chaos
- Composition seed

Constraints:

- Bounded numeric ranges
- Valid catalog font IDs
- Curated readable color schemes
- Curated letters, symbols, and mixed pools
- No changes to audio, playback position, or track state
- Reproducible from the generated seed

A pure `generateVisualConfig(seed)` supplies deterministic generation. The UI creates a fresh random seed when Generate is clicked.

### Reset

Reset restores `DEFAULT_VISUAL_CONFIG` without affecting audio.

Generate and Reset appear together below all controls.

---

## 7. Interface

All groups are permanently expanded:

1. Characters
2. Typography
3. Color
4. Response
5. Generate and Reset

Use native HTML inputs and simple section headings. No collapsible groups, dialogs, or component libraries.

### Controls

**Characters**

- Character pool text input

**Typography**

- Font checkboxes; at least one must remain enabled
- By column or Random assignment
- Font size
- Horizontal density

**Color**

- Background picker
- One-to-four color palette
- Add and remove controls; one color must remain
- By column or Random assignment

**Response**

- Gain
- Attack
- Decay
- Chaos

The panel may scroll vertically on short screens, but controls are never hidden behind disclosure widgets.

---

## 8. Work Completed

1. Expanded and sanitized the visual configuration.
2. Added bundled font catalog and preloading.
3. Extracted seeded-random and shared shuffle-slot utilities.
4. Added font and color assignment functions.
5. Updated renderer for fonts, colors, background, and pool-only characters.
6. Added deterministic full-configuration generation.
7. Replaced collapsible groups with permanently visible sections.
8. Removed presets, storage, source-text mode, and their tests.
9. Updated `AGENTS.md` and the roadmap.

---

## 9. Verification

### Automated

- Character pool parsing, Unicode, weighted duplicates, and fallbacks
- Configuration validation and clamping
- Font and color assignment determinism
- By-column stability across shuffle slots
- Random assignment synchronization with character slots
- Zero-Chaos freeze behavior
- Generate reproducibility, ranges, valid fonts, and valid colors
- Existing spectrum, envelope, crest, and shuffle tests

### Manual

- Upload and play audio after Generate and Reset
- Confirm amplitude remains vertical only
- Confirm fonts and colors never respond to amplitude
- Confirm By-column styles remain fixed while characters shuffle
- Confirm Random styles change with characters and freeze at zero Chaos
- Select every supported font and confirm no positional jumps
- Test one and multiple colors plus custom backgrounds
- Confirm every control is visible without opening a section
- Confirm Generate and Reset are below all controls
- Confirm silence uses the selected background
- Confirm Generate leaves audio playback untouched

### Commands

```text
pnpm format
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

---

## 10. Exit Criteria

- Custom character pools work with weighted duplicates and Unicode.
- Single-font, multi-font, monochrome, and multi-color crests work reliably.
- Fonts and colors use only By column and Random assignment.
- By-column styling remains fixed during shuffles.
- Random styling changes exactly on character-shuffle slots.
- Zero Chaos freezes characters, fonts, and colors.
- Font loading never causes crest layout shifts.
- Generated compositions contain valid values and are reproducible from their seed.
- Every control is visible without collapsible groups.
- Generate and Reset appear below everything else.
- No preset, persistence, or source-text code remains.
- Silence uses the selected background, white by default.
- The default composition remains the most immediate and polished experience.
