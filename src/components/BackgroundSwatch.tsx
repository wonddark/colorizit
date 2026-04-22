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
