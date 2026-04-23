# Radix-style Dashboard Preview

**Date:** 2026-04-23
**Status:** Approved

## Goal

Replace the current labeled component-showcase preview (`ComponentKit`) with a realistic analytics-dashboard mockup that demonstrates how the generated palette looks inside an actual product UI — the same intent as the Radix UI Colors custom-palette preview.

## Reference

Radix UI Colors → https://www.radix-ui.com/colors/custom  
The Radix preview renders inside a `div.radix-themes.radix-themes-default-fonts` and drives every color through their 12-step CSS-variable scale. We replicate that philosophy (raw scale → CSS vars → mockup) without installing `@radix-ui/themes`.

---

## Architecture

### Files

| Action | File | Notes |
|--------|------|-------|
| Create | `src/components/DashboardPreview.tsx` | New component; replaces ComponentKit |
| Modify | `src/components/PreviewPanel.tsx` | Remove `buildTokens` call; render `DashboardPreview` |
| Delete | `src/components/ComponentKit.tsx` | No longer referenced |
| Keep | `src/lib/buildTokens.ts` | Still used by `ExportPanel` — untouched |
| Keep | `src/App.tsx` | `PreviewPanel` external props are unchanged |

### Data flow

```
App
 └─ PreviewPanel (palette, gray, background, accentPalette, theme)
     └─ DashboardPreview
         ├─ selects palette.light or palette.dark based on theme
         ├─ maps 12 ColorStep arrays → --p1…--p12, --g1…--g12, --bg
         └─ renders dashboard HTML using those vars
```

### `DashboardPreview` props

```tsx
type Props = {
  palette: PaletteResult        // accent palette — full 12 steps, both themes
  gray: PaletteResult           // tinted gray — full 12 steps, both themes
  background: BackgroundResult  // computed background color
  accentPalette?: PaletteResult // optional harmony accent (unused in v1)
  theme: 'light' | 'dark'
}
```

`PreviewPanel` already receives all of this data. No changes to `App.tsx` or the `PreviewPanel` signature are required — only what `PreviewPanel` renders internally changes.

---

## Color Mapping

CSS vars are derived from whichever theme variant is active (`palette.light` / `palette.dark`):

| CSS variable | Palette step | Role in the dashboard |
|---|---|---|
| `--p3` | accent 3 | Active badge background |
| `--p9` | accent 9 | Primary button fill, logo dot, active nav underline |
| `--p10` | accent 10 | Primary button hover state |
| `--p11` | accent 11 | Active badge text, revenue figure, "View →" links |
| `--g1` | gray 1 | Card and table body background |
| `--g2` | gray 2 | Table header row background |
| `--g6` | gray 6 | Card borders, table row dividers, header border |
| `--g11` | gray 11 | Muted labels (column headers, date caption) |
| `--g12` | gray 12 | Primary text (page title, row values, client names) |
| `--bg` | — | Outer dashboard background (from `BackgroundResult`) |

Semantic status colors (green ▲, red ▼, Overdue badge) are hardcoded — they must not change with the palette.

---

## Dashboard Layout

The mockup is a single-panel analytics screen (no sidebar). Top to bottom:

### Header bar
- Logo dot (p9) + app name "Acme" (g12)
- Inline nav: "Overview" active (p11, underline p9) · "Reports" · "Settings" (g11)
- CTA button right-aligned: "New report" (p9 fill, white text)
- Bottom border: g6

### Stat cards (3-up row)
Each card: g1 background, g6 border, 8px border-radius.

| Card | Value color | Delta color |
|------|-------------|-------------|
| Revenue — $24,200 | p11 | hardcoded green |
| Active users — 1,402 | g12 | g11 (neutral) |
| Open issues — 8 | g12 | hardcoded red |

### Client table
g1 background, g6 border, g2 header background, g6 row dividers.

Columns: **Client** · **Status** · **Amount** · *(action)*

Three rows:
- **Acme Corp** — `Active` badge (p3 bg, p11 text) — $4,200 — "View →" (p11)
- **Globex Ltd** — `Overdue` badge (hardcoded danger) — $890 — "View →" (p11)
- **Initech** — `Pending` badge (g2 bg, g11 text) — $2,100 — "View →" (p11)

---

## Implementation notes

- All styles are inline (same pattern as current ComponentKit) — no new CSS files.
- A scoped `<style>` block inside the component handles hover states (button brightness, link opacity) using the component's root `id`.
- The component is stateless — no `useState`, no tabs, no interactive inputs. The dashboard is a static mockup.
- Both light and dark variants are rendered by `PreviewPanel` as a single active theme (whichever `theme` prop says), not side-by-side.

---

## Error handling

None needed at this layer. `generatePalette` guarantees valid 12-step arrays before data reaches this component; `App.tsx` already wraps generation in try/catch with a fallback color.

## Testing

Visual only. Run dev server, change the color input, confirm the dashboard updates. No unit tests for this component. `buildTokens.test.ts` is unaffected.
