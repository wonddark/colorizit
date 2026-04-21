import { parse, converter, formatHex, clampChroma } from 'culori'

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
  0.003, 0.004, 0.005, 0.006, 0.006, 0.007,
  0.007, 0.008, 0.006, 0.005, 0.004, 0.003,
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
