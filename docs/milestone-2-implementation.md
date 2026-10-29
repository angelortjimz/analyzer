# Milestone 2 Implementation Plan

## Typography Customization

> Extend the spectral crest with expressive character, font, and color controls while preserving its unchanged axes: frequency horizontally, amplitude vertically, and character styling independently.

**Source:** `docs/roadmap.md`, Milestone 2  
**Prerequisite:** Milestone 1 crest renderer, deterministic character shuffling, and local audio playback.

---

## 1. Scope

### Included

- Character pools and source-text character derivation
- Letters-only and symbols-only curated presets
- Bundled, export-safe font catalog
- Single-font and multi-font compositions
- Font and color assignment by column or random shuffle
- Configurable canvas background and glyph palette
- Versioned user presets in `localStorage`
- Curated built-in presets
- Generate, reset, apply, and save actions
- Focused tests and updated project guidance

### Excluded

- Frequency-region font or color assignment
- Per-frame style transitions that are independent of character shuffling
- Seeking, drag-and-drop, volume controls, clean mode, or export
- Backend storage, accounts, or preset sharing
- WebGL, workers, or UI component libraries

### Non-negotiable behavior

- Amplitude controls crest Y only.
- Character, font, and color never encode volume.
- Character selection remains independent of audio amplitude.
- `Chaos = 0` freezes character and Random style assignments.
- Silence becomes the selected background, white by default.
- Font loading or assignment must not move column X positions or crest Y positions.

---

## 2. Configuration Model

Expand `VisualConfig` with the following fields:

```ts
type CharacterSource = 'pool' | 'text'
type AssignmentMode = 'column' | 'random'

interface VisualConfig {
  characterSource: CharacterSource
  glyphs: string
  sourceText: string
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

A single entry in `fontIds` or `colors` provides single-font or monochrome mode. No separate mode switch is needed.

### Character sources

- **Pool:** direct character list. Duplicate characters may intentionally weight selection.
- **Text:** unique, non-whitespace Unicode code points in first-appearance order.
- Empty or whitespace-only values fall back to the default pool.
- Parsing happens outside the animation frame.

### Assignment modes

- **By column:** seeded assignment remains fixed for the composition and survives character shuffles.
- **Random:** reselect at each column's character-shuffle slot.
  - Character, font, and color share the same time slot.
  - Different hash salts prevent their selections from being artificially linked.
  - Column phase offsets avoid synchronized global changes.
  - Selections may repeat by chance.
  - Zero Chaos freezes all Random assignments.

### Sanitization

All persisted or generated configurations pass through `sanitizeVisualConfig()`:

- Numeric values are clamped to control ranges.
- Font IDs must exist in the catalog.
- Arrays contain at least one entry and are deduplicated.
- Colors must be six-digit hex values.
- Character modes and assignment modes must be known values.
- Invalid top-level data falls back to safe defaults.

---

## 3. Shared Shuffle Slot

Refactor deterministic shuffling into pure utilities:

```ts
getColumnShuffleSlot(column, timeSeconds, chaos)
getColumnGlyphIndex(column, slot, glyphCount, seed)
getColumnStyleIndex(column, slot, mode, entryCount, seed, salt)
```

The character, font, and color selectors use the same slot calculation. By-column styles use a fixed slot; Random styles use the live slot.

Different selectors use distinct salts:

- Character
- Font
- Color

This preserves deterministic behavior and makes Random styles change exactly when the column's character changes.

---

## 4. Font System

### Catalog

Use a small typed catalog of bundled fonts. The initial catalog should include:

- System Mono (default fallback)
- IBM Plex Mono
- Space Mono
- IBM Plex Serif

Font packages come from Fontsource and are installed with pnpm. Only required 400-weight assets are included.

### Rendering

- Select the family from a stable or Random column assignment.
- Use fixed font size and full opacity.
- Set the family per glyph in Canvas 2D.
- Do not derive positions from glyph metrics.
- Fall back to System Mono if a catalog entry is unavailable.

### Loading

Preload the complete catalog once during application initialization:

1. Load bundled font CSS.
2. Await `document.fonts.load()` for catalog families.
3. Continue with System Mono fallbacks if loading fails.
4. Render the application only after the loading attempt settles.

This avoids fallback flashes when changing fonts and prepares for future export without introducing async font work into the frame loop.

---

## 5. Rendering Changes

`TypographicRenderer` will:

- Parse the active character source.
- Clear and fill with `backgroundColor` each frame.
- Continue using the existing spectrum processor and envelope values.
- Keep crest mapping and shuffle logic unchanged.
- Resolve per-column font and color from the active assignment modes and shared slot.
- Draw one unchanged-size glyph per active column.
- Preserve fixed opacity and font size.
- Return to an empty selected background when energies decay to zero.

Font and color changes must not rebuild the crest layout. Layout rebuilds remain limited to font size, density, seed, and canvas dimensions.

---

## 6. Generate Action

**Generate** replaces the previous seed-only regeneration action and randomizes the complete visual configuration within safe ranges:

- Character source and curated character content
- One to three enabled fonts
- Font assignment mode
- Coordinated background and glyph-color scheme
- Color assignment mode
- Font size and density
- Gain, attack, decay, and Chaos
- Composition seed

### Constraints

- Use bounded numeric ranges.
- Use valid catalog font IDs.
- Use curated, readable background/palette combinations.
- Use curated letters, symbols, mixed pools, and short source phrases.
- Never alter audio, playback position, or track state.
- Keep all settings reproducible from the generated seed.

A pure `generateVisualConfig(seed)` function supplies deterministic generation. The UI creates a fresh random seed when Generate is clicked. Saving the result as a preset captures the exact composition.

---

## 7. Presets

### Built-in presets

- **Default:** near-black System Mono on white
- **Letters:** letters-only pool with a clean single font
- **Symbols:** symbols-only pool with a contrasting bundled font
- **Duotone:** two fonts and two colors using By column assignments

Built-in presets are compiled into the application and are not written to storage.

### User presets

- Stored under one namespaced `localStorage` key.
- Persist as a versioned object containing an array of presets.
- Each preset contains a stable ID, name, creation time, and full visual configuration.
- Parse through unknown-safe validation and sanitize every configuration.
- Malformed JSON, unavailable storage, unknown versions, and invalid presets are handled without breaking the application.
- Applying a preset replaces the visual configuration atomically.
- Reset restores defaults without deleting saved presets.
- Preset data contains no audio or playback state.

---

## 8. Interface

Break the current oversized panel into focused controls:

- Shared slider control
- Preset controls
- Character controls
- Font controls
- Color controls
- Response controls

Use native HTML inputs and `<details>` groups. No component library is added.

### Controls

**Presets**

- Apply built-in or saved preset
- Save current configuration with a name
- Generate a complete new composition
- Reset to default
- Concise storage error when persistence fails

**Characters**

- Pool or Text source toggle
- Corresponding text input or textarea
- Existing default pool remains available

**Typography**

- Font checkboxes for the catalog
- At least one font must remain enabled
- By column or Random assignment
- Font size
- Horizontal density

**Color**

- Background color picker
- Palette of one to four colors
- Add and remove color controls; one color must remain
- By column or Random assignment

**Response**

- Gain
- Attack
- Decay
- Chaos

Control styling stays minimal, label-focused, and visually subordinate to the artwork.

---

## 9. Ordered Work

1. Write the Milestone 2 plan into `docs/`.
2. Install Fontsource packages with pnpm and create the font catalog/preloader.
3. Expand and sanitize the visual configuration.
4. Add character-source parsing.
5. Extract shared seeded-random and shuffle-slot utilities.
6. Add font/color assignment functions and tests.
7. Update the renderer for active character source, fonts, colors, and background.
8. Add built-in presets, safe storage, and deterministic full-configuration generation.
9. Split controls and integrate preset/generate/reset actions in `App`.
10. Update `AGENTS.md` and Milestone 2 roadmap wording.
11. Format, test, typecheck, lint, build, and manually review the visual modes.

---

## 10. Verification

### Automated

- Character pool and source-text parsing, Unicode, deduplication, and fallbacks
- Configuration validation and clamping
- Font and color assignment determinism
- By-column stability across shuffle slots
- Random assignment synchronization with character slots
- Zero-Chaos freeze behavior
- Generate reproducibility, ranges, and valid catalog/color references
- Preset serialization round trip and malformed storage recovery
- Existing spectrum, envelope, crest, and shuffle tests

### Manual

- Upload and play audio after every preset and Generate
- Confirm amplitude remains vertical only
- Confirm fonts/colors never respond to amplitude
- Confirm By-column styles remain fixed while characters shuffle
- Confirm Random styles change with characters and freeze at zero Chaos
- Select all supported fonts and confirm no positional jumps
- Test one and multiple colors plus custom backgrounds
- Reload and apply saved presets
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

## 11. Exit Criteria

- Character pools, source text, and dedicated letters/symbols presets work.
- Single-font, multi-font, monochrome, and multi-color crests work reliably.
- Fonts and colors use only By column and Random assignment.
- By-column styling remains fixed during shuffles.
- Random styling changes exactly on character-shuffle slots.
- Zero Chaos freezes characters, fonts, and colors.
- Font loading never causes crest layout shifts.
- Generated compositions contain valid values and remain reproducible once saved.
- Presets survive reloads; malformed storage cannot break the application.
- Silence uses the selected background, white by default.
- The default composition remains the most immediate and polished experience.
