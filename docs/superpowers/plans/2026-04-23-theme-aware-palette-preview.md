# Theme-Aware Palette & Preview Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show only the theme-matching light or dark variant in palette scales, live preview, background swatch, and harmony swatches.

**Architecture:** Pass `theme: 'light' | 'dark'` as a new prop to `PreviewPanel`, `BackgroundSwatch`, and `HarmonySuggestions`; each renders only the relevant variant. `PaletteScale` itself needs no change — `App.tsx` simply renders only the matching row per color group via a ternary. No new files, no data layer changes.

**Tech Stack:** React 19, TypeScript, Vitest (node environment — no component test infra; verification is `tsc --noEmit` + existing test suite + visual check)

---

### Task 1: HarmonySuggestions — add `theme` prop

**Files:**
- Modify: `src/components/HarmonySuggestions.tsx`

- [ ] **Step 1: Update Props type and component signature**

Replace the existing `Props` type and function signature in `src/components/HarmonySuggestions.tsx`:

```tsx
type Props = {
  harmonies:         HarmonyResult
  selectedAccent:    number
  selectedSecondary: number
  onSelectAccent:    (i: number) => void
  onSelectSecondary: (i: number) => void
  theme:             'light' | 'dark'
}

export function HarmonySuggestions({
  harmonies,
  selectedAccent,
  selectedSecondary,
  onSelectAccent,
  onSelectSecondary,
  theme,
}: Props) {
```

- [ ] **Step 2: Switch swatch colors to use the active theme**

Both the accent and secondary loops currently use `s.palette.light[8].hex`. Change both occurrences to `s.palette[theme][8].hex`.

Accent swatch (inside `harmonies.accent.map`):
```tsx
style={{ backgroundColor: s.palette[theme][8].hex }}
```

Secondary swatch (inside `harmonies.secondary.map`):
```tsx
style={{ backgroundColor: s.palette[theme][8].hex }}
```

- [ ] **Step 3: Type-check**

```bash
cd /home/oz/Projects/Personal/colorizit && npx tsc --noEmit
```

Expected: one or more errors reporting that `<HarmonySuggestions>` in `App.tsx` is missing the required `theme` prop. This is expected — `App.tsx` is updated in Task 4.

- [ ] **Step 4: Commit**

```bash
git add src/components/HarmonySuggestions.tsx
git commit -m "feat: add theme prop to HarmonySuggestions for theme-aware swatch colors"
```

---

### Task 2: BackgroundSwatch — add `theme` prop

**Files:**
- Modify: `src/components/BackgroundSwatch.tsx`

- [ ] **Step 1: Update Props type and component body**

Replace the entire component in `src/components/BackgroundSwatch.tsx` with the following (keep `ContrastBadge` and `sourceLabel` unchanged above it):

```tsx
type Props = {
  result: BackgroundResult
  foregroundLight: ColorStep
  foregroundDark: ColorStep
  theme: 'light' | 'dark'
}

export function BackgroundSwatch({ result, foregroundLight, foregroundDark, theme }: Props) {
  const swatch = theme === 'light' ? result.light : result.dark
  const fg     = theme === 'light' ? foregroundLight : foregroundDark

  return (
    <div>
      <div
        className="rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 h-24"
        style={{ background: swatch.hex }}
      >
        <span
          className="text-3xl font-bold leading-none"
          style={{ color: fg.hex }}
        >
          Aa
        </span>
        <div style={{ color: fg.hex }}>
          <ContrastBadge ratio={swatch.contrastRatio} />
        </div>
      </div>
      <p className="text-[10px] text-[var(--app-fg-muted)] mt-1.5">{sourceLabel(swatch.source)}</p>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/oz/Projects/Personal/colorizit && npx tsc --noEmit
```

Expected: error reporting `<BackgroundSwatch>` in `App.tsx` is missing `theme` prop. Fine — fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/components/BackgroundSwatch.tsx
git commit -m "feat: add theme prop to BackgroundSwatch, show only active variant"
```

---

### Task 3: PreviewPanel — add `theme` prop

**Files:**
- Modify: `src/components/PreviewPanel.tsx`

- [ ] **Step 1: Update Props type, signature, and render**

Replace the entire file content of `src/components/PreviewPanel.tsx`:

```tsx
import { useMemo } from 'react'
import { buildTokens } from '../lib/buildTokens'
import { ComponentKit } from './ComponentKit'
import type { PaletteResult, BackgroundResult } from '../lib/generatePalette'

type Props = {
  palette: PaletteResult
  neutralGray: PaletteResult
  tintedGray: PaletteResult
  background: BackgroundResult
  accentPalette?: PaletteResult
  secondaryPalette?: PaletteResult
  theme: 'light' | 'dark'
}

export function PreviewPanel({ palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette, theme }: Props) {
  const tokens = useMemo(
    () => buildTokens(palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette),
    [palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette],
  )

  return (
    <section style={{ padding: '0 32px 32px' }}>
      <div style={{ borderRadius: '16px', border: '1px solid var(--app-border)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--app-fg-muted)', background: 'var(--app-surface)' }}>
          Live Preview
        </div>
        <ComponentKit
          id={`preview-${theme}`}
          tokens={tokens[theme]}
          label={theme === 'light' ? 'Light' : 'Dark'}
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /home/oz/Projects/Personal/colorizit && npx tsc --noEmit
```

Expected: error reporting `<PreviewPanel>` in `App.tsx` is missing `theme` prop. Fine — fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/components/PreviewPanel.tsx
git commit -m "feat: add theme prop to PreviewPanel, render only active ComponentKit"
```

---

### Task 4: App.tsx — filter PaletteScale rows and wire theme prop

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace main palette PaletteScale pair**

Find these two lines in `App.tsx` (currently lines 80–81):
```tsx
        <PaletteScale steps={palette.light} mode="light" />
        <PaletteScale steps={palette.dark} mode="dark" showLegend />
```

Replace with:
```tsx
        {theme === 'light'
          ? <PaletteScale steps={palette.light} mode="light" showLegend />
          : <PaletteScale steps={palette.dark} mode="dark" showLegend />}
```

- [ ] **Step 2: Replace neutral gray PaletteScale pair**

Find these two lines (currently inside the "Neutral Gray" section):
```tsx
          <PaletteScale steps={grays.neutral.light} mode="light" />
          <PaletteScale steps={grays.neutral.dark} mode="dark" />
```

Replace with:
```tsx
          {theme === 'light'
            ? <PaletteScale steps={grays.neutral.light} mode="light" />
            : <PaletteScale steps={grays.neutral.dark} mode="dark" />}
```

- [ ] **Step 3: Replace tinted gray PaletteScale pair**

Find these two lines (currently inside the "Tinted Gray" section):
```tsx
          <PaletteScale steps={grays.tinted.light} mode="light" />
          <PaletteScale steps={grays.tinted.dark} mode="dark" showLegend />
```

Replace with:
```tsx
          {theme === 'light'
            ? <PaletteScale steps={grays.tinted.light} mode="light" showLegend />
            : <PaletteScale steps={grays.tinted.dark} mode="dark" showLegend />}
```

- [ ] **Step 4: Add `theme` prop to HarmonySuggestions**

Find the `<HarmonySuggestions>` JSX block and add `theme={theme}`:
```tsx
        <HarmonySuggestions
          harmonies={harmonies}
          selectedAccent={selectedAccentIdx}
          selectedSecondary={selectedSecondaryIdx}
          onSelectAccent={setSelectedAccentIdx}
          onSelectSecondary={setSelectedSecondaryIdx}
          theme={theme}
        />
```

- [ ] **Step 5: Add `theme` prop to BackgroundSwatch**

Find the `<BackgroundSwatch>` JSX block and add `theme={theme}`:
```tsx
          <BackgroundSwatch
            result={background}
            foregroundLight={palette.light[11]}
            foregroundDark={palette.dark[11]}
            theme={theme}
          />
```

- [ ] **Step 6: Add `theme` prop to PreviewPanel**

Find the `<PreviewPanel>` JSX block and add `theme={theme}`:
```tsx
      <PreviewPanel
        palette={palette}
        neutralGray={grays.neutral}
        tintedGray={grays.tinted}
        background={background}
        accentPalette={accentPalette}
        secondaryPalette={secondaryPalette}
        theme={theme}
      />
```

- [ ] **Step 7: Type-check — expect clean**

```bash
cd /home/oz/Projects/Personal/colorizit && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Run existing test suite — expect no regressions**

```bash
cd /home/oz/Projects/Personal/colorizit && npx vitest run
```

Expected: all existing tests pass (they test utility functions unaffected by these changes).

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx
git commit -m "feat: filter palette rows and preview by active theme in App"
```

---

### Task 5: Visual verification

- [ ] **Step 1: Start dev server**

```bash
cd /home/oz/Projects/Personal/colorizit && npm run dev
```

- [ ] **Step 2: Verify light theme**

Open the app. Default theme is dark — click the theme toggle to switch to light.

Confirm:
- Only the **Light** palette row is visible for the main palette, neutral gray, and tinted gray sections
- The legend appears below the tinted gray light row
- The **AA Background** section shows only one swatch (the light background)
- The **Live Preview** shows only the light `ComponentKit`
- Harmony accent and secondary swatches show lighter-toned colors

- [ ] **Step 3: Verify dark theme**

Click the theme toggle to switch back to dark.

Confirm:
- Only the **Dark** palette row is visible for all three sections
- The legend appears below the tinted gray dark row
- The **AA Background** section shows only one swatch (the dark background)
- The **Live Preview** shows only the dark `ComponentKit`
- Harmony swatches reflect dark-scale colors

- [ ] **Step 4: Verify export unchanged**

Open the Export panel and confirm both light and dark tokens are still present in the exported output.
