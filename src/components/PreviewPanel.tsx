import { useMemo } from 'react'
import { buildTokens } from '../lib/buildTokens'
import { ComponentKit } from './ComponentKit'
import type { PaletteResult, BackgroundResult } from '../lib/generatePalette'

type Props = {
  palette: PaletteResult
  neutralGray: PaletteResult
  tintedGray: PaletteResult
  background: BackgroundResult
  accentPalette?: PaletteResult
  secondaryPalette?: PaletteResult
  theme: 'light' | 'dark'
}

export function PreviewPanel({ palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette, theme }: Props) {
  const tokens = useMemo(
    () => buildTokens(palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette),
    [palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette],
  )

  return (
    <section style={{ padding: '0 32px 32px' }}>
      <div style={{ borderRadius: '16px', border: '1px solid var(--app-border)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--app-fg-muted)', background: 'var(--app-surface)' }}>
          Live Preview
        </div>
        <ComponentKit
          id={`preview-${theme}`}
          tokens={tokens[theme]}
          label={theme === 'light' ? 'Light' : 'Dark'}
        />
      </div>
    </section>
  )
}
