# Gray Palettes Feature — Design Spec

**Date:** 2026-04-21

## Overview

Given the user's primary color input, automatically generate two 12-step gray palettes:
1. **Neutral gray** — achromatic (zero chroma), pure gray
2. **Tinted gray** — subtly hue-shifted using the primary color's hue, small fixed chroma

Both palettes produce light and dark variants and are included in the export output.

The gray base is inferred from the primary color — no additional user input is required.

---

## Data Layer (`src/lib/generatePalette.ts`)

### New step tables

Add two new constant arrays alongside the existing `LIGHT_STEPS` / `DARK_STEPS`:

- **`GRAY_LIGHT_STEPS`** — 12 `{ l }` entries, lightness from ~0.992 down to ~0.155, tuned to match a Radix-style gray scale (wider range than the primary curve, reaching true near-white and near-black)
- **`GRAY_DARK_STEPS`** — 12 `{ l }` entries, lightness from ~0.125 up to ~0.960
- **`GRAY_TINT_C`** — 12 chroma values (~0.002–0.008) used for the tinted variant; fixed and independent of the primary's chroma so tinting remains subtle even for highly saturated primaries

### New exported function

```ts
export type GrayPalettes = {
  neutral: PaletteResult
  tinted: PaletteResult
}

export function generateGrayPalettes(input: string): GrayPalettes
```

- **Neutral**: maps `GRAY_LIGHT_STEPS` / `GRAY_DARK_STEPS` with `c=0`, `h=0`
- **Tinted**: maps the same lightness values with `GRAY_TINT_C[i]` as chroma and the primary color's hue (extracted via `toOklch`); if hue is undefined (achromatic input), falls back to neutral

`PaletteResult` and `ColorStep` types are unchanged.

---

## UI (`src/App.tsx` + `src/components/PaletteScale.tsx`)

### `App.tsx`

- Add a second `useMemo` that calls `generateGrayPalettes(color)`, dependent on the same `color` state
- Extend the layout below the existing primary scales with two new labeled sections:
  - **"Neutral Gray"** — `PaletteScale` light + dark rows
  - **"Tinted Gray"** — `PaletteScale` light + dark rows (with `showLegend` on the dark row)
- Section heading style matches the existing "Light" / "Dark" labels

### `PaletteScale.tsx`

No changes required. The component already accepts `steps` + `mode` generically.

---

## Export (`src/components/ExportPanel.tsx`)

### Props change

```ts
type Props = {
  palette: PaletteResult
  neutralGray: PaletteResult
  tintedGray: PaletteResult
}
```

### CSS output (extended)

```css
:root {
  /* Primary — Light */
  --color-1: oklch(...);
  ...

  /* Primary — Dark */
  --color-dark-1: oklch(...);
  ...

  /* Neutral Gray — Light */
  --gray-1: oklch(...);
  ...

  /* Neutral Gray — Dark */
  --gray-dark-1: oklch(...);
  ...

  /* Tinted Gray — Light */
  --gray-tinted-1: oklch(...);
  ...

  /* Tinted Gray — Dark */
  --gray-tinted-dark-1: oklch(...);
  ...
}
```

### JSON output (extended)

```json
{
  "light": { "1": "#...", ... },
  "dark":  { "1": "#...", ... },
  "neutralGray": {
    "light": { "1": "#...", ... },
    "dark":  { "1": "#...", ... }
  },
  "tintedGray": {
    "light": { "1": "#...", ... },
    "dark":  { "1": "#...", ... }
  }
}
```

No new tabs. The existing CSS / JSON tabs grow to include gray output.

---

## Out of Scope

- User-adjustable gray chroma intensity
- More than two gray variants
- Separate export controls per palette
