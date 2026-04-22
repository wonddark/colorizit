# Harmony Color Suggestions — Design Spec

**Date:** 2026-04-22
**Status:** Approved

## Overview

Given the primary color, derive up to 5 accent and 5 secondary color suggestions using fixed color harmony rules. The user can select one per role; selections default to index 0. The selected palettes are included as full 12-step scales in all three export formats (CSS, JSON, shadcn/ui).

---

## Data Layer

### New types (`src/lib/generatePalette.ts`)

```ts
export type ColorSuggestion = {
  label: string
  palette: PaletteResult
}

export type HarmonyResult = {
  accent:    ColorSuggestion[]
  secondary: ColorSuggestion[]
}
```

### New function: `generateHarmonies`

```ts
export function generateHarmonies(input: string): HarmonyResult
```

- Parses `input` with culori, extracts the OKLCH hue.
- If the color is achromatic (hue is `undefined` or `NaN`), returns `{ accent: [], secondary: [] }`.
- Otherwise generates one `ColorSuggestion` per shift using `generatePalette` with the shifted hue:

| Role | Hue shifts | Labels |
|---|---|---|
| Accent | 180°, 150°, 210°, 120°, 90° | Complementary, Split A, Split B, Triadic, Square |
| Secondary | 30°, −30°, 60°, −60°, 45° | Analogous +30°, Analogous −30°, Analogous +60°, Analogous −60°, Analogous +45° |

- Hue is wrapped modulo 360 (always positive).
- Each shifted hue reuses the same chroma/lightness curve as `generatePalette` — only the hue differs.

---

## App State (`src/App.tsx`)

- `harmonies: HarmonyResult` — `useMemo` derived from `color`, same error-fallback pattern as existing memos.
- `selectedAccentIdx: number` — `useState(0)`.
- `selectedSecondaryIdx: number` — `useState(0)`.
- Both indices reset to `0` via `useEffect` when `color` changes.
- `accentPalette: PaletteResult | undefined` — `harmonies.accent[selectedAccentIdx]?.palette`.
- `secondaryPalette: PaletteResult | undefined` — `harmonies.secondary[selectedSecondaryIdx]?.palette`.

---

## UI Component (`src/components/HarmonySuggestions.tsx`)

```ts
type Props = {
  harmonies:        HarmonyResult
  selectedAccent:   number
  selectedSecondary: number
  onSelectAccent:   (i: number) => void
  onSelectSecondary:(i: number) => void
}
```

- Hidden entirely when `harmonies.accent.length === 0` (achromatic input).
- Renders two labeled rows: **Accent** and **Secondary**.
- Each row shows up to 5 swatches; each swatch is a colored square using step 9 (index 8) of the suggestion's `light` palette.
- Label (e.g. "Complementary") shown below each swatch.
- Selected swatch has a white ring; clicking another calls the appropriate callback.
- Placed in `App.tsx` between the tinted-gray section and the AA background section.

---

## Export Changes

All three builder functions gain two optional trailing parameters:

```ts
function buildCss(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
  accentPalette?: PaletteResult,
  secondaryPalette?: PaletteResult,
): string
```

Same extension applies to `buildJson` and `buildShadcn`.

### CSS additions (when palettes are provided)

Appended inside `:root {}`, after the existing AA Background block:

```css
/* Accent — Light */
--accent-1: oklch(...); ... --accent-12: oklch(...);
/* Accent — Dark */
--accent-dark-1: oklch(...); ... --accent-dark-12: oklch(...);
/* Secondary — Light */
--secondary-1: oklch(...); ... --secondary-12: oklch(...);
/* Secondary — Dark */
--secondary-dark-1: oklch(...); ... --secondary-dark-12: oklch(...);
```

### JSON additions (when palettes are provided)

Two new top-level keys added to the existing JSON object:

```json
"accent": {
  "light": { "1": "#hex", ..., "12": "#hex" },
  "dark":  { "1": "#hex", ..., "12": "#hex" }
},
"secondary": {
  "light": { "1": "#hex", ..., "12": "#hex" },
  "dark":  { "1": "#hex", ..., "12": "#hex" }
}
```

### shadcn/ui changes (when palettes are provided)

When accent/secondary palettes are present, the following tokens are upgraded from tinted-gray to the real generated palette. All step references are 1-indexed.

| Token | With palette | Without palette (fallback) |
|---|---|---|
| `--secondary` | secondary.light[3] | tinted-gray.light[3] |
| `--secondary-foreground` | secondary.light[11] | tinted-gray.light[11] |
| `--accent` | accent.light[3] | tinted-gray.light[3] |
| `--accent-foreground` | accent.light[12] | primary.light[12] |

`.dark` block mirrors the same with dark-mode steps. All other tokens are unchanged.

---

## Testing

### `src/__tests__/generatePalette.test.ts` (new file)

- `generateHarmonies` returns exactly 5 accent and 5 secondary suggestions for a chromatic input (`#3D63DD`).
- Each suggestion has a non-empty `label` string.
- Each suggestion's `palette.light` and `palette.dark` have exactly 12 steps.
- All accent labels are distinct; all secondary labels are distinct.
- No accent hue label appears in the secondary list (roles are separate).
- Returns `{ accent: [], secondary: [] }` for an achromatic input (`#808080`).

### `src/__tests__/exportBuilders.test.ts` (extend)

- `buildCss` with accent/secondary palettes includes `--accent-1:` through `--accent-12:` and `--secondary-1:` through `--secondary-12:`.
- `buildJson` with palettes includes `accent.light`, `accent.dark`, `secondary.light`, `secondary.dark`, each with 12 entries.
- `buildShadcn` with palettes uses the secondary palette's step 3 oklch for `--secondary` (not tinted-gray).
- `buildShadcn` with palettes uses the accent palette's step 3 oklch for `--accent` (not tinted-gray).
- All three builders called without the optional params produce identical output to current behavior (no regression).

---

## Out of scope

- Showing a full palette preview for each suggestion (just the step-9 swatch is shown).
- Letting the user click a suggestion to load it as the new primary color.
- Generating gray palettes or AA backgrounds for the accent/secondary colors.
