import { useCallback, useEffect, useRef, useState } from 'react'
import { buildTokens, type TokenSet } from '../lib/buildTokens'
import type { PaletteResult, BackgroundResult } from '../lib/generatePalette'

type Tab = 'css' | 'json' | 'shadcn'

export function buildCss(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
  complementarPalette?: PaletteResult,
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
  if (complementarPalette) {
    lines.push('')
    lines.push('  /* Complementar — Light */')
    complementarPalette.light.forEach((step, i) => lines.push(`  --complementar-${i + 1}: ${step.oklch};`))
    lines.push('')
    lines.push('  /* Complementar — Dark */')
    complementarPalette.dark.forEach((step, i) => lines.push(`  --complementar-dark-${i + 1}: ${step.oklch};`))
  }
  lines.push('}')
  return lines.join('\n')
}

export function buildJson(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
  complementarPalette?: PaletteResult,
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
      ...(complementarPalette && {
        complementar: {
          light: Object.fromEntries(complementarPalette.light.map((s, i) => [String(i + 1), s.hex])),
          dark:  Object.fromEntries(complementarPalette.dark.map((s, i)  => [String(i + 1), s.hex])),
        },
      }),
    },
    null,
    2,
  )
}

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
  complementarPalette?: PaletteResult,
): string {
  const tokens = buildTokens(palette, neutralGray, tintedGray, background, complementarPalette)
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

type Props = {
  palette: PaletteResult
  neutralGray: PaletteResult
  tintedGray: PaletteResult
  background: BackgroundResult
  complementarPalette?: PaletteResult
}

export function ExportPanel({ palette, neutralGray, tintedGray, background, complementarPalette }: Props) {
  const [tab, setTab] = useState<Tab>('css')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const content = tab === 'css'
    ? buildCss(palette, neutralGray, tintedGray, background, complementarPalette)
    : tab === 'json'
    ? buildJson(palette, neutralGray, tintedGray, background, complementarPalette)
    : buildShadcn(palette, neutralGray, tintedGray, background, complementarPalette)

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
                ? 'bg-(--app-surface) border-(--app-border) text-(--app-fg)'
                : 'bg-transparent border-transparent text-(--app-fg-muted) hover:text-(--app-fg-subtle)'
            }`}
          >
            {t === 'css' ? 'CSS Variables' : t === 'json' ? 'JSON' : 'shadcn/ui'}
          </button>
        ))}
      </div>

      <div className="relative bg-(--app-surface) border border-(--app-border) rounded-b-xl rounded-tr-xl p-4">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 px-3 py-1.5 text-[11px] font-semibold bg-(--app-surface-hover) hover:bg-(--app-border) border border-(--app-border) rounded-md text-(--app-fg-muted) hover:text-(--app-fg) transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <pre className="text-[11px] font-mono text-(--app-fg-muted) overflow-auto max-h-52 leading-relaxed whitespace-pre pr-16">
          {content}
        </pre>
      </div>
    </div>
  )
}
