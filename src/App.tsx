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
  const [preferredGray, setPreferredGray] = useState<'neutral' | 'tinted'>('tinted')

  useEffect(() => {
    setSelectedAccentIdx(0)
    setSelectedSecondaryIdx(0)
  }, [color])

  const accentPalette    = harmonies.accent[selectedAccentIdx]?.palette
  const secondaryPalette = harmonies.secondary[selectedSecondaryIdx]?.palette
  const previewGray      = preferredGray === 'neutral' ? grays.neutral : grays.tinted

  const appVars = useMemo(
    () => buildAppVars(theme, palette),
    [theme, palette],
  )

  return (
    <div
      className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]"
      style={appVars as React.CSSProperties}
    >
      <div className="px-8 pt-8">
        <h1 className="text-base font-semibold mb-0.5">Color Palette Generator</h1>
        <p className="text-sm text-[var(--app-fg-muted)]">Generate a 12-step Radix-style color scale</p>
      </div>

      <div className="px-8 pt-6 flex justify-center">
        <ColorInput value={color} onChange={setColor} theme={theme} onToggleTheme={toggleTheme} />
      </div>

      <div className="p-8 pt-6 flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex flex-col gap-8 flex-1 min-w-0">
          {theme === 'light'
            ? <PaletteScale steps={palette.light} mode="light" showLegend />
            : <PaletteScale steps={palette.dark} mode="dark" showLegend />}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)]">
                Neutral Gray
              </h2>
              <button
                onClick={() => setPreferredGray('neutral')}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md border transition-colors ${
                  preferredGray === 'neutral'
                    ? 'bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-fg)]'
                    : 'bg-transparent border-transparent text-[var(--app-fg-muted)] hover:text-[var(--app-fg-subtle)]'
                }`}
              >
                Use in Preview
              </button>
            </div>
            {theme === 'light'
              ? <PaletteScale steps={grays.neutral.light} mode="light" />
              : <PaletteScale steps={grays.neutral.dark} mode="dark" />}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)]">
                Tinted Gray
              </h2>
              <button
                onClick={() => setPreferredGray('tinted')}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md border transition-colors ${
                  preferredGray === 'tinted'
                    ? 'bg-[var(--app-surface)] border-[var(--app-border)] text-[var(--app-fg)]'
                    : 'bg-transparent border-transparent text-[var(--app-fg-muted)] hover:text-[var(--app-fg-subtle)]'
                }`}
              >
                Use in Preview
              </button>
            </div>
            {theme === 'light'
              ? <PaletteScale steps={grays.tinted.light} mode="light" showLegend />
              : <PaletteScale steps={grays.tinted.dark} mode="dark" showLegend />}
          </div>

          <HarmonySuggestions
            harmonies={harmonies}
            selectedAccent={selectedAccentIdx}
            selectedSecondary={selectedSecondaryIdx}
            onSelectAccent={setSelectedAccentIdx}
            onSelectSecondary={setSelectedSecondaryIdx}
            theme={theme}
          />

          <div className="flex flex-col gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-fg-muted)]">
              AA Background
            </h2>
            <BackgroundSwatch
              result={background}
              foregroundLight={palette.light[11]}
              foregroundDark={palette.dark[11]}
              theme={theme}
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

        <div className="w-full lg:w-[440px] shrink-0">
          <PreviewPanel
            palette={palette}
            tintedGray={previewGray}
            background={background}
            accentPalette={accentPalette}
            theme={theme}
          />
        </div>
      </div>
    </div>
  )
}
