import { parse, converter, formatHex, clampChroma, wcagContrast } from 'culori'

const toOklch = converter('oklch')

const LIGHT_STEPS = [
  { l: 0.990, c: 0.003 },
  { l: 0.978, c: 0.007 },
  { l: 0.955, c: 0.022 },
  { l: 0.925, c: 0.042 },
  { l: 0.890, c: 0.068 },
  { l: 0.845, c: 0.095 },
  { l: 0.780, c: 0.125 },
  { l: 0.700, c: 0.155 },
  { l: 0.570, c: 0.190 },
  { l: 0.520, c: 0.183 },
  { l: 0.420, c: 0.148 },
  { l: 0.210, c: 0.065 },
] as const

const DARK_STEPS = [
  { l: 0.130, c: 0.007 },
  { l: 0.160, c: 0.013 },
  { l: 0.200, c: 0.040 },
  { l: 0.240, c: 0.068 },
  { l: 0.285, c: 0.095 },
  { l: 0.340, c: 0.118 },
  { l: 0.410, c: 0.142 },
  { l: 0.500, c: 0.168 },
  { l: 0.570, c: 0.190 },
  { l: 0.620, c: 0.183 },
  { l: 0.760, c: 0.120 },
  { l: 0.945, c: 0.030 },
] as const

const GRAY_LIGHT_STEPS = [
  { l: 0.992 },
  { l: 0.977 },
  { l: 0.957 },
  { l: 0.935 },
  { l: 0.912 },
  { l: 0.889 },
  { l: 0.855 },
  { l: 0.775 },
  { l: 0.604 },
  { l: 0.566 },
  { l: 0.450 },
  { l: 0.180 },
] as const

const GRAY_DARK_STEPS = [
  { l: 0.130 },
  { l: 0.163 },
  { l: 0.193 },
  { l: 0.225 },
  { l: 0.255 },
  { l: 0.285 },
  { l: 0.340 },
  { l: 0.430 },
  { l: 0.490 },
  { l: 0.547 },
  { l: 0.745 },
  { l: 0.955 },
] as const

const GRAY_TINT_C = [
  0.005, 0.009, 0.013, 0.016, 0.018, 0.020,
  0.021, 0.022, 0.016, 0.013, 0.008, 0.004,
] as const

export type ColorStep = {
  hex: string
  oklch: string
}

export type PaletteResult = {
  light: ColorStep[]
  dark: ColorStep[]
}

function formatOklchString(l: number, c: number, h: number): string {
  const lPct = Math.round(l * 1000) / 10
  return `oklch(${lPct}% ${c.toFixed(3)} ${Math.round(h)})`
}

function buildStep(l: number, c: number, h: number): ColorStep {
  const clamped = clampChroma({ mode: 'oklch', l, c, h }, 'oklch', 'rgb')
  return {
    hex: formatHex(clamped) ?? '#000000',
    oklch: formatOklchString(clamped.l, clamped.c ?? 0, clamped.h ?? h),
  }
}

export type GrayPalettes = {
  neutral: PaletteResult
  tinted:  PaletteResult
}

export function generateGrayPalettes(input: string): GrayPalettes {
  const parsed = parse(input)
  if (!parsed) throw new Error(`Invalid color: ${input}`)

  const oklch = toOklch(parsed)
  const h = oklch?.h
  const hasHue = h !== undefined && !isNaN(h)

  return {
    neutral: {
      light: GRAY_LIGHT_STEPS.map(({ l }) => buildStep(l, 0, 0)),
      dark:  GRAY_DARK_STEPS.map(({ l }) => buildStep(l, 0, 0)),
    },
    tinted: {
      light: GRAY_LIGHT_STEPS.map(({ l }, i) =>
        buildStep(l, hasHue ? GRAY_TINT_C[i] : 0, hasHue ? h! : 0)),
      dark: GRAY_DARK_STEPS.map(({ l }, i) =>
        buildStep(l, hasHue ? GRAY_TINT_C[i] : 0, hasHue ? h! : 0)),
    },
  }
}

export function generatePalette(input: string): PaletteResult {
  const parsed = parse(input)
  if (!parsed) throw new Error(`Invalid color: ${input}`)

  const oklch = toOklch(parsed)
  const h = oklch?.h

  if (h === undefined || isNaN(h)) {
    return {
      light: LIGHT_STEPS.map(({ l }) => buildStep(l, 0, 0)),
      dark:  DARK_STEPS.map(({ l }) => buildStep(l, 0, 0)),
    }
  }

  return {
    light: LIGHT_STEPS.map(({ l, c }) => buildStep(l, c, h)),
    dark:  DARK_STEPS.map(({ l, c }) => buildStep(l, c, h)),
  }
}

export type ColorSuggestion = {
  label:   string
  palette: PaletteResult
}

export type HarmonyResult = {
  accent:    ColorSuggestion[]
  secondary: ColorSuggestion[]
}

const ACCENT_SHIFTS: Array<{ shift: number; label: string }> = [
  { shift: 180, label: 'Complementary' },
  { shift: 150, label: 'Split A' },
  { shift: 210, label: 'Split B' },
  { shift: 120, label: 'Triadic' },
  { shift:  90, label: 'Square' },
]

const SECONDARY_SHIFTS: Array<{ shift: number; label: string }> = [
  { shift:  30, label: 'Analogous +30°' },
  { shift: -30, label: 'Analogous −30°' },
  { shift:  60, label: 'Analogous +60°' },
  { shift: -60, label: 'Analogous −60°' },
  { shift:  45, label: 'Analogous +45°' },
]

export function generateHarmonies(input: string): HarmonyResult {
  const parsed = parse(input)
  if (!parsed) throw new Error(`Invalid color: ${input}`)

  const oklch = toOklch(parsed)
  const h = oklch?.h

  if (h === undefined || isNaN(h)) {
    return { accent: [], secondary: [] }
  }

  const makeSuggestion = ({ shift, label }: { shift: number; label: string }): ColorSuggestion => {
    const newH = ((h + shift) % 360 + 360) % 360
    const clamped = clampChroma({ mode: 'oklch', l: 0.5, c: 0.1, h: newH }, 'oklch', 'rgb')
    const seedHex = formatHex(clamped) ?? '#808080'
    return { label, palette: generatePalette(seedHex) }
  }

  return {
    accent:    ACCENT_SHIFTS.map(makeSuggestion),
    secondary: SECONDARY_SHIFTS.map(makeSuggestion),
  }
}

export type BackgroundSource = 'neutral' | 'tinted' | 'generated'

export type BackgroundColor = ColorStep & {
  source: BackgroundSource
  contrastRatio: number
}

export type BackgroundResult = {
  light: BackgroundColor
  dark:  BackgroundColor
}

function pickBackground(
  foregroundHex: string,
  candidate: ColorStep,
  source: 'neutral' | 'tinted',
): BackgroundColor | null {
  const ratio = wcagContrast(candidate.hex, foregroundHex)
  if (ratio >= 4.5) {
    return { ...candidate, source, contrastRatio: Math.round(ratio * 10) / 10 }
  }
  return null
}

function binarySearchBackground(
  foregroundHex: string,
  mode: 'light' | 'dark',
  tintedStep: ColorStep,
): BackgroundColor {
  const tintedOklch = toOklch(parse(tintedStep.hex)!)
  const rawH = tintedOklch?.h
  const rawC = tintedOklch?.c ?? 0
  const hasHue = rawH !== undefined && !isNaN(rawH)
  const searchH = hasHue ? rawH! : 0
  const searchC = hasHue ? rawC : 0

  let lo = mode === 'light' ? GRAY_LIGHT_STEPS[0].l : 0.0
  let hi = mode === 'light' ? 1.0 : GRAY_DARK_STEPS[0].l

  // Start with the extreme (lightest for light mode, darkest for dark mode)
  let bestStep = buildStep(mode === 'light' ? hi : lo, searchC, searchH)

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    const candidate = buildStep(mid, searchC, searchH)
    const ratio = wcagContrast(candidate.hex, foregroundHex)
    if (ratio >= 4.5) {
      bestStep = candidate
      // Narrow toward step 1 (less extreme) while still passing
      if (mode === 'light') hi = mid
      else lo = mid
    } else {
      // Need to go more extreme
      if (mode === 'light') lo = mid
      else hi = mid
    }
  }

  const finalRatio = wcagContrast(bestStep.hex, foregroundHex)
  return { ...bestStep, source: 'generated', contrastRatio: Math.round(finalRatio * 10) / 10 }
}

export function generateBackground(
  palette: PaletteResult,
  grays: GrayPalettes,
): BackgroundResult {
  const compute = (mode: 'light' | 'dark'): BackgroundColor => {
    const fg = palette[mode][11].hex
    return (
      pickBackground(fg, grays.neutral[mode][0], 'neutral') ??
      pickBackground(fg, grays.tinted[mode][0], 'tinted') ??
      binarySearchBackground(fg, mode, grays.tinted[mode][0])
    )
  }
  return { light: compute('light'), dark: compute('dark') }
}
