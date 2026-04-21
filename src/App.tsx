import { useMemo, useState } from 'react'
import { ColorInput } from './components/ColorInput'
import { ExportPanel } from './components/ExportPanel'
import { PaletteScale } from './components/PaletteScale'
import { generatePalette } from './lib/generatePalette'

const DEFAULT_COLOR = '#3D63DD'

export default function App() {
  const [color, setColor] = useState(DEFAULT_COLOR)

  const palette = useMemo(() => {
    try { return generatePalette(color) }
    catch { return generatePalette(DEFAULT_COLOR) }
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
        <ExportPanel palette={palette} />
      </div>
    </div>
  )
}
