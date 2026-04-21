# Gray Palettes Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Given the user's primary color input, automatically generate and display two 12-step gray palettes (neutral and tinted) alongside the primary palette, and include both in the CSS/JSON export.

**Architecture:** A new `generateGrayPalettes(input)` function in `generatePalette.ts` derives both palettes from the primary color's hue using dedicated gray-specific lightness step tables. `App.tsx` calls this alongside the existing `generatePalette` and renders two new labeled sections. `ExportPanel` receives the gray palettes as additional props and its builder functions are updated to append the new CSS vars and JSON keys.

**Tech Stack:** TypeScript, React, culori (OKLCH color math), Vitest

---

## File Map

| File | Change |
|---|---|
| `src/lib/generatePalette.ts` | Add `GRAY_LIGHT_STEPS`, `GRAY_DARK_STEPS`, `GRAY_TINT_C`, `GrayPalettes` type, `generateGrayPalettes()` |
| `src/__tests__/generatePalette.test.ts` | Add `describe('generateGrayPalettes', ...)` block |
| `src/App.tsx` | Import `generateGrayPalettes`, add `grays` memo, render two new palette sections |
| `src/components/ExportPanel.tsx` | Export `buildCss`/`buildJson`, extend both signatures and bodies, update Props and call sites |
| `src/__tests__/exportBuilders.test.ts` | New test file for updated `buildCss` and `buildJson` |

---

## Task 1: Add `generateGrayPalettes` to `generatePalette.ts`

**Files:**
- Modify: `src/lib/generatePalette.ts`
- Modify: `src/__tests__/generatePalette.test.ts`

- [ ] **Step 1: Write the failing tests**

Append this `describe` block to `src/__tests__/generatePalette.test.ts`:

```ts
import { generatePalette, generateGrayPalettes } from '../lib/generatePalette'

describe('generateGrayPalettes', () => {
  it('returns neutral and tinted each with 12 light and 12 dark steps', () => {
    const { neutral, tinted } = generateGrayPalettes('#3D63DD')
    expect(neutral.light).toHaveLength(12)
    expect(neutral.dark).toHaveLength(12)
    expect(tinted.light).toHaveLength(12)
    expect(tinted.dark).toHaveLength(12)
  })

  it('each step has hex and oklch properties', () => {
    const { neutral, tinted } = generateGrayPalettes('#3D63DD')
    const allSteps = [
      ...neutral.light, ...neutral.dark,
      ...tinted.light,  ...tinted.dark,
    ]
    for (const step of allSteps) {
      expect(step.hex).toMatch(/^#[0-9a-f]{6}$/i)
      expect(step.oklch).toMatch(/^oklch\(/)
    }
  })

  it('neutral steps are achromatic (r ≈ g ≈ b)', () => {
    const { neutral } = generateGrayPalettes('#3D63DD')
    for (const step of [...neutral.light, ...neutral.dark]) {
      const hex = step.hex.toLowerCase()
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      expect(Math.abs(r - g)).toBeLessThanOrEqual(2)
      expect(Math.abs(g - b)).toBeLessThanOrEqual(2)
    }
  })

  it('tinted steps differ from neutral steps when input has a hue', () => {
    const { neutral, tinted } = generateGrayPalettes('#3D63DD')
    // At least one mid-range step should differ (the tint is subtle but present)
    const differs = neutral.light.some((s, i) => s.hex !== tinted.light[i].hex)
    expect(differs).toBe(true)
  })

  it('tinted falls back to neutral when input is achromatic', () => {
    const { neutral, tinted } = generateGrayPalettes('#808080')
    for (let i = 0; i < 12; i++) {
      expect(tinted.light[i].hex).toBe(neutral.light[i].hex)
      expect(tinted.dark[i].hex).toBe(neutral.dark[i].hex)
    }
  })

  it('throws on invalid input', () => {
    expect(() => generateGrayPalettes('not-a-color')).toThrow('Invalid color')
  })
})
```

- [ ] **Step 2: Run tests — verify failure**

```bash
npm test -- --reporter=verbose src/__tests__/generatePalette.test.ts
```

Expected: the new `describe` block fails with `generateGrayPalettes is not a function` (or similar import error).

- [ ] **Step 3: Implement in `generatePalette.ts`**

Add the following after the existing `DARK_STEPS` constant and before `ColorStep`:

```ts
const GRAY_LIGHT_STEPS = [
  { l: 0.992 },
  { l: 0.977 },
  { l: 0.957 },
  { l: 0.935 },
  { l: 0.912 },
  { l: 0.889 },
  { l: 0.855 },
  { l: 0.775 },
  { l: 0.604 },
  { l: 0.566 },
  { l: 0.450 },
  { l: 0.180 },
] as const

const GRAY_DARK_STEPS = [
  { l: 0.130 },
  { l: 0.163 },
  { l: 0.193 },
  { l: 0.225 },
  { l: 0.255 },
  { l: 0.285 },
  { l: 0.340 },
  { l: 0.430 },
  { l: 0.490 },
  { l: 0.547 },
  { l: 0.745 },
  { l: 0.955 },
] as const

const GRAY_TINT_C = [
  0.003, 0.004, 0.005, 0.006, 0.006, 0.007,
  0.007, 0.008, 0.006, 0.005, 0.004, 0.003,
] as const
```

Add the new exported type and function after `generatePalette`:

```ts
export type GrayPalettes = {
  neutral: PaletteResult
  tinted:  PaletteResult
}

export function generateGrayPalettes(input: string): GrayPalettes {
  const parsed = parse(input)
  if (!parsed) throw new Error(`Invalid color: ${input}`)

  const oklch = toOklch(parsed)
  const h = oklch?.h
  const hasHue = h !== undefined && !isNaN(h)

  return {
    neutral: {
      light: GRAY_LIGHT_STEPS.map(({ l }) => buildStep(l, 0, 0)),
      dark:  GRAY_DARK_STEPS.map(({ l }) => buildStep(l, 0, 0)),
    },
    tinted: {
      light: GRAY_LIGHT_STEPS.map(({ l }, i) =>
        buildStep(l, hasHue ? GRAY_TINT_C[i] : 0, hasHue ? h! : 0)),
      dark: GRAY_DARK_STEPS.map(({ l }, i) =>
        buildStep(l, hasHue ? GRAY_TINT_C[i] : 0, hasHue ? h! : 0)),
    },
  }
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
npm test -- --reporter=verbose src/__tests__/generatePalette.test.ts
```

Expected: all tests pass including the new `generateGrayPalettes` describe block.

- [ ] **Step 5: Commit**

```bash
git add src/lib/generatePalette.ts src/__tests__/generatePalette.test.ts
git commit -m "feat: add generateGrayPalettes with neutral and tinted gray step tables"
```

---

## Task 2: Render gray palette sections in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `App.tsx`**

Replace the entire file content with:

```tsx
import { useMemo, useState } from 'react'
import { ColorInput } from './components/ColorInput'
import { ExportPanel } from './components/ExportPanel'
import { PaletteScale } from './components/PaletteScale'
import { generatePalette, generateGrayPalettes } from './lib/generatePalette'

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

        <ExportPanel palette={palette} neutralGray={grays.neutral} tintedGray={grays.tinted} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: errors about `ExportPanel` missing `neutralGray`/`tintedGray` props — these are intentional and will be fixed in Task 3.

- [ ] **Step 3: Commit (will be clean after Task 3 — skip for now, commit together in Task 3 Step 6)**

---

## Task 3: Update `ExportPanel.tsx` and add export builder tests

**Files:**
- Modify: `src/components/ExportPanel.tsx`
- Create: `src/__tests__/exportBuilders.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/exportBuilders.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildCss, buildJson } from '../components/ExportPanel'
import { generatePalette, generateGrayPalettes } from '../lib/generatePalette'

const palette    = generatePalette('#3D63DD')
const { neutral, tinted } = generateGrayPalettes('#3D63DD')

describe('buildCss', () => {
  it('includes primary light vars', () => {
    const css = buildCss(palette, neutral, tinted)
    expect(css).toContain('--color-1:')
    expect(css).toContain('--color-12:')
  })

  it('includes primary dark vars', () => {
    const css = buildCss(palette, neutral, tinted)
    expect(css).toContain('--color-dark-1:')
    expect(css).toContain('--color-dark-12:')
  })

  it('includes neutral gray light and dark vars', () => {
    const css = buildCss(palette, neutral, tinted)
    expect(css).toContain('--gray-1:')
    expect(css).toContain('--gray-12:')
    expect(css).toContain('--gray-dark-1:')
    expect(css).toContain('--gray-dark-12:')
  })

  it('includes tinted gray light and dark vars', () => {
    const css = buildCss(palette, neutral, tinted)
    expect(css).toContain('--gray-tinted-1:')
    expect(css).toContain('--gray-tinted-12:')
    expect(css).toContain('--gray-tinted-dark-1:')
    expect(css).toContain('--gray-tinted-dark-12:')
  })

  it('wraps everything in :root {}', () => {
    const css = buildCss(palette, neutral, tinted)
    expect(css.trimStart()).toStartWith(':root {')
    expect(css.trimEnd()).toEndWith('}')
  })
})

describe('buildJson', () => {
  it('includes top-level light and dark keys with 12 entries each', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted))
    expect(Object.keys(json.light)).toHaveLength(12)
    expect(Object.keys(json.dark)).toHaveLength(12)
  })

  it('includes neutralGray.light and neutralGray.dark with 12 entries each', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted))
    expect(Object.keys(json.neutralGray.light)).toHaveLength(12)
    expect(Object.keys(json.neutralGray.dark)).toHaveLength(12)
  })

  it('includes tintedGray.light and tintedGray.dark with 12 entries each', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted))
    expect(Object.keys(json.tintedGray.light)).toHaveLength(12)
    expect(Object.keys(json.tintedGray.dark)).toHaveLength(12)
  })

  it('all hex values in neutralGray are valid hex strings', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted))
    for (const hex of Object.values<string>(json.neutralGray.light)) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
```

- [ ] **Step 2: Run tests — verify failure**

```bash
npm test -- --reporter=verbose src/__tests__/exportBuilders.test.ts
```

Expected: fails with import error — `buildCss` and `buildJson` are not exported yet.

- [ ] **Step 3: Update `ExportPanel.tsx`**

Replace the entire file content with:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PaletteResult } from '../lib/generatePalette'

type Tab = 'css' | 'json'

export function buildCss(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
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
  lines.push('}')
  return lines.join('\n')
}

export function buildJson(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
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
    },
    null,
    2,
  )
}

type Props = {
  palette: PaletteResult
  neutralGray: PaletteResult
  tintedGray: PaletteResult
}

export function ExportPanel({ palette, neutralGray, tintedGray }: Props) {
  const [tab, setTab] = useState<Tab>('css')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const content = tab === 'css'
    ? buildCss(palette, neutralGray, tintedGray)
    : buildJson(palette, neutralGray, tintedGray)

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

Expected: all tests pass.

- [ ] **Step 5: Run full test suite — verify no regressions**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/ExportPanel.tsx src/__tests__/exportBuilders.test.ts
git commit -m "feat: render neutral and tinted gray palettes with export support"
```
