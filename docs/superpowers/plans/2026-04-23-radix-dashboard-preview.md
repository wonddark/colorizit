# Radix-style Dashboard Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the labeled-sections component showcase (`ComponentKit`) with a realistic analytics-dashboard mockup (`DashboardPreview`) that drives every color from the raw 12-step palette, mirroring the Radix UI Colors custom-palette preview pattern.

**Architecture:** A new `DashboardPreview` component receives the raw `PaletteResult` and gray `PaletteResult` arrays, selects the active theme variant (light/dark), maps 10 palette steps to scoped CSS custom properties (`--p3`, `--p9`, `--p10`, `--p11`, `--g1`, `--g2`, `--g6`, `--g11`, `--g12`, `--bg`), and renders a static analytics dashboard — header bar, three stat cards, three-row client table. `PreviewPanel` stops calling `buildTokens` and passes raw palette data directly to `DashboardPreview`. `ComponentKit` is deleted; `buildTokens` is untouched (still used by `ExportPanel`).

**Tech Stack:** React 19, TypeScript, Vite, inline styles + scoped `<style>` block (zero new dependencies)

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/components/DashboardPreview.tsx` | CSS var derivation from raw palette steps + full dashboard markup |
| Modify | `src/components/PreviewPanel.tsx` | Remove `buildTokens` call; render `DashboardPreview` with raw palette props |
| Delete | `src/components/ComponentKit.tsx` | No longer referenced anywhere |

---

## Task 1: Create DashboardPreview.tsx

**Files:**
- Create: `src/components/DashboardPreview.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/DashboardPreview.tsx`:

```tsx
import type { PaletteResult, BackgroundResult } from '../lib/generatePalette'

type Props = {
  palette: PaletteResult
  gray: PaletteResult
  background: BackgroundResult
  accentPalette?: PaletteResult
  theme: 'light' | 'dark'
}

const ID = 'dashboard-preview'

export function DashboardPreview({ palette, gray, background, theme }: Props) {
  const p = theme === 'light' ? palette.light : palette.dark
  const g = theme === 'light' ? gray.light : gray.dark
  const bg = theme === 'light' ? background.light : background.dark

  const vars = {
    '--p3':  p[2].oklch,
    '--p9':  p[8].oklch,
    '--p10': p[9].oklch,
    '--p11': p[10].oklch,
    '--g1':  g[0].oklch,
    '--g2':  g[1].oklch,
    '--g6':  g[5].oklch,
    '--g11': g[10].oklch,
    '--g12': g[11].oklch,
    '--bg':  bg.oklch,
  } as React.CSSProperties

  return (
    <div
      id={ID}
      style={{ ...vars, background: 'var(--bg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <style>{`
        #${ID} .db-btn:hover { filter: brightness(0.88); }
        #${ID} .db-link:hover { opacity: 0.7; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '11px 18px', borderBottom: '1px solid var(--g6)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '99px', background: 'var(--p9)', flexShrink: 0 }} />
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--g12)', flex: 1 }}>Acme</div>
        <div style={{ display: 'flex', gap: '16px', marginRight: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--p11)', borderBottom: '1.5px solid var(--p9)', paddingBottom: '1px' }}>Overview</span>
          <span style={{ fontSize: '11px', color: 'var(--g11)' }}>Reports</span>
          <span style={{ fontSize: '11px', color: 'var(--g11)' }}>Settings</span>
        </div>
        <button
          className="db-btn"
          style={{ padding: '5px 12px', background: 'var(--p9)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', transition: 'filter 0.15s' }}
        >
          New report
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '18px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g12)', marginBottom: '3px' }}>Overview</div>
        <div style={{ fontSize: '11px', color: 'var(--g11)', marginBottom: '16px' }}>April 2026</div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <div style={{ flex: 1, background: 'var(--g1)', border: '1px solid var(--g6)', borderRadius: '8px', padding: '11px 13px' }}>
            <div style={{ fontSize: '9px', color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Revenue</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--p11)', lineHeight: 1 }}>$24,200</div>
            <div style={{ fontSize: '10px', color: '#3a8f5e', marginTop: '4px' }}>▲ 12% this month</div>
          </div>
          <div style={{ flex: 1, background: 'var(--g1)', border: '1px solid var(--g6)', borderRadius: '8px', padding: '11px 13px' }}>
            <div style={{ fontSize: '9px', color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Active users</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--g12)', lineHeight: 1 }}>1,402</div>
            <div style={{ fontSize: '10px', color: 'var(--g11)', marginTop: '4px' }}>▲ 3% this month</div>
          </div>
          <div style={{ flex: 1, background: 'var(--g1)', border: '1px solid var(--g6)', borderRadius: '8px', padding: '11px 13px' }}>
            <div style={{ fontSize: '9px', color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Open issues</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--g12)', lineHeight: 1 }}>8</div>
            <div style={{ fontSize: '10px', color: '#a04040', marginTop: '4px' }}>▼ 1 from last week</div>
          </div>
        </div>

        {/* Client table */}
        <div style={{ background: 'var(--g1)', border: '1px solid var(--g6)', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'flex', padding: '8px 14px', background: 'var(--g2)', borderBottom: '1px solid var(--g6)' }}>
            <div style={{ flex: 3, fontSize: '9px', fontWeight: 600, color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Client</div>
            <div style={{ flex: 2, fontSize: '9px', fontWeight: 600, color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Status</div>
            <div style={{ flex: 2, fontSize: '9px', fontWeight: 600, color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Amount</div>
            <div style={{ flex: 1 }} />
          </div>
          {/* Row 1 — Active (accent palette) */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid var(--g6)' }}>
            <div style={{ flex: 3, fontSize: '11px', color: 'var(--g12)' }}>Acme Corp</div>
            <div style={{ flex: 2 }}>
              <span style={{ padding: '2px 8px', background: 'var(--p3)', color: 'var(--p11)', borderRadius: '99px', fontSize: '10px', fontWeight: 500 }}>Active</span>
            </div>
            <div style={{ flex: 2, fontSize: '11px', color: 'var(--g12)' }}>$4,200</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <span className="db-link" style={{ fontSize: '10px', color: 'var(--p11)', cursor: 'pointer', transition: 'opacity 0.15s' }}>View →</span>
            </div>
          </div>
          {/* Row 2 — Overdue (hardcoded danger, not from palette) */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid var(--g6)' }}>
            <div style={{ flex: 3, fontSize: '11px', color: 'var(--g12)' }}>Globex Ltd</div>
            <div style={{ flex: 2 }}>
              <span style={{ padding: '2px 8px', background: 'color-mix(in oklch, #c84b4b 18%, transparent)', color: '#c84b4b', borderRadius: '99px', fontSize: '10px', fontWeight: 500 }}>Overdue</span>
            </div>
            <div style={{ flex: 2, fontSize: '11px', color: 'var(--g12)' }}>$890</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <span className="db-link" style={{ fontSize: '10px', color: 'var(--p11)', cursor: 'pointer', transition: 'opacity 0.15s' }}>View →</span>
            </div>
          </div>
          {/* Row 3 — Pending (gray) */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px' }}>
            <div style={{ flex: 3, fontSize: '11px', color: 'var(--g12)' }}>Initech</div>
            <div style={{ flex: 2 }}>
              <span style={{ padding: '2px 8px', background: 'var(--g2)', color: 'var(--g11)', borderRadius: '99px', fontSize: '10px', fontWeight: 500 }}>Pending</span>
            </div>
            <div style={{ flex: 2, fontSize: '11px', color: 'var(--g12)' }}>$2,100</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <span className="db-link" style={{ fontSize: '10px', color: 'var(--p11)', cursor: 'pointer', transition: 'opacity 0.15s' }}>View →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DashboardPreview.tsx
git commit -m "feat: add DashboardPreview component with 12-step palette CSS vars"
```

---

## Task 2: Update PreviewPanel.tsx

**Files:**
- Modify: `src/components/PreviewPanel.tsx`

- [ ] **Step 1: Replace the file contents**

Replace `src/components/PreviewPanel.tsx` entirely with:

```tsx
import { DashboardPreview } from './DashboardPreview'
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

export function PreviewPanel({ palette, tintedGray, background, accentPalette, theme }: Props) {
  return (
    <section>
      <div style={{ borderRadius: '16px', border: '1px solid var(--app-border)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--app-fg-muted)', background: 'var(--app-surface)' }}>
          Live Preview
        </div>
        <DashboardPreview
          palette={palette}
          gray={tintedGray}
          background={background}
          accentPalette={accentPalette}
          theme={theme}
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Start the dev server and visually verify**

```bash
npm run dev
```

Open `http://localhost:5173`. Check all of the following:

1. The Live Preview panel shows the dashboard (header + 3 stat cards + table)
2. Change the color input — header logo dot, "New report" button, active nav underline, revenue figure, "Active" badge, and "View →" links all update to the new accent
3. Toggle dark/light — the whole dashboard switches theme cleanly; card backgrounds, borders, and text all shift
4. "Overdue" badge stays red regardless of palette color
5. "New report" button responds to hover (darkens)

- [ ] **Step 3: Commit**

```bash
git add src/components/PreviewPanel.tsx
git commit -m "feat: wire PreviewPanel to DashboardPreview, remove buildTokens from preview path"
```

---

## Task 3: Delete ComponentKit.tsx

**Files:**
- Delete: `src/components/ComponentKit.tsx`

- [ ] **Step 1: Remove the file**

```bash
git rm src/components/ComponentKit.tsx
```

- [ ] **Step 2: Verify the TypeScript build passes**

```bash
npm run build
```

Expected: exits with code 0, no TypeScript errors, no missing-module errors.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: delete ComponentKit, replaced by DashboardPreview"
```
