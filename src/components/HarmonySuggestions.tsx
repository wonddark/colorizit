import type { HarmonyResult } from '../lib/generatePalette'

type Props = {
  harmonies:         HarmonyResult
  selectedAccent:    number
  selectedSecondary: number
  onSelectAccent:    (i: number) => void
  onSelectSecondary: (i: number) => void
  theme:             'light' | 'dark'
}

export function HarmonySuggestions({
  harmonies,
  selectedAccent,
  selectedSecondary,
  onSelectAccent,
  onSelectSecondary,
  theme,
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
                style={{ backgroundColor: s.palette[theme][8].hex }}
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
                style={{ backgroundColor: s.palette[theme][8].hex }}
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
