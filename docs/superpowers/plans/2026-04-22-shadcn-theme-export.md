# shadcn/ui Theme Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `shadcn/ui` tab to the Export Panel that outputs a shadcn v4-compatible theme CSS from all generated palette data.

**Architecture:** Add `buildShadcn` pure function to `src/components/ExportPanel.tsx` alongside `buildCss` and `buildJson`; extend `Tab` to `'css' | 'json' | 'shadcn'`; wire a new tab button. Use `wcagContrast` from culori to contrast-pick `--primary-foreground` (step 1 vs step 12 against step 9).

**Tech Stack:** TypeScript, React 19, culori 4.x (`wcagContrast`), Vitest 4.x

---

### Task 1: Write failing tests for `buildShadcn`

**Files:**
- Modify: `src/__tests__/exportBuilders.test.ts`

- [ ] **Step 1: Add `buildShadcn` to the import line**

Replace line 2 of `src/__tests__/exportBuilders.test.ts`:

```ts
import { buildCss, buildJson, buildShadcn } from '../components/ExportPanel'
```

- [ ] **Step 2: Append the `buildShadcn` describe block**

Add this at the end of the file (after the closing `})` of `describe('buildJson', ...)`):

```ts
describe('buildShadcn', () => {
  const coreTokens = [
    '--background', '--foreground',
    '--card', '--card-foreground',
    '--popover', '--popover-foreground',
    '--primary', '--primary-foreground',
    '--secondary', '--secondary-foreground',
    '--muted', '--muted-foreground',
    '--accent', '--accent-foreground',
    '--border', '--input', '--ring',
  ]

  it('wraps output in @layer base', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    expect(out.trimStart().startsWith('@layer base {')).toBe(true)
    expect(out.trimEnd().endsWith('}')).toBe(true)
  })

  it('contains :root and .dark blocks', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    expect(out).toContain(':root {')
    expect(out).toContain('.dark {')
  })

  it('includes all 17 core tokens in :root', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    const root = out.slice(out.indexOf(':root {'), out.indexOf('.dark {'))
    for (const token of coreTokens) {
      expect(root).toContain(token + ':')
    }
  })

  it('includes all 17 core tokens in .dark', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    const dark = out.slice(out.indexOf('.dark {'))
    for (const token of coreTokens) {
      expect(dark).toContain(token + ':')
    }
  })

  it('--primary-foreground is an oklch value', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    expect(out).toMatch(/--primary-foreground:\s+oklch\(/)
  })
})
```

- [ ] **Step 3: Run tests — expect them to fail**

```bash
npm test
```

Expected: TypeScript error or runtime error — `buildShadcn` is not exported from `ExportPanel`.

- [ ] **Step 4: Commit the failing tests**

```bash
git add src/__tests__/exportBuilders.test.ts
git commit -m "test: add failing tests for buildShadcn"
```

---

### Task 2: Implement `buildShadcn`

**Files:**
- Modify: `src/components/ExportPanel.tsx`

- [ ] **Step 1: Add the culori import**

Replace the existing import block at the top of `src/components/ExportPanel.tsx`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { wcagContrast } from 'culori'
import type { PaletteResult, BackgroundResult, ColorStep } from '../lib/generatePalette'
```

Note: `ColorStep` is added to the type import — needed by the helper inside `buildShadcn`.

- [ ] **Step 2: Add `buildShadcn` after `buildJson`**

Insert this function after the closing `}` of `buildJson` and before the `type Props` declaration:

```ts
export function buildShadcn(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
): string {
  const pick = (against: string, a: ColorStep, b: ColorStep): string =>
    wcagContrast(against, a.hex) >= wcagContrast(against, b.hex) ? a.oklch : b.oklch

  const vars = (
    p: ColorStep[],
    ng: ColorStep[],
    tg: ColorStep[],
    bg: ColorStep,
  ): string[] => [
    `    --background: ${bg.oklch};`,
    `    --foreground: ${p[11].oklch};`,
    `    --card: ${tg[1].oklch};`,
    `    --card-foreground: ${p[11].oklch};`,
    `    --popover: ${bg.oklch};`,
    `    --popover-foreground: ${p[11].oklch};`,
    `    --primary: ${p[8].oklch};`,
    `    --primary-foreground: ${pick(p[8].hex, p[0], p[11])};`,
    `    --secondary: ${tg[2].oklch};`,
    `    --secondary-foreground: ${tg[10].oklch};`,
    `    --muted: ${ng[2].oklch};`,
    `    --muted-foreground: ${ng[10].oklch};`,
    `    --accent: ${tg[2].oklch};`,
    `    --accent-foreground: ${p[11].oklch};`,
    `    --border: ${tg[5].oklch};`,
    `    --input: ${tg[5].oklch};`,
    `    --ring: ${p[7].oklch};`,
  ]

  return [
    '@layer base {',
    '  :root {',
    ...vars(palette.light, neutralGray.light, tintedGray.light, background.light),
    '  }',
    '  .dark {',
    ...vars(palette.dark, neutralGray.dark, tintedGray.dark, background.dark),
    '  }',
    '}',
  ].join('\n')
}
```

- [ ] **Step 3: Run tests — expect Task 1 tests to pass**

```bash
npm test
```

Expected: All tests pass, including the 5 new `buildShadcn` tests.

- [ ] **Step 4: Commit**

```bash
git add src/components/ExportPanel.tsx
git commit -m "feat: add buildShadcn export builder"
```

---

### Task 3: Wire the `shadcn/ui` tab in the UI

**Files:**
- Modify: `src/components/ExportPanel.tsx`

- [ ] **Step 1: Extend the `Tab` type**

Replace:
```ts
type Tab = 'css' | 'json'
```
With:
```ts
type Tab = 'css' | 'json' | 'shadcn'
```

- [ ] **Step 2: Update the `content` computation**

Replace:
```ts
  const content = tab === 'css'
    ? buildCss(palette, neutralGray, tintedGray, background)
    : buildJson(palette, neutralGray, tintedGray, background)
```
With:
```ts
  const content = tab === 'css'
    ? buildCss(palette, neutralGray, tintedGray, background)
    : tab === 'json'
    ? buildJson(palette, neutralGray, tintedGray, background)
    : buildShadcn(palette, neutralGray, tintedGray, background)
```

- [ ] **Step 3: Update the tab button array and labels**

Replace:
```ts
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
```
With:
```ts
        {(['css', 'json', 'shadcn'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border transition-colors ${
              tab === t
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-transparent border-transparent text-white/30 hover:text-white/50'
            }`}
          >
            {t === 'css' ? 'CSS Variables' : t === 'json' ? 'JSON' : 'shadcn/ui'}
          </button>
        ))}
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

Open the app, enter any color, scroll to the Export Panel, click the `shadcn/ui` tab. Verify:
- Output starts with `@layer base {`
- Contains `:root {` and `.dark {` blocks
- Contains `--background`, `--primary`, `--ring`, etc.
- Copy button copies the full output

- [ ] **Step 6: Commit**

```bash
git add src/components/ExportPanel.tsx
git commit -m "feat: add shadcn/ui export tab"
```
