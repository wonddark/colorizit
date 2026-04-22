# shadcn/ui Theme Export — Design Spec

**Date:** 2026-04-22
**Status:** Approved

## Overview

Add a `shadcn/ui` tab to the existing Export Panel that generates a shadcn v4-compatible CSS theme from all generated palettes (primary, neutral gray, tinted gray, AA background).

## Architecture

### New function: `buildShadcn`

Location: `src/components/ExportPanel.tsx` (alongside `buildCss` and `buildJson`)

Signature (matches existing builders):
```ts
export function buildShadcn(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
): string
```

Needs one new import: `wcagContrast` from `culori` — used to pick `--primary-foreground`.

### Tab extension

- `Tab` type: `'css' | 'json'` → `'css' | 'json' | 'shadcn'`
- New tab button label: `shadcn/ui`
- No new files; no changes outside `ExportPanel.tsx` and `exportBuilders.test.ts`

## Output Format

shadcn v4 format: `@layer base` wrapper with `:root` (light) and `.dark` blocks. Values use the existing `oklch(L% C H)` string format already produced by `generatePalette`.

```css
@layer base {
  :root {
    --background: oklch(...);
    ...
  }
  .dark {
    --background: oklch(...);
    ...
  }
}
```

## Token Mapping

Step references are 1-indexed (step 1 = array index 0).

| Token | Light (`:root`) | Dark (`.dark`) |
|---|---|---|
| `--background` | AA bg light | AA bg dark |
| `--foreground` | primary.light[12] | primary.dark[12] |
| `--card` | tinted-gray.light[2] | tinted-gray.dark[2] |
| `--card-foreground` | primary.light[12] | primary.dark[12] |
| `--popover` | AA bg light | AA bg dark |
| `--popover-foreground` | primary.light[12] | primary.dark[12] |
| `--primary` | primary.light[9] | primary.dark[9] |
| `--primary-foreground` | contrast-picked (see below) | contrast-picked |
| `--secondary` | tinted-gray.light[3] | tinted-gray.dark[3] |
| `--secondary-foreground` | tinted-gray.light[11] | tinted-gray.dark[11] |
| `--muted` | neutral-gray.light[3] | neutral-gray.dark[3] |
| `--muted-foreground` | neutral-gray.light[11] | neutral-gray.dark[11] |
| `--accent` | tinted-gray.light[3] | tinted-gray.dark[3] |
| `--accent-foreground` | primary.light[12] | primary.dark[12] |
| `--border` | tinted-gray.light[6] | tinted-gray.dark[6] |
| `--input` | tinted-gray.light[6] | tinted-gray.dark[6] |
| `--ring` | primary.light[8] | primary.dark[8] |

### `--primary-foreground` contrast pick

Compare `wcagContrast(primary[9].hex, primary[1].hex)` vs `wcagContrast(primary[9].hex, primary[12].hex)`. Use the oklch of whichever step wins. This correctly handles both light-on-dark and dark-on-light primary buttons without hardcoding.

## Testing

New `describe('buildShadcn')` block in `src/__tests__/exportBuilders.test.ts`:

- Output starts with `@layer base {` and ends with `}`
- Contains both `:root {` and `.dark {`
- All 17 core tokens present in `:root` block
- All 17 core tokens present in `.dark` block
- `--primary-foreground` value matches an oklch pattern (confirms contrast picker ran)

## Out of scope

`--destructive`, `--chart-*`, `--sidebar-*`, `--radius` are intentionally excluded — they cannot be meaningfully derived from a single seed color.
