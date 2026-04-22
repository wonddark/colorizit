# Harmony Color Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Given a primary color, derive up to 5 accent and 5 secondary color suggestions using fixed color harmony hue shifts, let the user select one per role (default: index 0), and include both as full 12-step palettes in all three export formats.

**Architecture:** `generateHarmonies` in `generatePalette.ts` produces two arrays of `ColorSuggestion` (label + PaletteResult) using fixed hue shifts. Selection state lives in `App.tsx`. All three export builders gain two optional trailing parameters (`accentPalette?`, `secondaryPalette?`). A new `HarmonySuggestions` component renders the swatches.

**Tech Stack:** TypeScript, React 19, culori 4.x, Vitest 4.x, Tailwind CSS

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/__tests__/generatePalette.test.ts` | Tests for `generateHarmonies` |
| Modify | `src/lib/generatePalette.ts` | Add `ColorSuggestion`, `HarmonyResult`, `generateHarmonies` |
| Modify | `src/__tests__/exportBuilders.test.ts` | Tests for builder extensions |
| Modify | `src/components/ExportPanel.tsx` | Extend all three builders + Props |
| Create | `src/components/HarmonySuggestions.tsx` | Swatch UI for accent/secondary selection |
| Modify | `src/App.tsx` | State, memos, useEffect, wiring |

---

### Task 1: `generateHarmonies` — types, function, tests

**Files:**
- Create: `src/__tests__/generatePalette.test.ts`
- Modify: `src/lib/generatePalette.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/generatePalette.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateHarmonies } from '../lib/generatePalette'

describe('generateHarmonies', () => {
  it('returns 5 accent and 5 secondary suggestions for a chromatic input', () => {
    const result = generateHarmonies('#3D63DD')
    expect(result.accent).toHaveLength(5)
    expect(result.secondary).toHaveLength(5)
  })

  it('each suggestion has a non-empty label', () => {
    const result = generateHarmonies('#3D63DD')
    for (const s of [...result.accent, ...result.secondary]) {
      expect(s.label.length).toBeGreaterThan(0)
    }
  })

  it('each suggestion palette has 12 light and 12 dark steps', () => {
    const result = generateHarmonies('#3D63DD')
    for (const s of [...result.accent, ...result.secondary]) {
      expect(s.palette.light).toHaveLength(12)
      expect(s.palette.dark).toHaveLength(12)
    }
  })

  it('accent labels are distinct from secondary labels', () => {
    const result = generateHarmonies('#3D63DD')
    const accentLabels = new Set(result.accent.map(s => s.label))
    for (const s of result.secondary) {
      expect(accentLabels.has(s.label)).toBe(false)
    }
  })

  it('returns empty arrays for an achromatic input', () => {
    const result = generateHarmonies('#808080')
    expect(result.accent).toHaveLength(0)
    expect(result.secondary).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```

Expected: TypeScript error — `generateHarmonies` is not exported from `generatePalette`.

- [ ] **Step 3: Add types and `generateHarmonies` to `src/lib/generatePalette.ts`**

Add these after the existing `BackgroundResult` type (around line 149):

```ts
export type ColorSuggestion = {
  label:   string
  palette: PaletteResult
}

export type HarmonyResult = {
  accent:    ColorSuggestion[]
  secondary: ColorSuggestion[]
}

const ACCENT_SHIFTS: Array<{ shift: number; label: string }> = [
  { shift: 180, label: 'Complementary' },
  { shift: 150, label: 'Split A' },
  { shift: 210, label: 'Split B' },
  { shift: 120, label: 'Triadic' },
  { shift:  90, label: 'Square' },
]

const SECONDARY_SHIFTS: Array<{ shift: number; label: string }> = [
  { shift:  30, label: 'Analogous +30°' },
  { shift: -30, label: 'Analogous −30°' },
  { shift:  60, label: 'Analogous +60°' },
  { shift: -60, label: 'Analogous −60°' },
  { shift:  45, label: 'Analogous +45°' },
]

export function generateHarmonies(input: string): HarmonyResult {
  const parsed = parse(input)
  if (!parsed) throw new Error(`Invalid color: ${input}`)

  const oklch = toOklch(parsed)
  const h = oklch?.h

  if (h === undefined || isNaN(h)) {
    return { accent: [], secondary: [] }
  }

  const makeSuggestion = ({ shift, label }: { shift: number; label: string }): ColorSuggestion => {
    const newH = ((h + shift) % 360 + 360) % 360
    const clamped = clampChroma({ mode: 'oklch', l: 0.5, c: 0.1, h: newH }, 'oklch', 'rgb')
    const seedHex = formatHex(clamped) ?? '#808080'
    return { label, palette: generatePalette(seedHex) }
  }

  return {
    accent:    ACCENT_SHIFTS.map(makeSuggestion),
    secondary: SECONDARY_SHIFTS.map(makeSuggestion),
  }
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npm test
```

Expected: All tests pass (36 previous + 5 new = 41 total).

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/generatePalette.test.ts src/lib/generatePalette.ts
git commit -m "feat: add generateHarmonies with accent and secondary suggestions"
```

---

### Task 2: Extend `buildCss` with accent/secondary

**Files:**
- Modify: `src/__tests__/exportBuilders.test.ts`
- Modify: `src/components/ExportPanel.tsx`

- [ ] **Step 1: Write failing tests**

Make three changes to `src/__tests__/exportBuilders.test.ts`:

**a) Add to the import on line 2** (add `generateHarmonies` to the existing `generatePalette` import):
```ts
import { generatePalette, generateGrayPalettes, generateBackground, generateHarmonies } from '../lib/generatePalette'
```

**b) Add fixture consts after the existing `background` const** (currently line 7):
```ts
const harmonies        = generateHarmonies('#3D63DD')
const accentPalette    = harmonies.accent[0].palette
const secondaryPalette = harmonies.secondary[0].palette
```

**c) Append new describe block** at the very end of the file (after the last `})`):

```ts
describe('buildCss — with accent/secondary', () => {
  it('includes accent light vars when accentPalette provided', () => {
    const css = buildCss(palette, neutral, tinted, background, accentPalette)
    expect(css).toContain('--accent-1:')
    expect(css).toContain('--accent-12:')
  })

  it('includes accent dark vars when accentPalette provided', () => {
    const css = buildCss(palette, neutral, tinted, background, accentPalette)
    expect(css).toContain('--accent-dark-1:')
    expect(css).toContain('--accent-dark-12:')
  })

  it('includes secondary light vars when secondaryPalette provided', () => {
    const css = buildCss(palette, neutral, tinted, background, undefined, secondaryPalette)
    expect(css).toContain('--secondary-1:')
    expect(css).toContain('--secondary-12:')
  })

  it('includes secondary dark vars when secondaryPalette provided', () => {
    const css = buildCss(palette, neutral, tinted, background, undefined, secondaryPalette)
    expect(css).toContain('--secondary-dark-1:')
    expect(css).toContain('--secondary-dark-12:')
  })

  it('omits accent/secondary sections when no palettes provided', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).not.toContain('--accent-1:')
    expect(css).not.toContain('--secondary-1:')
  })
})
```

Note: the `import { generateHarmonies }` line goes at the top of the file with the other imports — move it there manually. The `harmonies`, `accentPalette`, `secondaryPalette` const declarations go alongside the other module-level fixtures (after the existing `background` line).

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```

Expected: TypeScript error — `buildCss` does not accept 5/6 arguments.

- [ ] **Step 3: Replace `buildCss` in `src/components/ExportPanel.tsx`**

Replace the entire `buildCss` function (lines 7–48) with:

```ts
export function buildCss(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
  accentPalette?: PaletteResult,
  secondaryPalette?: PaletteResult,
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
  if (accentPalette) {
    lines.push('')
    lines.push('  /* Accent — Light */')
    accentPalette.light.forEach((step, i) => lines.push(`  --accent-${i + 1}: ${step.oklch};`))
    lines.push('')
    lines.push('  /* Accent — Dark */')
    accentPalette.dark.forEach((step, i) => lines.push(`  --accent-dark-${i + 1}: ${step.oklch};`))
  }
  if (secondaryPalette) {
    lines.push('')
    lines.push('  /* Secondary — Light */')
    secondaryPalette.light.forEach((step, i) => lines.push(`  --secondary-${i + 1}: ${step.oklch};`))
    lines.push('')
    lines.push('  /* Secondary — Dark */')
    secondaryPalette.dark.forEach((step, i) => lines.push(`  --secondary-dark-${i + 1}: ${step.oklch};`))
  }
  lines.push('}')
  return lines.join('\n')
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/exportBuilders.test.ts src/components/ExportPanel.tsx
git commit -m "feat: extend buildCss with optional accent/secondary palettes"
```

---

### Task 3: Extend `buildJson` with accent/secondary

**Files:**
- Modify: `src/__tests__/exportBuilders.test.ts`
- Modify: `src/components/ExportPanel.tsx`

- [ ] **Step 1: Write failing tests**

Append to the end of `src/__tests__/exportBuilders.test.ts` (the `harmonies`, `accentPalette`, `secondaryPalette` consts added in Task 2 are already at module level — no need to re-add them):

```ts
describe('buildJson — with accent/secondary', () => {
  it('includes accent.light and accent.dark with 12 entries when palette provided', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background, accentPalette))
    expect(Object.keys(json.accent.light)).toHaveLength(12)
    expect(Object.keys(json.accent.dark)).toHaveLength(12)
  })

  it('includes secondary.light and secondary.dark with 12 entries when palette provided', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background, undefined, secondaryPalette))
    expect(Object.keys(json.secondary.light)).toHaveLength(12)
    expect(Object.keys(json.secondary.dark)).toHaveLength(12)
  })

  it('omits accent/secondary keys when no palettes provided', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(json.accent).toBeUndefined()
    expect(json.secondary).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```

Expected: TypeScript error — `buildJson` does not accept 5/6 arguments.

- [ ] **Step 3: Replace `buildJson` in `src/components/ExportPanel.tsx`**

Replace the entire `buildJson` function (lines 50–76) with:

```ts
export function buildJson(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
  accentPalette?: PaletteResult,
  secondaryPalette?: PaletteResult,
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
      ...(accentPalette && {
        accent: {
          light: Object.fromEntries(accentPalette.light.map((s, i) => [String(i + 1), s.hex])),
          dark:  Object.fromEntries(accentPalette.dark.map((s, i)  => [String(i + 1), s.hex])),
        },
      }),
      ...(secondaryPalette && {
        secondary: {
          light: Object.fromEntries(secondaryPalette.light.map((s, i) => [String(i + 1), s.hex])),
          dark:  Object.fromEntries(secondaryPalette.dark.map((s, i)  => [String(i + 1), s.hex])),
        },
      }),
    },
    null,
    2,
  )
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/exportBuilders.test.ts src/components/ExportPanel.tsx
git commit -m "feat: extend buildJson with optional accent/secondary palettes"
```

---

### Task 4: Extend `buildShadcn` with accent/secondary

**Files:**
- Modify: `src/__tests__/exportBuilders.test.ts`
- Modify: `src/components/ExportPanel.tsx`

- [ ] **Step 1: Write failing tests**

Append to the end of `src/__tests__/exportBuilders.test.ts`:

```ts
describe('buildShadcn — with accent/secondary', () => {
  it('uses secondary palette step 3 for --secondary when provided', () => {
    const out = buildShadcn(palette, neutral, tinted, background, accentPalette, secondaryPalette)
    expect(out).toContain(`--secondary: ${secondaryPalette.light[2].oklch}`)
  })

  it('uses secondary palette step 11 for --secondary-foreground when provided', () => {
    const out = buildShadcn(palette, neutral, tinted, background, accentPalette, secondaryPalette)
    expect(out).toContain(`--secondary-foreground: ${secondaryPalette.light[10].oklch}`)
  })

  it('uses accent palette step 3 for --accent when provided', () => {
    const out = buildShadcn(palette, neutral, tinted, background, accentPalette, secondaryPalette)
    expect(out).toContain(`--accent: ${accentPalette.light[2].oklch}`)
  })

  it('uses accent palette step 12 for --accent-foreground when provided', () => {
    const out = buildShadcn(palette, neutral, tinted, background, accentPalette, secondaryPalette)
    expect(out).toContain(`--accent-foreground: ${accentPalette.light[11].oklch}`)
  })

  it('falls back to tinted-gray for --secondary when no palette provided', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    expect(out).toContain(`--secondary: ${tinted.light[2].oklch}`)
  })

  it('falls back to tinted-gray for --accent when no palette provided', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    expect(out).toContain(`--accent: ${tinted.light[2].oklch}`)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```

Expected: TypeScript error — `buildShadcn` does not accept 5/6 arguments. The fallback tests may pass but the 6-arg tests will fail.

- [ ] **Step 3: Replace `buildShadcn` in `src/components/ExportPanel.tsx`**

Replace the entire `buildShadcn` function (lines 78–122) with:

```ts
export function buildShadcn(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
  accentPalette?: PaletteResult,
  secondaryPalette?: PaletteResult,
): string {
  const pick = (against: string, a: ColorStep, b: ColorStep): string =>
    wcagContrast(against, a.hex) >= wcagContrast(against, b.hex) ? a.oklch : b.oklch

  const vars = (
    p: ColorStep[],
    ng: ColorStep[],
    tg: ColorStep[],
    bg: ColorStep,
    ap: ColorStep[] | undefined,
    sp: ColorStep[] | undefined,
  ): string[] => [
    `    --background: ${bg.oklch};`,
    `    --foreground: ${p[11].oklch};`,
    `    --card: ${tg[1].oklch};`,
    `    --card-foreground: ${p[11].oklch};`,
    `    --popover: ${bg.oklch};`,
    `    --popover-foreground: ${p[11].oklch};`,
    `    --primary: ${p[8].oklch};`,
    `    --primary-foreground: ${pick(p[8].hex, p[0], p[11])};`,
    `    --secondary: ${sp ? sp[2].oklch : tg[2].oklch};`,
    `    --secondary-foreground: ${sp ? sp[10].oklch : tg[10].oklch};`,
    `    --muted: ${ng[2].oklch};`,
    `    --muted-foreground: ${ng[10].oklch};`,
    `    --accent: ${ap ? ap[2].oklch : tg[2].oklch};`,
    `    --accent-foreground: ${ap ? ap[11].oklch : p[11].oklch};`,
    `    --border: ${tg[5].oklch};`,
    `    --input: ${tg[5].oklch};`,
    `    --ring: ${p[7].oklch};`,
  ]

  return [
    '@layer base {',
    '  :root {',
    ...vars(palette.light, neutralGray.light, tintedGray.light, background.light, accentPalette?.light, secondaryPalette?.light),
    '  }',
    '  .dark {',
    ...vars(palette.dark, neutralGray.dark, tintedGray.dark, background.dark, accentPalette?.dark, secondaryPalette?.dark),
    '  }',
    '}',
  ].join('\n')
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/exportBuilders.test.ts src/components/ExportPanel.tsx
git commit -m "feat: extend buildShadcn with optional accent/secondary palettes"
```

---

### Task 5: `HarmonySuggestions` component + App.tsx + ExportPanel wiring

**Files:**
- Create: `src/components/HarmonySuggestions.tsx`
- Modify: `src/components/ExportPanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/components/HarmonySuggestions.tsx`**

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
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Accent</h2>
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
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111]'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: s.palette.light[8].hex }}
              />
              <span className="text-[10px] text-white/40 group-hover:text-white/60 whitespace-nowrap">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Secondary</h2>
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
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111]'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: s.palette.light[8].hex }}
              />
              <span className="text-[10px] text-white/40 group-hover:text-white/60 whitespace-nowrap">
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

- [ ] **Step 2: Update `ExportPanel` Props and `content` computation in `src/components/ExportPanel.tsx`**

Replace the `type Props` block and the `ExportPanel` function signature + `content` line:

```ts
type Props = {
  palette: PaletteResult
  neutralGray: PaletteResult
  tintedGray: PaletteResult
  background: BackgroundResult
  accentPalette?: PaletteResult
  secondaryPalette?: PaletteResult
}

export function ExportPanel({ palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette }: Props) {
```

And replace the `content` computation:

```ts
  const content = tab === 'css'
    ? buildCss(palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette)
    : tab === 'json'
    ? buildJson(palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette)
    : buildShadcn(palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette)
```

- [ ] **Step 3: Replace `src/App.tsx` entirely**

```tsx
import { useEffect, useMemo, useState } from 'react'
import { ColorInput } from './components/ColorInput'
import { ExportPanel } from './components/ExportPanel'
import { HarmonySuggestions } from './components/HarmonySuggestions'
import { PaletteScale } from './components/PaletteScale'
import { BackgroundSwatch } from './components/BackgroundSwatch'
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
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Verify in the browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- Two new rows ("Accent" and "Secondary") appear between the tinted-gray section and the AA background section.
- Each row has 5 colored swatches with labels below.
- The first swatch in each row is selected by default (white ring).
- Clicking a different swatch updates the ring to that swatch.
- Switching to the CSS Variables tab shows `--accent-1:` through `--accent-12:` and `--secondary-1:` through `--secondary-12:` in the output.
- Switching to the JSON tab shows `"accent"` and `"secondary"` keys at the top level.
- Switching to the shadcn/ui tab: `--accent` and `--secondary` values change when you select different swatches.
- Entering an achromatic color (e.g. `#808080`) hides the harmony section entirely.
- Changing the primary color resets both selections to the first swatch.

- [ ] **Step 6: Commit**

```bash
git add src/components/HarmonySuggestions.tsx src/components/ExportPanel.tsx src/App.tsx
git commit -m "feat: add harmony suggestions UI and wire accent/secondary into exports"
```
