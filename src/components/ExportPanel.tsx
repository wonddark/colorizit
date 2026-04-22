import { useCallback, useEffect, useRef, useState } from 'react'
import { wcagContrast } from 'culori'
import type { PaletteResult, BackgroundResult, ColorStep } from '../lib/generatePalette'

type Tab = 'css' | 'json' | 'shadcn'

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
    : tab === 'json'
    ? buildJson(palette, neutralGray, tintedGray, background)
    : buildShadcn(palette, neutralGray, tintedGray, background)

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
