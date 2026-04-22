import { useCallback, useEffect, useMemo, useState } from 'react'
import { ColorInput } from './components/ColorInput'
import { ExportPanel } from './components/ExportPanel'
import { HarmonySuggestions } from './components/HarmonySuggestions'
import { PaletteScale } from './components/PaletteScale'
import { BackgroundSwatch } from './components/BackgroundSwatch'
import { PreviewPanel } from './components/PreviewPanel'
import { buildAppVars } from './lib/buildAppVars'
import {
  generatePalette,
  generateGrayPalettes,
  generateBackground,
  generateHarmonies,
} from './lib/generatePalette'

const DEFAULT_COLOR = '#3D63DD'

export default function App() {
  const [color, setColor] = useState(DEFAULT_COLOR)

  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('colorizit-theme') === 'light' ? 'light' : 'dark'
  )

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('colorizit-theme', next)
      return next
    })
  }, [])

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

  const appVars = useMemo(
    () => buildAppVars(theme, palette),
    [theme, palette],
  )

  return (
    <div
      className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]"
      style={appVars as React.CSSProperties}
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-8 p-8">
        <div>
          <h1 className="text-base font-semibold mb-0.5">Color Palette Generator</h1>
          <p className="text-sm text-[var(--app-fg-muted)]">Generate a 12-step Radix-style color scale</p>
        </div>
        <ColorInput value={color} onChange={setColor} theme={theme} onToggleTheme={toggleTheme} />
        <PaletteScale steps={palette.light} mode="light" />
        <PaletteScale steps={palette.dark} mode="dark" showLegend />

        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)]">
            Neutral Gray
          </h2>
          <PaletteScale steps={grays.neutral.light} mode="light" />
          <PaletteScale steps={grays.neutral.dark} mode="dark" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)]">
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
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)]">
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

      <PreviewPanel
        palette={palette}
        neutralGray={grays.neutral}
        tintedGray={grays.tinted}
        background={background}
        accentPalette={accentPalette}
        secondaryPalette={secondaryPalette}
      />
    </div>
  )
}
