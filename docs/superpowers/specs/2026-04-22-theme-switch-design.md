# Theme Switch Design

**Date:** 2026-04-22
**Status:** Approved

## Overview

Add a light/dark theme toggle to the app's chrome. The toggle sits inline with the color input (far right of the row). Dark is the default. Light mode uses a palette-tinted surface — the app's background and borders are derived from the currently generated palette's lightest steps, so the chrome subtly reflects whatever color the user is working with. The theme preference persists to `localStorage`.

---

## Placement

The toggle is a `32×32px` icon button at the far right of the `ColorInput` row, pushed with `ml-auto`:

```
[ color swatch ] [ #3D63DD ] Pick a color to generate your palette    [☀/🌙]
```

- Sun icon (☀) shown in dark mode → click switches to light
- Moon icon (🌙) shown in light mode → click switches to dark
- Icons: small inline SVGs, no icon library required

---

## Architecture

### New file

| File | Responsibility |
|------|---------------|
| `src/lib/buildAppVars.ts` | Pure function: derives 8 `--app-*` CSS vars from `theme` + `palette`. Dark values are constants; light values use `palette.light` steps. |

### Modified files

| File | Change |
|------|--------|
| `src/App.tsx` | Adds `theme` state + `toggleTheme` callback + `useMemo` for `buildAppVars`. Sets vars as inline styles on outer wrapper. Passes `theme`/`onToggleTheme` to `ColorInput`. |
| `src/components/ColorInput.tsx` | Two new props (`theme`, `onToggleTheme`). Renders toggle button. Swaps hardcoded dark classes for `var(--app-*)`. |
| `src/components/PaletteScale.tsx` | Swaps hardcoded dark text classes for `var(--app-*)`. |
| `src/components/BackgroundSwatch.tsx` | Swaps hardcoded dark text classes for `var(--app-*)`. |
| `src/components/HarmonySuggestions.tsx` | Swaps hardcoded dark classes + `ring-offset-[#111]` for `var(--app-*)`. |
| `src/components/ExportPanel.tsx` | Swaps hardcoded dark classes on tabs, panel, copy button, code block for `var(--app-*)`. |
| `src/components/PreviewPanel.tsx` | Replaces hardcoded `rgba(255,255,255,0.08)` inline styles for header/dividers with `var(--app-*)`. |

---

## CSS Vars (`buildAppVars`)

### Signature

```ts
type AppVars = Record<string, string>

function buildAppVars(theme: 'light' | 'dark', palette: PaletteResult): AppVars
```

### Values

| Var | Dark | Light (palette step) |
|-----|------|----------------------|
| `--app-bg` | `#111111` | `palette.light[0].hex` — App background |
| `--app-fg` | `#ffffff` | `palette.light[11].hex` — High-contrast text |
| `--app-fg-muted` | `rgba(255,255,255,0.30)` | `palette.light[10].hex` — Low-contrast text |
| `--app-fg-subtle` | `rgba(255,255,255,0.25)` | `palette.light[9].hex` — Hovered solid |
| `--app-surface` | `rgba(255,255,255,0.05)` | `palette.light[1].hex` — Subtle background |
| `--app-surface-hover` | `rgba(255,255,255,0.10)` | `palette.light[2].hex` — UI element bg |
| `--app-border` | `rgba(255,255,255,0.10)` | `palette.light[5].hex` — Subtle border |
| `--app-border-strong` | `rgba(255,255,255,0.30)` | `palette.light[6].hex` — UI border |

Light step numbers map directly to the `PURPOSES` array in `PaletteScale.tsx` (same semantic intent). Dark values are fixed constants — no palette dependency.

### Dark constants object

```ts
const DARK_VARS: AppVars = {
  '--app-bg':            '#111111',
  '--app-fg':            '#ffffff',
  '--app-fg-muted':      'rgba(255,255,255,0.30)',
  '--app-fg-subtle':     'rgba(255,255,255,0.25)',
  '--app-surface':       'rgba(255,255,255,0.05)',
  '--app-surface-hover': 'rgba(255,255,255,0.10)',
  '--app-border':        'rgba(255,255,255,0.10)',
  '--app-border-strong': 'rgba(255,255,255,0.30)',
}
```

---

## Data Flow

```
App
 │  theme: 'light' | 'dark'  (useState, persisted to localStorage)
 │  appVars = buildAppVars(theme, palette)  (useMemo)
 │
 ├── <div style={appVars}>          ← CSS vars cascade to all children
 │    ├── ColorInput theme={theme} onToggleTheme={toggleTheme}
 │    ├── PaletteScale              ← consumes var(--app-*) via className
 │    ├── BackgroundSwatch          ← consumes var(--app-*)
 │    ├── HarmonySuggestions        ← consumes var(--app-*)
 │    ├── ExportPanel               ← consumes var(--app-*)
 │    └── PreviewPanel              ← consumes var(--app-*)
```

`buildAppVars` is called inside `useMemo([theme, palette])` — it recomputes whenever theme or palette changes.

---

## `App.tsx` State

```ts
const [theme, setTheme] = useState<'light' | 'dark'>(() =>
  localStorage.getItem('colorizit-theme') === 'light' ? 'light' : 'dark'
)

const toggleTheme = () => {
  setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark'
    localStorage.setItem('colorizit-theme', next)
    return next
  })
}

const appVars = useMemo(
  () => buildAppVars(theme, palette),
  [theme, palette],
)
```

The outer wrapper changes from `className="min-h-screen bg-[#111] text-white"` to `className="min-h-screen"` with `style={appVars as React.CSSProperties}` and `bg-[var(--app-bg)] text-[var(--app-fg)]`.

---

## Toggle Button (in `ColorInput`)

New props added to `ColorInput`:

```ts
type Props = {
  value: string
  onChange: (hex: string) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}
```

Button placement: after the helper `<span>`, with `ml-auto` on the span to push the button right:

```tsx
<span className="text-sm text-[var(--app-fg-muted)] ml-auto">
  Pick a color to generate your palette
</span>
<button
  onClick={onToggleTheme}
  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-fg-muted)] hover:text-[var(--app-fg)] hover:bg-[var(--app-surface-hover)] transition-colors shrink-0"
>
  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
</button>
```

`SunIcon` and `MoonIcon` are small inline SVG components (16×16px) defined in the same file.

---

## Class Substitution Map

The following hardcoded dark utilities are replaced across components:

| Old class | Replacement |
|-----------|-------------|
| `bg-[#111]` | `bg-[var(--app-bg)]` |
| `text-white` | `text-[var(--app-fg)]` |
| `text-white/30` | `text-[var(--app-fg-muted)]` |
| `text-white/25` | `text-[var(--app-fg-subtle)]` |
| `text-white/40` | `text-[var(--app-fg-muted)]` |
| `text-white/50` | `text-[var(--app-fg-muted)]` |
| `text-white/60` | `text-[var(--app-fg-muted)]` |

> `text-white/40`, `/50`, `/60` all collapse to `--app-fg-muted` in light mode (`palette.light[10]`). Dark mode preserves the visual difference via opacity; light mode uses a single muted step — the distinction is not meaningful enough to warrant separate vars.
| `bg-white/5` | `bg-[var(--app-surface)]` |
| `bg-white/10` | `bg-[var(--app-surface-hover)]` |
| `hover:bg-white/15` | `hover:bg-[var(--app-surface-hover)]` |
| `border-white/10` | `border-[var(--app-border)]` |
| `focus:border-white/30` | `focus:border-[var(--app-border-strong)]` |
| `ring-offset-[#111]` | `ring-offset-[var(--app-bg)]` |
| `rgba(255,255,255,0.08)` (inline) | `var(--app-border)` |
| `rgba(255,255,255,0.03)` (inline) | `var(--app-surface)` |
| `rgba(255,255,255,0.06)` (inline) | `var(--app-border)` |

---

## localStorage

- Key: `'colorizit-theme'`
- Values: `'light'` or `'dark'`
- Default (missing/invalid): `'dark'`
- Written on every toggle

---

## Out of Scope

- System preference detection (`prefers-color-scheme`)
- Animating the theme transition
- Theming the `ComponentKit` preview panes (they already show both modes independently)
- Any changes to `buildTokens` / shadcn export (those use palette steps directly, not app chrome vars)
