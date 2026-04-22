import type { PaletteResult } from './generatePalette'

export type AppVars = Readonly<Record<string, string>>

const DARK_VARS: AppVars = {
  '--app-bg':            '#111111',
  '--app-fg':            '#ffffff',
  '--app-fg-muted':      'rgba(255,255,255,0.30)',
  '--app-fg-subtle':     'rgba(255,255,255,0.25)',
  '--app-surface':       'rgba(255,255,255,0.05)',
  '--app-surface-hover': 'rgba(255,255,255,0.10)',
  '--app-border':        'rgba(255,255,255,0.10)',
  '--app-border-strong': 'rgba(255,255,255,0.30)',
}

export function buildAppVars(theme: 'light' | 'dark', palette: PaletteResult): AppVars {
  if (theme === 'dark') return DARK_VARS
  return {
    '--app-bg':            palette.light[0].hex,
    '--app-fg':            palette.light[11].hex,
    '--app-fg-muted':      palette.light[10].hex,
    '--app-fg-subtle':     palette.light[9].hex,
    '--app-surface':       palette.light[1].hex,
    '--app-surface-hover': palette.light[2].hex,
    '--app-border':        palette.light[5].hex,
    '--app-border-strong': palette.light[6].hex,
  }
}
