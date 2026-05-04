# Live Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-width live preview panel below the export panel that renders interactive UI components (buttons, tabs, inputs, card, typography) styled in real time from the generated palette using scoped CSS variables.

**Architecture:** Extract the shadcn token-derivation logic from `buildShadcn` into a standalone `buildTokens` helper. A new `ComponentKit` component renders the interactive component showcase inside a scoped `div` with `--preview-*` CSS vars set as inline styles. `PreviewPanel` stacks two `ComponentKit` instances (light on top, dark below) in a full-width wrapper outside the `max-w-2xl` column.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, culori, vitest

---

## File Map

| Status | File | Change |
|--------|------|--------|
| Create | `src/lib/buildTokens.ts` | Pure function: derives 14-token objects (light + dark) from palette data |
| Create | `src/components/ComponentKit.tsx` | Interactive component showcase in one scoped pane |
| Create | `src/components/PreviewPanel.tsx` | Full-width wrapper; stacks two `ComponentKit` instances |
| Modify | `src/components/ExportPanel.tsx` | `buildShadcn` calls `buildTokens` instead of its own inline derivation |
| Modify | `src/App.tsx` | Render `PreviewPanel` outside the `max-w-2xl` column |
| Modify | `src/__tests__/exportBuilders.test.ts` | Add `buildTokens` tests |
| Modify | `.gitignore` | Add `.superpowers/` |

---

## Task 1: Ignore brainstorm artifacts

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add `.superpowers/` to `.gitignore`**

Open `.gitignore` and append at the end:

```
# Visual companion brainstorm files
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm directory"
```

---

## Task 2: Create `buildTokens` with tests

**Files:**
- Create: `src/lib/buildTokens.ts`
- Modify: `src/__tests__/exportBuilders.test.ts`

- [ ] **Step 1: Write failing tests**

Add a new `describe('buildTokens', ...)` block at the top of `src/__tests__/exportBuilders.test.ts`, before the existing `describe('buildCss', ...)`:

```ts
import { buildTokens } from '../lib/buildTokens'
```

Add the import at the top (alongside the existing imports), then add the describe block:

```ts
describe('buildTokens', () => {
  const tokens = buildTokens(palette, neutral, tinted, background)

  it('returns light and dark token sets', () => {
    expect(tokens.light).toBeDefined()
    expect(tokens.dark).toBeDefined()
  })

  it('light token set has all 14 required keys', () => {
    const required = [
      'background', 'foreground', 'card', 'card-foreground',
      'primary', 'primary-foreground',
      'secondary', 'secondary-foreground',
      'muted', 'muted-foreground',
      'accent', 'accent-foreground',
      'border', 'ring',
    ]
    for (const key of required) {
      expect(tokens.light).toHaveProperty(key)
    }
  })

  it('dark token set has all 14 required keys', () => {
    const required = [
      'background', 'foreground', 'card', 'card-foreground',
      'primary', 'primary-foreground',
      'secondary', 'secondary-foreground',
      'muted', 'muted-foreground',
      'accent', 'accent-foreground',
      'border', 'ring',
    ]
    for (const key of required) {
      expect(tokens.dark).toHaveProperty(key)
    }
  })

  it('all token values are oklch strings', () => {
    for (const val of Object.values(tokens.light)) {
      expect(val).toMatch(/^oklch\(/)
    }
    for (const val of Object.values(tokens.dark)) {
      expect(val).toMatch(/^oklch\(/)
    }
  })

  it('light and dark primary values differ', () => {
    expect(tokens.light.primary).not.toBe(tokens.dark.primary)
  })

  it('uses accent palette step 3 for accent when provided', () => {
    const t = buildTokens(palette, neutral, tinted, background, accentPalette)
    expect(t.light.accent).toBe(accentPalette.light[2].oklch)
    expect(t.dark.accent).toBe(accentPalette.dark[2].oklch)
  })

  it('falls back to tintedGray step 3 for accent when no accentPalette', () => {
    const t = buildTokens(palette, neutral, tinted, background)
    expect(t.light.accent).toBe(tinted.light[2].oklch)
  })

  it('uses secondary palette step 3 for secondary when provided', () => {
    const t = buildTokens(palette, neutral, tinted, background, undefined, secondaryPalette)
    expect(t.light.secondary).toBe(secondaryPalette.light[2].oklch)
    expect(t.dark.secondary).toBe(secondaryPalette.dark[2].oklch)
  })

  it('falls back to tintedGray step 3 for secondary when no secondaryPalette', () => {
    const t = buildTokens(palette, neutral, tinted, background)
    expect(t.light.secondary).toBe(tinted.light[2].oklch)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test
```

Expected: tests in `buildTokens` describe block fail with "Cannot find module '../lib/buildTokens'".

- [ ] **Step 3: Create `src/lib/buildTokens.ts`**

```ts
import { wcagContrast } from 'culori'
import type { PaletteResult, BackgroundResult, ColorStep } from './generatePalette'

export type TokenSet = {
  background: string
  foreground: string
  card: string
  'card-foreground': string
  primary: string
  'primary-foreground': string
  secondary: string
  'secondary-foreground': string
  muted: string
  'muted-foreground': string
  accent: string
  'accent-foreground': string
  border: string
  ring: string
}

export type TokenResult = { light: TokenSet; dark: TokenSet }

function pickForeground(against: string, a: ColorStep, b: ColorStep): string {
  return wcagContrast(against, a.hex) >= wcagContrast(against, b.hex) ? a.oklch : b.oklch
}

function deriveSet(
  p: ColorStep[],
  ng: ColorStep[],
  tg: ColorStep[],
  bg: ColorStep,
  ap: ColorStep[] | undefined,
  sp: ColorStep[] | undefined,
): TokenSet {
  return {
    background: bg.oklch,
    foreground: p[11].oklch,
    card: tg[1].oklch,
    'card-foreground': p[11].oklch,
    primary: p[8].oklch,
    'primary-foreground': pickForeground(p[8].hex, p[0], p[11]),
    secondary: sp ? sp[2].oklch : tg[2].oklch,
    'secondary-foreground': sp ? sp[10].oklch : tg[10].oklch,
    muted: ng[2].oklch,
    'muted-foreground': ng[10].oklch,
    accent: ap ? ap[2].oklch : tg[2].oklch,
    'accent-foreground': ap ? ap[11].oklch : p[11].oklch,
    border: tg[5].oklch,
    ring: p[7].oklch,
  }
}

export function buildTokens(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
  accentPalette?: PaletteResult,
  secondaryPalette?: PaletteResult,
): TokenResult {
  return {
    light: deriveSet(
      palette.light, neutralGray.light, tintedGray.light,
      background.light, accentPalette?.light, secondaryPalette?.light,
    ),
    dark: deriveSet(
      palette.dark, neutralGray.dark, tintedGray.dark,
      background.dark, accentPalette?.dark, secondaryPalette?.dark,
    ),
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test
```

Expected: all tests pass, including the new `buildTokens` describe block.

- [ ] **Step 5: Commit**

```bash
git add src/lib/buildTokens.ts src/__tests__/exportBuilders.test.ts
git commit -m "feat: add buildTokens to derive semantic token objects from palette data"
```

---

## Task 3: Refactor `buildShadcn` to use `buildTokens`

**Files:**
- Modify: `src/components/ExportPanel.tsx`

The current `buildShadcn` has an inline `pick` helper and a `vars()` closure that re-derives the same token mapping already in `buildTokens`. Replace both with a call to `buildTokens`.

- [ ] **Step 1: Verify existing `buildShadcn` tests still pass before touching anything**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test -- --reporter=verbose 2>&1 | grep -E "buildShadcn|PASS|FAIL"
```

Expected: all `buildShadcn` tests pass.

- [ ] **Step 2: Replace `buildShadcn` in `src/components/ExportPanel.tsx`**

Remove the `pick` helper and the `vars` closure from `buildShadcn`, and replace the entire function body with one that calls `buildTokens`. The import for `wcagContrast` should also be removed from the top of the file since `buildTokens` now owns that logic.

Replace the top three import lines:
```ts
// before
import { useCallback, useEffect, useRef, useState } from 'react'
import { wcagContrast } from 'culori'
import type { PaletteResult, BackgroundResult, ColorStep } from '../lib/generatePalette'
```
```ts
// after — remove the culori import entirely (wcagContrast moves to buildTokens);
// remove ColorStep (no longer needed in ExportPanel after pick() is deleted)
import { useCallback, useEffect, useRef, useState } from 'react'
import { buildTokens, type TokenSet } from '../lib/buildTokens'
import type { PaletteResult, BackgroundResult } from '../lib/generatePalette'
```

Replace the entire `buildShadcn` function (lines 110–158 in the original file) with:

```ts
function shadcnVars(tokens: TokenSet): string[] {
  return [
    `    --background: ${tokens.background};`,
    `    --foreground: ${tokens.foreground};`,
    `    --card: ${tokens.card};`,
    `    --card-foreground: ${tokens['card-foreground']};`,
    `    --popover: ${tokens.background};`,
    `    --popover-foreground: ${tokens.foreground};`,
    `    --primary: ${tokens.primary};`,
    `    --primary-foreground: ${tokens['primary-foreground']};`,
    `    --secondary: ${tokens.secondary};`,
    `    --secondary-foreground: ${tokens['secondary-foreground']};`,
    `    --muted: ${tokens.muted};`,
    `    --muted-foreground: ${tokens['muted-foreground']};`,
    `    --accent: ${tokens.accent};`,
    `    --accent-foreground: ${tokens['accent-foreground']};`,
    `    --border: ${tokens.border};`,
    `    --input: ${tokens.border};`,
    `    --ring: ${tokens.ring};`,
  ]
}

export function buildShadcn(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
  accentPalette?: PaletteResult,
  secondaryPalette?: PaletteResult,
): string {
  const tokens = buildTokens(palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette)
  return [
    '@layer base {',
    '  :root {',
    ...shadcnVars(tokens.light),
    '  }',
    '  .dark {',
    ...shadcnVars(tokens.dark),
    '  }',
    '}',
  ].join('\n')
}
```

Also remove the now-unused `ColorStep` type import since `buildShadcn` no longer references it directly. The `buildCss` and `buildJson` functions still use `ColorStep` via their own logic, so keep it if still referenced — check and remove only if unused.

- [ ] **Step 3: Run all tests to confirm nothing broke**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test
```

Expected: all tests pass. The `buildShadcn` describe blocks must still pass, including the token-value assertions (`--secondary: ${secondaryPalette.light[2].oklch}` etc.).

- [ ] **Step 4: Commit**

```bash
git add src/components/ExportPanel.tsx
git commit -m "refactor: buildShadcn uses buildTokens for token derivation"
```

---

## Task 4: Create `ComponentKit`

**Files:**
- Create: `src/components/ComponentKit.tsx`

No unit tests — this is a pure rendering component with no testable pure logic.

- [ ] **Step 1: Create `src/components/ComponentKit.tsx`**

```tsx
import { useState } from 'react'
import type { TokenSet } from '../lib/buildTokens'

type Props = {
  id: string
  tokens: TokenSet
  label: string
}

const TABS = ['Overview', 'Activity', 'Settings']

export function ComponentKit({ id, tokens, label }: Props) {
  const [activeTab, setActiveTab] = useState(0)

  const vars = {
    '--preview-bg': tokens.background,
    '--preview-fg': tokens.foreground,
    '--preview-card': tokens.card,
    '--preview-primary': tokens.primary,
    '--preview-primary-fg': tokens['primary-foreground'],
    '--preview-secondary': tokens.secondary,
    '--preview-secondary-fg': tokens['secondary-foreground'],
    '--preview-muted': tokens.muted,
    '--preview-muted-fg': tokens['muted-foreground'],
    '--preview-accent': tokens.accent,
    '--preview-accent-fg': tokens['accent-foreground'],
    '--preview-border': tokens.border,
    '--preview-ring': tokens.ring,
  } as React.CSSProperties

  return (
    <div id={id} style={{ ...vars, background: 'var(--preview-bg)', padding: '28px' }}>
      <style>{`
        #${id} .pk-btn:hover:not(:disabled) { filter: brightness(0.88); }
        #${id} .pk-btn-ghost:hover:not(:disabled) { filter: none; background: var(--preview-muted); }
        #${id} .pk-input:focus { outline: none; border-color: var(--preview-ring); box-shadow: 0 0 0 3px color-mix(in oklch, var(--preview-ring) 25%, transparent); }
        #${id} .pk-tab:hover:not(.pk-tab-active) { color: var(--preview-fg); }
        #${id} .pk-link:hover { opacity: 0.75; }
      `}</style>

      {/* Mode label */}
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px', opacity: 0.35, color: 'var(--preview-fg)' }}>
        {label}
      </div>

      {/* Button */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--preview-muted-fg)', marginBottom: '10px' }}>Button</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="pk-btn" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: 'var(--preview-primary)', color: 'var(--preview-primary-fg)', transition: 'filter 0.15s' }}>Primary</button>
          <button className="pk-btn" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: 'var(--preview-secondary)', color: 'var(--preview-secondary-fg)', transition: 'filter 0.15s' }}>Secondary</button>
          <button className="pk-btn" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1.5px solid var(--preview-border)', color: 'var(--preview-fg)', transition: 'filter 0.15s' }}>Outline</button>
          <button className="pk-btn pk-btn-ghost" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--preview-muted-fg)', transition: 'background 0.15s' }}>Ghost</button>
          <button disabled style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'not-allowed', background: 'var(--preview-primary)', color: 'var(--preview-primary-fg)', opacity: 0.4 }}>Disabled</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--preview-muted-fg)', marginBottom: '10px' }}>Tabs</div>
        <div style={{ display: 'flex', gap: '2px', borderBottom: '1.5px solid var(--preview-border)' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`pk-tab${activeTab === i ? ' pk-tab-active' : ''}`}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === i ? '2px solid var(--preview-primary)' : '2px solid transparent',
                marginBottom: '-1.5px',
                cursor: 'pointer',
                color: activeTab === i ? 'var(--preview-primary)' : 'var(--preview-muted-fg)',
                transition: 'color 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--preview-muted-fg)', marginBottom: '10px' }}>Inputs</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            className="pk-input"
            placeholder="Enter value…"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--preview-border)', background: 'var(--preview-bg)', color: 'var(--preview-fg)', fontSize: '13px', width: '200px', transition: 'border-color 0.15s, box-shadow 0.15s' }}
          />
          <input
            disabled
            placeholder="Disabled"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--preview-border)', background: 'var(--preview-bg)', color: 'var(--preview-fg)', fontSize: '13px', width: '200px', opacity: 0.45, cursor: 'not-allowed' }}
          />
        </div>
      </div>

      {/* Card */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--preview-muted-fg)', marginBottom: '10px' }}>Card</div>
        <div style={{ background: 'var(--preview-card)', border: '1px solid var(--preview-border)', borderRadius: '12px', padding: '16px 20px', maxWidth: '340px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--preview-fg)', marginBottom: '4px' }}>Color Palette</div>
          <div style={{ fontSize: '13px', color: 'var(--preview-muted-fg)', lineHeight: 1.5 }}>
            A 12-step Radix-style scale generated from your brand color.{' '}
            <a className="pk-link" style={{ color: 'var(--preview-primary)', textDecoration: 'underline', cursor: 'pointer', transition: 'opacity 0.15s' }}>Learn more</a>
          </div>
          <span style={{ display: 'inline-block', marginTop: '10px', padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: 'var(--preview-accent)', color: 'var(--preview-accent-fg)' }}>New</span>
        </div>
      </div>

      {/* Typography */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--preview-muted-fg)', marginBottom: '10px' }}>Typography</div>
        <div style={{ fontSize: '14px', color: 'var(--preview-fg)', lineHeight: 1.6 }}>
          Heading text in foreground color.<br />
          <span style={{ color: 'var(--preview-muted-fg)' }}>Muted supporting text sits below the primary content.</span><br />
          <a className="pk-link" style={{ color: 'var(--preview-primary)', textDecoration: 'underline', cursor: 'pointer', transition: 'opacity 0.15s' }}>Inline link example</a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test
```

Expected: all tests still pass (ComponentKit has no unit tests; this step catches import/type errors caught at test compile time).

- [ ] **Step 3: Commit**

```bash
git add src/components/ComponentKit.tsx
git commit -m "feat: add ComponentKit with interactive component showcase"
```

---

## Task 5: Create `PreviewPanel`

**Files:**
- Create: `src/components/PreviewPanel.tsx`

- [ ] **Step 1: Create `src/components/PreviewPanel.tsx`**

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
}

export function PreviewPanel({ palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette }: Props) {
  const tokens = useMemo(
    () => buildTokens(palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette),
    [palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette],
  )

  return (
    <section style={{ padding: '0 32px 32px' }}>
      <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)' }}>
          Live Preview
        </div>
        <ComponentKit id="preview-light" tokens={tokens.light} label="Light" />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <ComponentKit id="preview-dark" tokens={tokens.dark} label="Dark" />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/PreviewPanel.tsx
git commit -m "feat: add PreviewPanel wrapping light and dark ComponentKit panes"
```

---

## Task 6: Wire `PreviewPanel` into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

The preview must sit outside (after) the `max-w-2xl` column. The outer `div` currently has `p-8` which applies to the entire page. Move `p-8` into the inner column `div` only, so the full-width `PreviewPanel` handles its own horizontal padding.

- [ ] **Step 1: Update `src/App.tsx`**

Replace the entire file content with:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { ColorInput } from './components/ColorInput'
import { ExportPanel } from './components/ExportPanel'
import { HarmonySuggestions } from './components/HarmonySuggestions'
import { PaletteScale } from './components/PaletteScale'
import { BackgroundSwatch } from './components/BackgroundSwatch'
import { PreviewPanel } from './components/PreviewPanel'
import {
  generatePalette,
  generateGrayPalettes,
  generateBackground,
  generateHarmonies,
} from './lib/generatePalette'

const DEFAULT_COLOR = '#3D63DD'

export default function App() {
  const [color, setColor] = useState(DEFAULT_COLOR)

  const palette = useMemo(() => {
    try { return generatePalette(color) }
    catch { return generatePalette(DEFAULT_COLOR) }
  }, [color])

  const grays = useMemo(() => {
    try { return generateGrayPalettes(color) }
    catch { return generateGrayPalettes(DEFAULT_COLOR) }
  }, [color])

  const background = useMemo(() => {
    try { return generateBackground(palette, grays) }
    catch { return generateBackground(generatePalette(DEFAULT_COLOR), generateGrayPalettes(DEFAULT_COLOR)) }
  }, [palette, grays])

  const harmonies = useMemo(() => {
    try { return generateHarmonies(color) }
    catch { return generateHarmonies(DEFAULT_COLOR) }
  }, [color])

  const [selectedAccentIdx, setSelectedAccentIdx] = useState(0)
  const [selectedSecondaryIdx, setSelectedSecondaryIdx] = useState(0)

  useEffect(() => {
    setSelectedAccentIdx(0)
    setSelectedSecondaryIdx(0)
  }, [color])

  const accentPalette    = harmonies.accent[selectedAccentIdx]?.palette
  const secondaryPalette = harmonies.secondary[selectedSecondaryIdx]?.palette

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-2xl mx-auto flex flex-col gap-8 p-8">
        <div>
          <h1 className="text-base font-semibold mb-0.5">Color Palette Generator</h1>
          <p className="text-sm text-white/30">Generate a 12-step Radix-style color scale</p>
        </div>
        <ColorInput value={color} onChange={setColor} />
        <PaletteScale steps={palette.light} mode="light" />
        <PaletteScale steps={palette.dark} mode="dark" showLegend />

        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
            Neutral Gray
          </h2>
          <PaletteScale steps={grays.neutral.light} mode="light" />
          <PaletteScale steps={grays.neutral.dark} mode="dark" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
            Tinted Gray
          </h2>
          <PaletteScale steps={grays.tinted.light} mode="light" />
          <PaletteScale steps={grays.tinted.dark} mode="dark" showLegend />
        </div>

        <HarmonySuggestions
          harmonies={harmonies}
          selectedAccent={selectedAccentIdx}
          selectedSecondary={selectedSecondaryIdx}
          onSelectAccent={setSelectedAccentIdx}
          onSelectSecondary={setSelectedSecondaryIdx}
        />

        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
            AA Background
          </h2>
          <BackgroundSwatch
            result={background}
            foregroundLight={palette.light[11]}
            foregroundDark={palette.dark[11]}
          />
        </div>

        <ExportPanel
          palette={palette}
          neutralGray={grays.neutral}
          tintedGray={grays.tinted}
          background={background}
          accentPalette={accentPalette}
          secondaryPalette={secondaryPalette}
        />
      </div>

      <PreviewPanel
        palette={palette}
        neutralGray={grays.neutral}
        tintedGray={grays.tinted}
        background={background}
        accentPalette={accentPalette}
        secondaryPalette={secondaryPalette}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test
```

Expected: all tests pass.

- [ ] **Step 3: Start the dev server and verify visually**

```bash
cd /home/oz/Projects/Personal/colorizit && npm run dev
```

Open the app in a browser and check:
- The live preview panel appears below the export panel, full-width
- Light pane is on top, dark pane below, each with a "LIGHT" / "DARK" label
- All five rows appear in both panes: Button, Tabs, Inputs, Card, Typography
- Changing the color input updates all components in both panes in real time
- Clicking a harmony suggestion (accent/secondary) also updates the preview
- Clicking tabs in the preview switches the active tab locally
- Focusing an input shows the ring color from the palette
- Hovering buttons shows a brightness change

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire PreviewPanel into App outside the max-w-2xl column"
```
