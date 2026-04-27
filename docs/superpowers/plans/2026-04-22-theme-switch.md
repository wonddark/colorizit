# Theme Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a light/dark theme toggle that switches the app chrome between a fixed dark (#111) and a palette-tinted light surface, persisted to localStorage.

**Architecture:** A new `buildAppVars(theme, palette)` pure function returns 8 `--app-*` CSS vars (dark = constants, light = palette.light steps). `App.tsx` owns theme state, computes vars via `useMemo`, and sets them as inline styles on the outer wrapper so they cascade to all children. Existing components swap hardcoded dark Tailwind classes for `var(--app-*)` references. The toggle button lives inside `ColorInput`, which receives `theme` and `onToggleTheme` as new props.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, vitest

---

## File Map

| Status | File | Change |
|--------|------|--------|
| Create | `src/lib/buildAppVars.ts` | Pure fn returning 8 `--app-*` CSS vars from theme + palette |
| Create | `src/__tests__/buildAppVars.test.ts` | Tests for `buildAppVars` |
| Modify | `src/App.tsx` | theme state, toggleTheme, appVars useMemo, outer wrapper, ColorInput props |
| Modify | `src/components/ColorInput.tsx` | New props, toggle button with SVG icons, class swaps |
| Modify | `src/components/PaletteScale.tsx` | Class swaps |
| Modify | `src/components/BackgroundSwatch.tsx` | Class swaps |
| Modify | `src/components/HarmonySuggestions.tsx` | Class swaps |
| Modify | `src/components/ExportPanel.tsx` | Class swaps |
| Modify | `src/components/PreviewPanel.tsx` | Inline style swaps |

---

## Task 1: Create `buildAppVars` with tests

**Files:**
- Create: `src/lib/buildAppVars.ts`
- Create: `src/__tests__/buildAppVars.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/buildAppVars.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildAppVars } from '../lib/buildAppVars'
import { generatePalette } from '../lib/generatePalette'

const palette = generatePalette('#3D63DD')

describe('buildAppVars', () => {
  it('dark mode returns exactly 8 vars', () => {
    const vars = buildAppVars('dark', palette)
    expect(Object.keys(vars)).toHaveLength(8)
  })

  it('dark mode --app-bg is #111111', () => {
    const vars = buildAppVars('dark', palette)
    expect(vars['--app-bg']).toBe('#111111')
  })

  it('dark mode --app-fg is #ffffff', () => {
    const vars = buildAppVars('dark', palette)
    expect(vars['--app-fg']).toBe('#ffffff')
  })

  it('dark mode vars are identical regardless of palette', () => {
    const v1 = buildAppVars('dark', palette)
    const v2 = buildAppVars('dark', generatePalette('#ff6600'))
    expect(v1).toEqual(v2)
  })

  it('light mode returns exactly 8 vars', () => {
    const vars = buildAppVars('light', palette)
    expect(Object.keys(vars)).toHaveLength(8)
  })

  it('light mode --app-bg uses palette.light[0].hex', () => {
    const vars = buildAppVars('light', palette)
    expect(vars['--app-bg']).toBe(palette.light[0].hex)
  })

  it('light mode --app-fg uses palette.light[11].hex', () => {
    const vars = buildAppVars('light', palette)
    expect(vars['--app-fg']).toBe(palette.light[11].hex)
  })

  it('light mode --app-border uses palette.light[5].hex', () => {
    const vars = buildAppVars('light', palette)
    expect(vars['--app-border']).toBe(palette.light[5].hex)
  })

  it('light mode --app-surface uses palette.light[1].hex', () => {
    const vars = buildAppVars('light', palette)
    expect(vars['--app-surface']).toBe(palette.light[1].hex)
  })

  it('light mode vars change when palette changes', () => {
    const v1 = buildAppVars('light', palette)
    const v2 = buildAppVars('light', generatePalette('#ff6600'))
    expect(v1['--app-bg']).not.toBe(v2['--app-bg'])
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test
```

Expected: 10 new failures in `buildAppVars.test.ts` — "Cannot find module '../lib/buildAppVars'". All existing tests (64) still pass.

- [ ] **Step 3: Create `src/lib/buildAppVars.ts`**

```ts
import type { PaletteResult } from './generatePalette'

export type AppVars = Record<string, string>

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

export function buildAppVars(theme: 'light' | 'dark', palette: PaletteResult): AppVars {
  if (theme === 'dark') return DARK_VARS
  return {
    '--app-bg':            palette.light[0].hex,
    '--app-fg':            palette.light[11].hex,
    '--app-fg-muted':      palette.light[10].hex,
    '--app-fg-subtle':     palette.light[9].hex,
    '--app-surface':       palette.light[1].hex,
    '--app-surface-hover': palette.light[2].hex,
    '--app-border':        palette.light[5].hex,
    '--app-border-strong': palette.light[6].hex,
  }
}
```

- [ ] **Step 4: Run tests to confirm all pass**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test
```

Expected: 74 tests pass (64 existing + 10 new).

- [ ] **Step 5: Commit**

```bash
git -C /home/oz/Projects/Personal/colorizit add src/lib/buildAppVars.ts src/__tests__/buildAppVars.test.ts
git -C /home/oz/Projects/Personal/colorizit commit -m "feat: add buildAppVars to derive app chrome CSS vars from theme and palette"
```

---

## Task 2: Update `App.tsx` — theme state and CSS vars

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx` with the updated version**

```tsx
import { useEffect, useMemo, useState } from 'react'
import { ColorInput } from './components/ColorInput'
import { ExportPanel } from './components/ExportPanel'
import { HarmonySuggestions } from './components/HarmonySuggestions'
import { PaletteScale } from './components/PaletteScale'
import { BackgroundSwatch } from './components/BackgroundSwatch'
import { PreviewPanel } from './components/PreviewPanel'
import { buildAppVars } from './lib/buildAppVars'
import {
  generatePalette,
  generateGrayPalettes,
  generateBackground,
  generateHarmonies,
} from './lib/generatePalette'

const DEFAULT_COLOR = '#3D63DD'

export default function App() {
  const [color, setColor] = useState(DEFAULT_COLOR)

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

  const appVars = useMemo(
    () => buildAppVars(theme, palette),
    [theme, palette],
  )

  return (
    <div
      className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]"
      style={appVars as React.CSSProperties}
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-8 p-8">
        <div>
          <h1 className="text-base font-semibold mb-0.5">Color Palette Generator</h1>
          <p className="text-sm text-[var(--app-fg-muted)]">Generate a 12-step Radix-style color scale</p>
        </div>
        <ColorInput value={color} onChange={setColor} theme={theme} onToggleTheme={toggleTheme} />
        <PaletteScale steps={palette.light} mode="light" />
        <PaletteScale steps={palette.dark} mode="dark" showLegend />

        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)]">
            Neutral Gray
          </h2>
          <PaletteScale steps={grays.neutral.light} mode="light" />
          <PaletteScale steps={grays.neutral.dark} mode="dark" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)]">
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
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)]">
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

Expected: 74 tests pass. TypeScript will error on `ColorInput` until Task 3 is done — if it blocks tests, proceed to Task 3 first then return to verify.

- [ ] **Step 3: Commit**

```bash
git -C /home/oz/Projects/Personal/colorizit add src/App.tsx
git -C /home/oz/Projects/Personal/colorizit commit -m "feat: add theme state and appVars to App"
```

---

## Task 3: Update `ColorInput` — toggle button and class swaps

**Files:**
- Modify: `src/components/ColorInput.tsx`

- [ ] **Step 1: Replace `src/components/ColorInput.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { parse, formatHex } from 'culori'

type Props = {
  value: string
  onChange: (hex: string) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M11.2 4.8l-1.4 1.4M4.8 11.2l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 9.5A5.5 5.5 0 016 2.5a5.5 5.5 0 100 11 5.5 5.5 0 006.5-4z" fill="currentColor"/>
    </svg>
  )
}

function tryParseToHex(input: string): string | null {
  const parsed = parse(input.trim())
  return parsed ? (formatHex(parsed) ?? null) : null
}

export function ColorInput({ value, onChange, theme, onToggleTheme }: Props) {
  const [displayColor, setDisplayColor] = useState(value)
  const [text, setText] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setDisplayColor(value)
    setText(value)
  }, [value])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setDisplayColor(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), 150)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    clearTimeout(timerRef.current)
    setText(v)
    const hex = tryParseToHex(v)
    if (hex) onChange(hex)
  }

  const handleTextBlur = () => {
    const hex = tryParseToHex(text)
    if (!hex) setText(value)
  }

  return (
    <div className="flex items-center gap-3">
      <label className="cursor-pointer shrink-0">
        <input
          type="color"
          value={displayColor}
          onChange={handlePickerChange}
          className="sr-only"
        />
        <div
          className="w-11 h-11 rounded-xl border border-[var(--app-border)] shadow-md"
          style={{ background: displayColor }}
        />
      </label>
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        spellCheck={false}
        className="font-mono text-sm px-3 py-2 rounded-lg bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-fg)] w-32 focus:outline-none focus:border-[var(--app-border-strong)]"
      />
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
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test
```

Expected: 74 tests pass.

- [ ] **Step 3: Commit**

```bash
git -C /home/oz/Projects/Personal/colorizit add src/components/ColorInput.tsx
git -C /home/oz/Projects/Personal/colorizit commit -m "feat: add theme toggle button to ColorInput and swap dark classes"
```

---

## Task 4: Update `PaletteScale`, `BackgroundSwatch`, `HarmonySuggestions`

**Files:**
- Modify: `src/components/PaletteScale.tsx`
- Modify: `src/components/BackgroundSwatch.tsx`
- Modify: `src/components/HarmonySuggestions.tsx`

- [ ] **Step 1: Replace `src/components/PaletteScale.tsx`**

```tsx
import type { ColorStep } from '../lib/generatePalette'

const PURPOSES = [
  'App background',
  'Subtle background',
  'UI element bg',
  'Hovered UI element',
  'Active / selected',
  'Subtle border',
  'UI border',
  'Hovered border',
  'Solid background',
  'Hovered solid',
  'Low-contrast text',
  'High-contrast text',
]

type Props = {
  steps: ColorStep[]
  mode: 'light' | 'dark'
  showLegend?: boolean
}

export function PaletteScale({ steps, mode, showLegend }: Props) {
  return (
    <div>
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)] mb-2">
        {mode === 'light' ? 'Light' : 'Dark'}
      </h2>

      <div
        className="rounded-xl p-4"
        style={{ background: mode === 'light' ? '#ffffff' : '#111111' }}
      >
        <div className="flex gap-1">
          {steps.map((step, i) => {
            const useDarkLabel = mode === 'light' && i < 8
            return (
              <div
                key={i}
                className="group relative flex-1"
              >
                <div
                  className="h-16 rounded-md flex items-end justify-center pb-1.5"
                  style={{ background: step.hex }}
                >
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: useDarkLabel ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}
                  >
                    {i + 1}
                  </span>
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="text-white/50">{PURPOSES[i]}</div>
                  <div>{step.hex}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showLegend && (
        <div className="flex mt-2 text-[10px] text-[var(--app-fg-subtle)] font-medium">
          <span className="flex-[2]">Backgrounds</span>
          <span className="flex-[3]">UI elements</span>
          <span className="flex-[3]">Borders</span>
          <span className="flex-[2]">Solid</span>
          <span className="flex-[2] text-right">Text</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/components/BackgroundSwatch.tsx`**

```tsx
import type { BackgroundResult, BackgroundSource, ColorStep } from '../lib/generatePalette'

type Props = {
  result: BackgroundResult
  foregroundLight: ColorStep
  foregroundDark: ColorStep
}

function ContrastBadge({ ratio }: { ratio: number }) {
  const level = ratio >= 7 ? 'AAA' : 'AA'
  return (
    <span className="text-[11px] font-bold">
      {ratio.toFixed(1)}:1 ✓ {level}
    </span>
  )
}

function sourceLabel(source: BackgroundSource): string {
  switch (source) {
    case 'neutral':   return 'from neutral gray'
    case 'tinted':    return 'from tinted gray'
    case 'generated': return 'generated'
  }
}

export function BackgroundSwatch({ result, foregroundLight, foregroundDark }: Props) {
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <div
          className="rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 h-24"
          style={{ background: result.light.hex }}
        >
          <span
            className="text-3xl font-bold leading-none"
            style={{ color: foregroundLight.hex }}
          >
            Aa
          </span>
          <div style={{ color: foregroundLight.hex }}>
            <ContrastBadge ratio={result.light.contrastRatio} />
          </div>
        </div>
        <p className="text-[10px] text-[var(--app-fg-muted)] mt-1.5">{sourceLabel(result.light.source)}</p>
      </div>

      <div className="flex-1">
        <div
          className="rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 h-24"
          style={{ background: result.dark.hex }}
        >
          <span
            className="text-3xl font-bold leading-none"
            style={{ color: foregroundDark.hex }}
          >
            Aa
          </span>
          <div style={{ color: foregroundDark.hex }}>
            <ContrastBadge ratio={result.dark.contrastRatio} />
          </div>
        </div>
        <p className="text-[10px] text-[var(--app-fg-muted)] mt-1.5">{sourceLabel(result.dark.source)}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace `src/components/HarmonySuggestions.tsx`**

```tsx
import type { HarmonyResult } from '../lib/generatePalette'

type Props = {
  harmonies:         HarmonyResult
  selectedAccent:    number
  selectedSecondary: number
  onSelectAccent:    (i: number) => void
  onSelectSecondary: (i: number) => void
}

export function HarmonySuggestions({
  harmonies,
  selectedAccent,
  selectedSecondary,
  onSelectAccent,
  onSelectSecondary,
}: Props) {
  if (harmonies.accent.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)]">Accent</h2>
        <div className="flex gap-3">
          {harmonies.accent.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelectAccent(i)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`w-10 h-10 rounded-md transition-all ${
                  selectedAccent === i
                    ? 'ring-2 ring-[var(--app-fg)] ring-offset-2 ring-offset-[var(--app-bg)]'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: s.palette.light[8].hex }}
              />
              <span className="text-[10px] text-[var(--app-fg-muted)] group-hover:text-[var(--app-fg-subtle)] whitespace-nowrap">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)]">Secondary</h2>
        <div className="flex gap-3">
          {harmonies.secondary.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelectSecondary(i)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`w-10 h-10 rounded-md transition-all ${
                  selectedSecondary === i
                    ? 'ring-2 ring-[var(--app-fg)] ring-offset-2 ring-offset-[var(--app-bg)]'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: s.palette.light[8].hex }}
              />
              <span className="text-[10px] text-[var(--app-fg-muted)] group-hover:text-[var(--app-fg-subtle)] whitespace-nowrap">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test
```

Expected: 74 tests pass.

- [ ] **Step 5: Commit**

```bash
git -C /home/oz/Projects/Personal/colorizit add src/components/PaletteScale.tsx src/components/BackgroundSwatch.tsx src/components/HarmonySuggestions.tsx
git -C /home/oz/Projects/Personal/colorizit commit -m "feat: swap hardcoded dark classes for app vars in palette components"
```

---

## Task 5: Update `ExportPanel`

**Files:**
- Modify: `src/components/ExportPanel.tsx`

Only the JSX return value changes. The `buildCss`, `buildJson`, `buildShadcn`, `buildTokens` logic is untouched.

- [ ] **Step 1: Replace only the JSX return in `ExportPanel`**

Find and replace the `return (...)` block inside `ExportPanel` (starting at `return (` and ending at the closing `)`). The new return:

```tsx
  return (
    <div>
      <div className="flex gap-0.5 mb-0">
        {(['css', 'json', 'shadcn'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border transition-colors ${
              tab === t
                ? 'bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-fg)]'
                : 'bg-transparent border-transparent text-[var(--app-fg-muted)] hover:text-[var(--app-fg-subtle)]'
            }`}
          >
            {t === 'css' ? 'CSS Variables' : t === 'json' ? 'JSON' : 'shadcn/ui'}
          </button>
        ))}
      </div>

      <div className="relative bg-[var(--app-surface)] border border-[var(--app-border)] rounded-b-xl rounded-tr-xl p-4">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 px-3 py-1.5 text-[11px] font-semibold bg-[var(--app-surface-hover)] hover:bg-[var(--app-border)] border border-[var(--app-border)] rounded-md text-[var(--app-fg-muted)] hover:text-[var(--app-fg)] transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <pre className="text-[11px] font-mono text-[var(--app-fg-muted)] overflow-auto max-h-52 leading-relaxed whitespace-pre pr-16">
          {content}
        </pre>
      </div>
    </div>
  )
```

- [ ] **Step 2: Run tests**

```bash
cd /home/oz/Projects/Personal/colorizit && npm test
```

Expected: 74 tests pass.

- [ ] **Step 3: Commit**

```bash
git -C /home/oz/Projects/Personal/colorizit add src/components/ExportPanel.tsx
git -C /home/oz/Projects/Personal/colorizit commit -m "feat: swap hardcoded dark classes for app vars in ExportPanel"
```

---

## Task 6: Update `PreviewPanel` and verify visually

**Files:**
- Modify: `src/components/PreviewPanel.tsx`

- [ ] **Step 1: Replace `src/components/PreviewPanel.tsx`**

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
      <div style={{ borderRadius: '16px', border: '1px solid var(--app-border)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--app-fg-muted)', background: 'var(--app-surface)' }}>
          Live Preview
        </div>
        <ComponentKit id="preview-light" tokens={tokens.light} label="Light" />
        <div style={{ borderTop: '1px solid var(--app-border)' }}>
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

Expected: 74 tests pass.

- [ ] **Step 3: Start dev server and verify visually**

```bash
cd /home/oz/Projects/Personal/colorizit && npm run dev
```

Open the app and check:
- App renders in dark mode by default
- The sun icon button appears at the far right of the color input row
- Clicking it switches to light mode — background becomes a pale blue tint (from palette.light[0])
- All text, borders, surfaces update correctly
- Changing the color input in light mode updates the tinted background in real time
- Clicking the moon icon switches back to dark mode
- Refreshing the page preserves the chosen theme (localStorage)
- The "Live Preview" panel header and divider adopt the theme colors

- [ ] **Step 4: Commit**

```bash
git -C /home/oz/Projects/Personal/colorizit add src/components/PreviewPanel.tsx
git -C /home/oz/Projects/Personal/colorizit commit -m "feat: swap hardcoded inline styles for app vars in PreviewPanel"
```
