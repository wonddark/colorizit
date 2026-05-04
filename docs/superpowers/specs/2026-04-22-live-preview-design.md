# Live Preview Design

**Date:** 2026-04-22
**Status:** Approved

## Overview

Add a full-width live preview panel below the export panel that renders a set of interactive UI components (buttons, tabs, inputs, card, typography) styled in real time using the generated color palette. The panel stacks a light-mode pane on top of a dark-mode pane so both are visible simultaneously.

---

## Placement

The preview panel sits below `<ExportPanel>` and breaks out of the `max-w-2xl` column constraint — it spans full viewport width. It is always visible (not hidden behind a tab or toggle).

```
App layout (top → bottom)
─────────────────────────
[max-w-2xl column]
  ColorInput
  PaletteScale (light)
  PaletteScale (dark)
  Neutral Gray
  Tinted Gray
  HarmonySuggestions
  AA Background
  ExportPanel

[full-width, outside column]
  PreviewPanel
    └── Light pane  (ComponentKit, light tokens)
    └── Dark pane   (ComponentKit, dark tokens)
```

---

## Architecture

### New files

| File | Responsibility |
|------|---------------|
| `src/lib/buildTokens.ts` | Derives semantic token objects (light + dark) from palette data. Single source of truth shared by the export panel and the preview. |
| `src/components/ComponentKit.tsx` | Renders the interactive component showcase inside one scoped pane. Accepts a `TokenSet` prop. |
| `src/components/PreviewPanel.tsx` | Full-width wrapper. Renders the header and stacks two `<ComponentKit>` instances (light, dark). |

### Modified files

| File | Change |
|------|--------|
| `src/components/ExportPanel.tsx` | `buildShadcn` calls `buildTokens` internally and formats its output as CSS strings. |
| `src/App.tsx` | Imports and renders `<PreviewPanel>` outside the `max-w-2xl` column, after `<ExportPanel>`. |

---

## Token Derivation (`buildTokens`)

Signature:
```ts
type TokenSet = Record<string, string> // CSS var name → oklch string

type TokenResult = { light: TokenSet; dark: TokenSet }

function buildTokens(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
  accentPalette?: PaletteResult,
  secondaryPalette?: PaletteResult,
): TokenResult
```

The 13 tokens derived per mode (same mapping currently in `buildShadcn`'s `vars()` closure):

| Token | Light source | Dark source |
|-------|-------------|------------|
| `background` | `background.light.oklch` | `background.dark.oklch` |
| `foreground` | `palette.light[11].oklch` | `palette.dark[11].oklch` |
| `card` | `tintedGray.light[1].oklch` | `tintedGray.dark[1].oklch` |
| `card-foreground` | `palette.light[11].oklch` | `palette.dark[11].oklch` |
| `primary` | `palette.light[8].oklch` | `palette.dark[8].oklch` |
| `primary-foreground` | higher contrast of `palette[0]` vs `palette[11]` | same logic |
| `secondary` | `secondaryPalette?.light[2] ?? tintedGray.light[2]` | same |
| `secondary-foreground` | `secondaryPalette?.light[10] ?? tintedGray.light[10]` | same |
| `muted` | `neutralGray.light[2].oklch` | `neutralGray.dark[2].oklch` |
| `muted-foreground` | `neutralGray.light[10].oklch` | `neutralGray.dark[10].oklch` |
| `accent` | `accentPalette?.light[2] ?? tintedGray.light[2]` | same |
| `accent-foreground` | `accentPalette?.light[11] ?? palette.light[11]` | same |
| `border` | `tintedGray.light[5].oklch` | `tintedGray.dark[5].oklch` |
| `ring` | `palette.light[7].oklch` | `palette.dark[7].oklch` |

> `popover` and `popover-foreground` are intentionally omitted (identical to `background` / `foreground`). `input` is intentionally omitted (identical to `border`). These 3 tokens are not needed for the component kit.

---

## Data Flow

```
App (holds palette, grays, background, accentPalette, secondaryPalette)
 │
 ├── ExportPanel (calls buildTokens internally for buildShadcn)
 │
 └── PreviewPanel (same 5 props)
      │   calls buildTokens(…) → { light, dark }
      ├── ComponentKit tokens={light}
      └── ComponentKit tokens={dark}
```

---

## `ComponentKit` Implementation

### Scoped CSS variables

Each `ComponentKit` renders a root `div` with the token values applied as `--preview-*` inline CSS vars:

```tsx
<div style={{
  '--preview-bg': tokens.background,
  '--preview-fg': tokens.foreground,
  '--preview-primary': tokens.primary,
  // … all 13 tokens
} as React.CSSProperties}>
  …
</div>
```

All child elements reference `var(--preview-*)` — never global vars — to avoid colliding with the app's own styles.

### Hover / focus states

A `<style>` tag is rendered once at mount inside `ComponentKit` with scoped selectors (using a stable `id` on the root div). This keeps hover/focus styles in CSS without mutating global stylesheets:

```html
<style>{`
  #preview-light .preview-btn-primary:hover { filter: brightness(0.88); }
  #preview-light .preview-input:focus { box-shadow: 0 0 0 3px color-mix(in oklch, var(--preview-ring) 25%, transparent); }
`}</style>
```

The `id` value (`"preview-light"` or `"preview-dark"`) is passed as a prop from `PreviewPanel` so each pane's scoped selectors are unique.

### Active tab state

A local `useState<number>` tracks the active tab index. Clicking any tab updates the state; active tab gets `--preview-primary` bottom border and text color.

---

## Component Kit — Five Rows

| Row | Elements | Interactive states |
|-----|----------|--------------------|
| **Button** | Primary, Secondary, Outline, Ghost, Disabled | Hover (`brightness(0.88)`), Disabled (`opacity: 0.4`, `pointer-events: none`) |
| **Tabs** | 3 tabs ("Overview", "Activity", "Settings") | Active tab switches on click (`useState`), active gets primary color + border |
| **Inputs** | Normal input, Disabled input | Focus ring (`--preview-ring` border + translucent shadow), Disabled (`opacity: 0.45`) |
| **Card** | Title, body text, inline link, badge chip | Link hover (`opacity: 0.75`) |
| **Typography** | Heading (foreground), muted body, standalone link | Link hover |

---

## `PreviewPanel` Structure

```
<section> (full-width, no max-w constraint)
  <header> "Live Preview" label
  <div> stacked panes
    <ComponentKit id="preview-light" tokens={tokens.light} label="Light" />
    <ComponentKit id="preview-dark"  tokens={tokens.dark}  label="Dark"  />
  </div>
</section>
```

Visual treatment: rounded corners, border (`rgba(255,255,255,0.08)`), matching the existing card style of the export panel. A thin divider separates the two panes.

---

## App.tsx Change

`PreviewPanel` is rendered outside (after) the `max-w-2xl` column div:

```tsx
<div className="min-h-screen bg-[#111] text-white p-8">
  <div className="max-w-2xl mx-auto flex flex-col gap-8">
    {/* … existing content … */}
    <ExportPanel … />
  </div>

  <PreviewPanel … />  {/* full-width, outside the column */}
</div>
```

---

## Out of Scope

- Dark/light toggle (both panes always visible)
- Theming the app's own UI with the preview palette
- Exporting the component CSS separately
- Responsive breakpoints for the preview panel
