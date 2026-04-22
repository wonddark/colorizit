import { wcagContrast } from 'culori'
import type { PaletteResult, BackgroundResult, ColorStep } from './generatePalette'

export type TokenSet = {
  background: string
  foreground: string
  card: string
  'card-foreground': string
  primary: string
  'primary-foreground': string
  secondary: string
  'secondary-foreground': string
  muted: string
  'muted-foreground': string
  accent: string
  'accent-foreground': string
  border: string
  ring: string
}

export type TokenResult = { light: TokenSet; dark: TokenSet }

function pickForeground(against: string, a: ColorStep, b: ColorStep): string {
  return wcagContrast(against, a.hex) >= wcagContrast(against, b.hex) ? a.oklch : b.oklch
}

function deriveSet(
  p: ColorStep[],
  ng: ColorStep[],
  tg: ColorStep[],
  bg: ColorStep,
  ap: ColorStep[] | undefined,
  sp: ColorStep[] | undefined,
): TokenSet {
  return {
    background: bg.oklch,
    foreground: p[11].oklch,
    card: tg[1].oklch,
    'card-foreground': p[11].oklch,
    primary: p[9].oklch,
    'primary-foreground': pickForeground(p[9].hex, p[0], p[11]),
    secondary: sp ? sp[2].oklch : tg[2].oklch,
    'secondary-foreground': sp ? sp[10].oklch : tg[10].oklch,
    muted: ng[2].oklch,
    'muted-foreground': ng[10].oklch,
    accent: ap ? ap[2].oklch : tg[2].oklch,
    'accent-foreground': ap ? ap[11].oklch : p[11].oklch,
    border: tg[5].oklch,
    ring: p[7].oklch,
  }
}

export function buildTokens(
  palette: PaletteResult,
  neutralGray: PaletteResult,
  tintedGray: PaletteResult,
  background: BackgroundResult,
  accentPalette?: PaletteResult,
  secondaryPalette?: PaletteResult,
): TokenResult {
  return {
    light: deriveSet(
      palette.light, neutralGray.light, tintedGray.light,
      background.light, accentPalette?.light, secondaryPalette?.light,
    ),
    dark: deriveSet(
      palette.dark, neutralGray.dark, tintedGray.dark,
      background.dark, accentPalette?.dark, secondaryPalette?.dark,
    ),
  }
}
