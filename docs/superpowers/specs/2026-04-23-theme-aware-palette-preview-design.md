# Theme-Aware Palette & Preview Display

**Date:** 2026-04-23  
**Status:** Approved

## Overview

When the app is in light theme, show only the light variants of palette scales, the live preview, the background swatch, and harmony suggestion swatches. When in dark theme, show only the dark variants. Palette generation and export are unaffected.

## Scope

Four components are touched. No new files, no new abstractions, no changes to data layer or export.

## Design

### 1. App.tsx — PaletteScale rows

Each color group currently renders two `<PaletteScale>` rows (light + dark). Replace each pair with a ternary that renders only the theme-matching row.

The `showLegend` prop currently lives on the dark rows for the main palette and tinted gray groups. Since only one row is visible at a time, `showLegend` is applied to whichever row is rendered — preserving the legend in both themes.

Neutral gray has no legend so it uses a plain conditional render.

```tsx
// Main palette (before)
<PaletteScale steps={palette.light} mode="light" />
<PaletteScale steps={palette.dark} mode="dark" showLegend />

// Main palette (after)
{theme === 'light'
  ? <PaletteScale steps={palette.light} mode="light" showLegend />
  : <PaletteScale steps={palette.dark} mode="dark" showLegend />}
```

Same pattern applied to neutral gray (no legend) and tinted gray (legend on visible row).

### 2. PreviewPanel

Add `theme: 'light' | 'dark'` prop. Render only `tokens[theme]` via a single `ComponentKit`. The divider between the two kits is removed since there is only one.

```tsx
<ComponentKit
  id={`preview-${theme}`}
  tokens={tokens[theme]}
  label={theme === 'light' ? 'Light' : 'Dark'}
/>
```

### 3. BackgroundSwatch

Add `theme: 'light' | 'dark'` prop. Render only the theme-matching swatch (`result.light` + `foregroundLight` in light mode; `result.dark` + `foregroundDark` in dark mode). The outer `flex gap-3` wrapper is replaced with a plain `div` since there is only one child.

### 4. HarmonySuggestions

Add `theme: 'light' | 'dark'` prop. Switch the swatch color from always using `s.palette.light[8].hex` to `s.palette[theme][8].hex`. No structural changes.

## Out of Scope

- Palette generation (`generatePalette`, `generateGrayPalettes`, etc.) — unchanged
- Export panel — unchanged; always exports both light and dark tokens
- `buildTokens` / `buildAppVars` — unchanged
- `ColorInput` theme toggle — unchanged

## Data Flow

```
App.tsx (theme state)
  ├── App.tsx (PaletteScale rows) — filters which row to render
  ├── PreviewPanel (theme prop) — renders tokens[theme] only
  ├── BackgroundSwatch (theme prop) — renders result[theme] only
  └── HarmonySuggestions (theme prop) — uses palette[theme][8] for swatch color
```
