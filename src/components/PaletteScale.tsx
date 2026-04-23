import type {ColorStep} from '../lib/generatePalette'

const PURPOSES = [
  'App background',
  'Subtle background',
  'UI element bg',
  'Hovered UI element',
  'Active / selected',
  'Subtle border',
  'UI border',
  'Hovered border',
  'Solid background',
  'Hovered solid',
  'Low-contrast text',
  'High-contrast text',
]

type Props = {
  steps: ColorStep[]
  mode: 'light' | 'dark'
  showLegend?: boolean
}

export function PaletteScale(props: Readonly<Props>) {
    const { steps, mode, showLegend } = props
  return (
    <div>
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-(--app-fg-muted) mb-2">
        {mode === 'light' ? 'Light' : 'Dark'}
      </h2>

      <div
        className="rounded-xl p-4"
        style={{ background: mode === 'light' ? '#ffffff' : '#111111' }}
      >
        <div className="flex gap-1">
          {steps.map((step, i) => {
            const useDarkLabel = mode === 'light' && i < 8
            return (
              <div
                key={i}
                className="group relative flex-1"
              >
                <div
                  className="h-16 rounded-md flex items-end justify-center pb-1.5"
                  style={{ background: step.hex }}
                >
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: useDarkLabel ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}
                  >
                    {i + 1}
                  </span>
                </div>
                {/* tooltip: dark overlay intentional in both themes for contrast against any swatch color */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="text-white/50">{PURPOSES[i]}</div>
                  <div>{step.hex}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showLegend && (
        <div className="flex mt-2 text-[10px] text-(--app-fg-subtle) font-medium">
          <span className="flex-2">Backgrounds</span>
          <span className="flex-3">UI elements</span>
          <span className="flex-3">Borders</span>
          <span className="flex-2">Solid</span>
          <span className="flex-2 text-right">Text</span>
        </div>
      )}
    </div>
  )
}
