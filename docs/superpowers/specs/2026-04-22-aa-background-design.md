# AA Background Feature — Design Spec

**Date:** 2026-04-22

## Overview

Given the primary color and the generated palettes (primary, neutral gray, tinted gray), automatically compute a background color for both light and dark modes that achieves at least WCAG AA contrast ratio (4.5:1) against the primary palette's step 12 ("High-contrast text").

The logic: try neutral gray step 1 first, then tinted gray step 1, and if neither passes, generate a new color via binary search.

---

## Data Layer (`src/lib/generatePalette.ts`)

### New types

```ts
export type BackgroundSource = 'neutral' | 'tinted' | 'generated'

export type BackgroundColor = ColorStep & {
  source: BackgroundSource
  contrastRatio: number   // WCAG 2.1 ratio, e.g. 12.5
}

export type BackgroundResult = {
  light: BackgroundColor
  dark:  BackgroundColor
}
```

### New exported function

```ts
export function generateBackground(
  palette: PaletteResult,
  grays: GrayPalettes,
): BackgroundResult
```

**Algorithm (applied independently for each mode):**

1. **Foreground** = `palette[mode][11]` (primary step 12, index 11)
2. **Check neutral**: compute `wcagContrast(grays.neutral[mode][0].hex, foreground.hex)`. If ≥ 4.5, return it with `source: 'neutral'`.
3. **Check tinted**: compute `wcagContrast(grays.tinted[mode][0].hex, foreground.hex)`. If ≥ 4.5, return it with `source: 'tinted'`.
4. **Binary search fallback**: parse `grays.tinted[mode][0].hex` via culori's OKLCH converter to extract `h` and `c`. Use these as the hue and chroma for the generated color (if tinted step 1 is achromatic, `h` will be undefined — fall back to `c=0, h=0`). For light mode search lightness upward from `GRAY_LIGHT_STEPS[0].l` toward 1.0; for dark mode search downward from `GRAY_DARK_STEPS[0].l` toward 0. Contrast increases monotonically in both directions. Stop at the first lightness that achieves ≥ 4.5:1. If even the extreme (1.0 or 0.0) doesn't suffice, return the boundary value as best effort. Return with `source: 'generated'`.

`wcagContrast` is imported from culori (added to the existing import line). No new files — this function lives in `generatePalette.ts` alongside the other generators.

**Note on `contrastRatio`:** the value stored in `BackgroundColor.contrastRatio` is the actual computed ratio of the chosen background against the foreground (primary step 12), rounded to one decimal place.

---

## UI (`src/App.tsx` + `src/components/BackgroundSwatch.tsx`)

### `App.tsx`

- Add a third `useMemo` calling `generateBackground(palette, grays)`, dependent on both `palette` and `grays`.
- Render a new labeled section "AA Background" below the Tinted Gray section and above the ExportPanel.
- Render `<BackgroundSwatch result={background} foregroundLight={palette.light[11]} foregroundDark={palette.dark[11]} />`

### New `src/components/BackgroundSwatch.tsx`

```ts
type Props = {
  result: BackgroundResult
  foregroundLight: ColorStep  // palette.light[11] — primary step 12 in light mode
  foregroundDark: ColorStep   // palette.dark[11]  — primary step 12 in dark mode
}
```

Renders two cards side by side (light and dark). Each card:
- Background filled with `result.light.hex` / `result.dark.hex`
- Sample text `"Aa"` rendered in the paired foreground color (`foregroundLight.hex` / `foregroundDark.hex`) to visually demonstrate the pairing
- Contrast badge: `"12.5:1 ✓ AA"` if ratio ≥ 4.5:1 and < 7:1; `"12.5:1 ✓ AAA"` if ratio ≥ 7:1
- Source label below badge: `"from neutral gray"` / `"from tinted gray"` / `"generated"`

---

## Export (`src/components/ExportPanel.tsx`)

### Props change

```ts
type Props = {
  palette: PaletteResult
  neutralGray: PaletteResult
  tintedGray: PaletteResult
  background: BackgroundResult   // new
}
```

### CSS output (extended)

```css
/* AA Background */
--bg-light: oklch(...);
--bg-dark:  oklch(...);
```

Appended after the tinted gray dark block, before the closing `}`.

### JSON output (extended)

```json
{
  "light": {...},
  "dark":  {...},
  "neutralGray": { "light": {...}, "dark": {...} },
  "tintedGray":  { "light": {...}, "dark": {...} },
  "background": {
    "light": { "hex": "#...", "contrastRatio": 12.5, "source": "neutral" },
    "dark":  { "hex": "#...", "contrastRatio": 14.2, "source": "tinted" }
  }
}
```

No new tabs in the export panel.

---

## Out of Scope

- AA compliance for large text (3:1) — only normal text (4.5:1) is targeted
- Checking contrast for steps other than step 12
- User-adjustable contrast threshold
- Multiple background suggestions
