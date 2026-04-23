import {DashboardPreview} from './DashboardPreview'
import type {BackgroundResult, PaletteResult} from '../lib/generatePalette'

type Props = {
  palette: PaletteResult
  tintedGray: PaletteResult
  background: BackgroundResult
  accentPalette?: PaletteResult
  theme: 'light' | 'dark'
}

export function PreviewPanel(props: Readonly<Props>) {
  const { palette, tintedGray, background, accentPalette, theme } = props
  return (
    <section>
      <div style={{ borderRadius: '16px', border: '1px solid var(--app-border)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--app-border)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--app-fg-muted)', background: 'var(--app-surface)' }}>
          Live Preview
        </div>
        <DashboardPreview
          palette={palette}
          gray={tintedGray}
          background={background}
          accentPalette={accentPalette}
          theme={theme}
        />
      </div>
    </section>
  )
}
