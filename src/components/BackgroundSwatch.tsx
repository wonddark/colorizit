import type {BackgroundResult, BackgroundSource, ColorStep} from '../lib/generatePalette'

type Props = {
  result: BackgroundResult
  foregroundLight: ColorStep
  foregroundDark: ColorStep
  theme: 'light' | 'dark'
}

function ContrastBadge({ ratio }: Readonly<{ ratio: number }>) {
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

export function BackgroundSwatch(props: Readonly<Props>) {
  const { result, foregroundLight, foregroundDark, theme } = props
  const swatch = theme === 'light' ? result.light : result.dark
  const fg     = theme === 'light' ? foregroundLight : foregroundDark

  return (
    <div>
      <div
        className="rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 h-24"
        style={{ background: swatch.hex }}
      >
        <span
          className="text-3xl font-bold leading-none"
          style={{ color: fg.hex }}
        >
          Aa
        </span>
        <div style={{ color: fg.hex }}>
          <ContrastBadge ratio={swatch.contrastRatio} />
        </div>
      </div>
      <p className="text-[10px] text-(--app-fg-muted) mt-1.5">{sourceLabel(swatch.source)}</p>
    </div>
  )
}
