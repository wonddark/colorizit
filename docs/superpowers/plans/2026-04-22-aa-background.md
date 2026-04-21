# AA Background Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Given the generated primary palette and gray palettes, compute a light and dark background color that achieves at least WCAG AA contrast (4.5:1) against primary step 12 ("High-contrast text"), display it as a swatch, and include it in the CSS/JSON export.

**Architecture:** A new `generateBackground(palette, grays)` pure function in `generatePalette.ts` tries neutral gray step 1 then tinted gray step 1 (using culori's `wcagContrast`); if neither passes 4.5:1, a binary search over OKLCH lightness finds a valid boundary color. A new `BackgroundSwatch` component displays both mode results with live sample text. `ExportPanel` gains a `background` prop and appends `--bg-light`/`--bg-dark` CSS vars and a `background` JSON key.

**Tech Stack:** TypeScript, React, culori (`wcagContrast`, OKLCH), Vitest

---

## File Map

| File | Change |
|---|---|
| `src/lib/generatePalette.ts` | Add `BackgroundSource`, `BackgroundColor`, `BackgroundResult` types; add `generateBackground()` |
| `src/__tests__/generatePalette.test.ts` | Add `describe('generateBackground', ...)` block |
| `src/components/BackgroundSwatch.tsx` | New component — two-card swatch with sample text, contrast badge, source label |
| `src/App.tsx` | Add `background` memo, render "AA Background" section; update ExportPanel call |
| `src/components/ExportPanel.tsx` | Add `background` prop; extend `buildCss`/`buildJson` signatures and bodies |
| `src/__tests__/exportBuilders.test.ts` | Update all `buildCss`/`buildJson` calls to include `background`; add new assertions |

---

## Task 1: Add `generateBackground` to `generatePalette.ts`

**Files:**
- Modify: `src/lib/generatePalette.ts`
- Modify: `src/__tests__/generatePalette.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/__tests__/generatePalette.test.ts` (update the existing import on line 3 to include `generateBackground`, and add `wcagContrast` from culori):

```ts
import { describe, it, expect } from 'vitest'
import { wcagContrast, formatHex } from 'culori'
import { generatePalette, generateGrayPalettes, generateBackground } from '../lib/generatePalette'
import type { PaletteResult, ColorStep } from '../lib/generatePalette'
```

> **Note:** Replace the entire import block at the top of the test file with the above (it currently imports only `describe, it, expect` from vitest, `formatHex` from culori, and `generatePalette` from the lib). The existing `describe('generatePalette', ...)` block is unchanged.

Append this new describe block at the end of the file:

```ts
describe('generateBackground', () => {
  const palette = generatePalette('#3D63DD')
  const grays   = generateGrayPalettes('#3D63DD')
  const result  = generateBackground(palette, grays)

  it('returns BackgroundColor for both light and dark modes', () => {
    expect(result.light.hex).toMatch(/^#[0-9a-f]{6}$/i)
    expect(result.dark.hex).toMatch(/^#[0-9a-f]{6}$/i)
    expect(result.light.oklch).toMatch(/^oklch\(/)
    expect(result.dark.oklch).toMatch(/^oklch\(/)
  })

  it('light background achieves >= 4.5:1 against primary light step 12', () => {
    const ratio = wcagContrast(result.light.hex, palette.light[11].hex)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('dark background achieves >= 4.5:1 against primary dark step 12', () => {
    const ratio = wcagContrast(result.dark.hex, palette.dark[11].hex)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('source is neutral, tinted, or generated', () => {
    expect(['neutral', 'tinted', 'generated']).toContain(result.light.source)
    expect(['neutral', 'tinted', 'generated']).toContain(result.dark.source)
  })

  it('contrastRatio matches actual computed contrast to one decimal place', () => {
    const actualLight = Math.round(wcagContrast(result.light.hex, palette.light[11].hex) * 10) / 10
    const actualDark  = Math.round(wcagContrast(result.dark.hex,  palette.dark[11].hex)  * 10) / 10
    expect(result.light.contrastRatio).toBe(actualLight)
    expect(result.dark.contrastRatio).toBe(actualDark)
  })

  it('returns best-effort generated background when AA is physically unachievable', () => {
    // A near-white foreground (#d4d4d4) makes AA impossible against any lighter background
    const lightFg: ColorStep = { hex: '#d4d4d4', oklch: 'oklch(85% 0 0)' }
    const fakePalette: PaletteResult = {
      light: [...generatePalette('#3D63DD').light.slice(0, 11), lightFg],
      dark:  generatePalette('#3D63DD').dark,
    }
    const r = generateBackground(fakePalette, grays)
    // Neither neutral (#f9f9f9) nor tinted can achieve 4.5:1 against #d4d4d4
    expect(r.light.source).toBe('generated')
    expect(r.light.hex).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
```

- [ ] **Step 2: Run tests — verify failure**

```bash
npm test -- --reporter=verbose src/__tests__/generatePalette.test.ts
```

Expected: FAIL — `generateBackground is not a function` (import error).

- [ ] **Step 3: Implement in `generatePalette.ts`**

**3a.** Update the import line (line 1):

```ts
import { parse, converter, formatHex, clampChroma, wcagContrast } from 'culori'
```

**3b.** Append the following after the closing brace of `generatePalette` (at the very end of the file):

```ts
export type BackgroundSource = 'neutral' | 'tinted' | 'generated'

export type BackgroundColor = ColorStep & {
  source: BackgroundSource
  contrastRatio: number
}

export type BackgroundResult = {
  light: BackgroundColor
  dark:  BackgroundColor
}

function pickBackground(
  foregroundHex: string,
  candidate: ColorStep,
  source: 'neutral' | 'tinted',
): BackgroundColor | null {
  const ratio = wcagContrast(candidate.hex, foregroundHex)
  if (ratio >= 4.5) {
    return { ...candidate, source, contrastRatio: Math.round(ratio * 10) / 10 }
  }
  return null
}

function binarySearchBackground(
  foregroundHex: string,
  mode: 'light' | 'dark',
  tintedStep: ColorStep,
): BackgroundColor {
  const tintedOklch = toOklch(parse(tintedStep.hex)!)
  const rawH = tintedOklch?.h
  const rawC = tintedOklch?.c ?? 0
  const hasHue = rawH !== undefined && !isNaN(rawH)
  const searchH = hasHue ? rawH! : 0
  const searchC = hasHue ? rawC : 0

  let lo = mode === 'light' ? GRAY_LIGHT_STEPS[0].l : 0.0
  let hi = mode === 'light' ? 1.0 : GRAY_DARK_STEPS[0].l

  // Start with the extreme (lightest for light mode, darkest for dark mode)
  let bestStep = buildStep(mode === 'light' ? hi : lo, searchC, searchH)

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    const candidate = buildStep(mid, searchC, searchH)
    const ratio = wcagContrast(candidate.hex, foregroundHex)
    if (ratio >= 4.5) {
      bestStep = candidate
      // Narrow toward step 1 (less extreme) while still passing
      if (mode === 'light') hi = mid
      else lo = mid
    } else {
      // Need to go more extreme
      if (mode === 'light') lo = mid
      else hi = mid
    }
  }

  const finalRatio = wcagContrast(bestStep.hex, foregroundHex)
  return { ...bestStep, source: 'generated', contrastRatio: Math.round(finalRatio * 10) / 10 }
}

export function generateBackground(
  palette: PaletteResult,
  grays: GrayPalettes,
): BackgroundResult {
  const compute = (mode: 'light' | 'dark'): BackgroundColor => {
    const fg = palette[mode][11].hex
    return (
      pickBackground(fg, grays.neutral[mode][0], 'neutral') ??
      pickBackground(fg, grays.tinted[mode][0], 'tinted') ??
      binarySearchBackground(fg, mode, grays.tinted[mode][0])
    )
  }
  return { light: compute('light'), dark: compute('dark') }
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
npm test -- --reporter=verbose src/__tests__/generatePalette.test.ts
```

Expected: all tests pass (22 existing + 6 new = 28 total in this file).

- [ ] **Step 5: Commit**

```bash
git add src/lib/generatePalette.ts src/__tests__/generatePalette.test.ts
git commit -m "feat: add generateBackground with AA contrast fallback chain"
```

---

## Task 2: Create `BackgroundSwatch` and update `App.tsx`

**Files:**
- Create: `src/components/BackgroundSwatch.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/components/BackgroundSwatch.tsx`**

```tsx
import type { BackgroundResult, ColorStep } from '../lib/generatePalette'

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

function sourceLabel(source: BackgroundResult['light']['source']): string {
  if (source === 'generated') return 'generated'
  return `from ${source} gray`
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
        <p className="text-[10px] text-white/30 mt-1.5">{sourceLabel(result.light.source)}</p>
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
        <p className="text-[10px] text-white/30 mt-1.5">{sourceLabel(result.dark.source)}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `src/App.tsx`**

Replace the entire file with:

```tsx
import { useMemo, useState } from 'react'
import { ColorInput } from './components/ColorInput'
import { ExportPanel } from './components/ExportPanel'
import { PaletteScale } from './components/PaletteScale'
import { BackgroundSwatch } from './components/BackgroundSwatch'
import { generatePalette, generateGrayPalettes, generateBackground } from './lib/generatePalette'

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

  return (
    <div className="min-h-screen bg-[#111] text-white p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
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
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: TypeScript errors on `ExportPanel` — missing `background` prop. This is intentional and fixed in Task 3.

- [ ] **Step 4: Do NOT commit yet** — this is bundled into Task 3's commit.

---

## Task 3: Update `ExportPanel.tsx` and its tests

**Files:**
- Modify: `src/components/ExportPanel.tsx`
- Modify: `src/__tests__/exportBuilders.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace the entire `src/__tests__/exportBuilders.test.ts` with:

```ts
import { describe, it, expect } from 'vitest'
import { buildCss, buildJson } from '../components/ExportPanel'
import { generatePalette, generateGrayPalettes, generateBackground } from '../lib/generatePalette'

const palette    = generatePalette('#3D63DD')
const { neutral, tinted } = generateGrayPalettes('#3D63DD')
const background = generateBackground(palette, { neutral, tinted })

describe('buildCss', () => {
  it('includes primary light vars', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).toContain('--color-1:')
    expect(css).toContain('--color-12:')
  })

  it('includes primary dark vars', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).toContain('--color-dark-1:')
    expect(css).toContain('--color-dark-12:')
  })

  it('includes neutral gray light and dark vars', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).toContain('--gray-1:')
    expect(css).toContain('--gray-12:')
    expect(css).toContain('--gray-dark-1:')
    expect(css).toContain('--gray-dark-12:')
  })

  it('includes tinted gray light and dark vars', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).toContain('--gray-tinted-1:')
    expect(css).toContain('--gray-tinted-12:')
    expect(css).toContain('--gray-tinted-dark-1:')
    expect(css).toContain('--gray-tinted-dark-12:')
  })

  it('includes --bg-light and --bg-dark vars', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).toContain('--bg-light:')
    expect(css).toContain('--bg-dark:')
  })

  it('wraps everything in :root {}', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css.trimStart().startsWith(':root {')).toBe(true)
    expect(css.trimEnd().endsWith('}')).toBe(true)
  })
})

describe('buildJson', () => {
  it('includes top-level light and dark keys with 12 entries each', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(Object.keys(json.light)).toHaveLength(12)
    expect(Object.keys(json.dark)).toHaveLength(12)
  })

  it('includes neutralGray.light and neutralGray.dark with 12 entries each', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(Object.keys(json.neutralGray.light)).toHaveLength(12)
    expect(Object.keys(json.neutralGray.dark)).toHaveLength(12)
  })

  it('includes tintedGray.light and tintedGray.dark with 12 entries each', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(Object.keys(json.tintedGray.light)).toHaveLength(12)
    expect(Object.keys(json.tintedGray.dark)).toHaveLength(12)
  })

  it('all hex values in neutralGray are valid hex strings', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    for (const hex of Object.values<string>(json.neutralGray.light)) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('includes background.light and background.dark', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(json.background).toHaveProperty('light')
    expect(json.background).toHaveProperty('dark')
  })

  it('background entries have hex, contrastRatio, and source', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(json.background.light).toHaveProperty('hex')
    expect(json.background.light).toHaveProperty('contrastRatio')
    expect(json.background.light).toHaveProperty('source')
    expect(json.background.dark).toHaveProperty('hex')
    expect(json.background.dark).toHaveProperty('contrastRatio')
    expect(json.background.dark).toHaveProperty('source')
  })
})
```

- [ ] **Step 2: Run tests — verify failure**

```bash
npm test -- --reporter=verbose src/__tests__/exportBuilders.test.ts
```

Expected: FAIL — `buildCss`/`buildJson` called with 4 args but signature only accepts 3. TypeScript compile error or runtime mismatch depending on how Vitest handles it.

- [ ] **Step 3: Replace `src/components/ExportPanel.tsx`**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PaletteResult, BackgroundResult } from '../lib/generatePalette'

type Tab = 'css' | 'json'

export function buildCss(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
): string {
  const lines: string[] = [':root {', '  /* Primary — Light */']
  palette.light.forEach((step, i) => {
    lines.push(`  --color-${i + 1}: ${step.oklch};`)
  })
  lines.push('')
  lines.push('  /* Primary — Dark */')
  palette.dark.forEach((step, i) => {
    lines.push(`  --color-dark-${i + 1}: ${step.oklch};`)
  })
  lines.push('')
  lines.push('  /* Neutral Gray — Light */')
  neutralGray.light.forEach((step, i) => {
    lines.push(`  --gray-${i + 1}: ${step.oklch};`)
  })
  lines.push('')
  lines.push('  /* Neutral Gray — Dark */')
  neutralGray.dark.forEach((step, i) => {
    lines.push(`  --gray-dark-${i + 1}: ${step.oklch};`)
  })
  lines.push('')
  lines.push('  /* Tinted Gray — Light */')
  tintedGray.light.forEach((step, i) => {
    lines.push(`  --gray-tinted-${i + 1}: ${step.oklch};`)
  })
  lines.push('')
  lines.push('  /* Tinted Gray — Dark */')
  tintedGray.dark.forEach((step, i) => {
    lines.push(`  --gray-tinted-dark-${i + 1}: ${step.oklch};`)
  })
  lines.push('')
  lines.push('  /* AA Background */')
  lines.push(`  --bg-light: ${background.light.oklch};`)
  lines.push(`  --bg-dark: ${background.dark.oklch};`)
  lines.push('}')
  return lines.join('\n')
}

export function buildJson(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
): string {
  return JSON.stringify(
    {
      light: Object.fromEntries(palette.light.map((s, i) => [String(i + 1), s.hex])),
      dark:  Object.fromEntries(palette.dark.map((s, i)  => [String(i + 1), s.hex])),
      neutralGray: {
        light: Object.fromEntries(neutralGray.light.map((s, i) => [String(i + 1), s.hex])),
        dark:  Object.fromEntries(neutralGray.dark.map((s, i)  => [String(i + 1), s.hex])),
      },
      tintedGray: {
        light: Object.fromEntries(tintedGray.light.map((s, i) => [String(i + 1), s.hex])),
        dark:  Object.fromEntries(tintedGray.dark.map((s, i)  => [String(i + 1), s.hex])),
      },
      background: {
        light: { hex: background.light.hex, contrastRatio: background.light.contrastRatio, source: background.light.source },
        dark:  { hex: background.dark.hex,  contrastRatio: background.dark.contrastRatio,  source: background.dark.source  },
      },
    },
    null,
    2,
  )
}

type Props = {
  palette: PaletteResult
  neutralGray: PaletteResult
  tintedGray: PaletteResult
  background: BackgroundResult
}

export function ExportPanel({ palette, neutralGray, tintedGray, background }: Props) {
  const [tab, setTab] = useState<Tab>('css')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const content = tab === 'css'
    ? buildCss(palette, neutralGray, tintedGray, background)
    : buildJson(palette, neutralGray, tintedGray, background)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }, [content])

  return (
    <div>
      <div className="flex gap-0.5 mb-0">
        {(['css', 'json'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border transition-colors ${
              tab === t
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-transparent border-transparent text-white/30 hover:text-white/50'
            }`}
          >
            {t === 'css' ? 'CSS Variables' : 'JSON'}
          </button>
        ))}
      </div>

      <div className="relative bg-white/5 border border-white/10 rounded-b-xl rounded-tr-xl p-4">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 px-3 py-1.5 text-[11px] font-semibold bg-white/10 hover:bg-white/15 border border-white/10 rounded-md text-white/60 hover:text-white transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <pre className="text-[11px] font-mono text-white/50 overflow-auto max-h-52 leading-relaxed whitespace-pre pr-16">
          {content}
        </pre>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run export builder tests — verify pass**

```bash
npm test -- --reporter=verbose src/__tests__/exportBuilders.test.ts
```

Expected: all 11 tests pass.

- [ ] **Step 5: Run full test suite — verify no regressions**

```bash
npm test
```

Expected: all tests pass (2 test files, 31 tests total — 19 in generatePalette.test.ts, 12 in exportBuilders.test.ts).

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/BackgroundSwatch.tsx src/components/ExportPanel.tsx src/__tests__/exportBuilders.test.ts
git commit -m "feat: add AA background swatch and export support"
```
