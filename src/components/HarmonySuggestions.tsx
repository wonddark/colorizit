import type {HarmonyResult} from '../lib/generatePalette'

type Props = {
  harmonies: HarmonyResult
  theme:     'light' | 'dark'
}

export function HarmonySuggestions(props: Readonly<Props>) {
  const { harmonies, theme } = props
  if (!harmonies.complementar) return null

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-(--app-fg-muted)">Complementar</h2>
      <div
        className="w-10 h-10 rounded-md ring-2 ring-(--app-fg) ring-offset-2 ring-offset-(--app-bg)"
        style={{ backgroundColor: harmonies.complementar.palette[theme][8].hex }}
      />
    </div>
  )
}
