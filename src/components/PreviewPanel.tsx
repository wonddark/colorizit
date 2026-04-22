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
}

export function PreviewPanel({ palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette }: Props) {
  const tokens = useMemo(
    () => buildTokens(palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette),
    [palette, neutralGray, tintedGray, background, accentPalette, secondaryPalette],
  )

  return (
    <section style={{ padding: '0 32px 32px' }}>
      <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)' }}>
          Live Preview
        </div>
        <ComponentKit id="preview-light" tokens={tokens.light} label="Light" />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <ComponentKit id="preview-dark" tokens={tokens.dark} label="Dark" />
        </div>
      </div>
    </section>
  )
}
