import { describe, it, expect } from 'vitest'
import { wcagContrast, formatHex } from 'culori'
import { generatePalette, generateGrayPalettes, generateBackground } from '../lib/generatePalette'
import type { PaletteResult, ColorStep } from '../lib/generatePalette'

describe('generatePalette', () => {
  it('returns 12 light and 12 dark steps', () => {
    const result = generatePalette('#3D63DD')
    expect(result.light).toHaveLength(12)
    expect(result.dark).toHaveLength(12)
  })

  it('each step has hex and oklch properties', () => {
    const result = generatePalette('#3D63DD')
    for (const step of [...result.light, ...result.dark]) {
      expect(step.hex).toMatch(/^#[0-9a-f]{6}$/i)
      expect(step.oklch).toMatch(/^oklch\(/)
    }
  })

  it('oklch string is formatted as percentage', () => {
    const result = generatePalette('#3D63DD')
    // e.g. oklch(99% 0.003 264)
    expect(result.light[0].oklch).toMatch(/^oklch\(\d+\.?\d*% \d+\.\d{3} \d+\)$/)
  })

  it('different hues produce different step-9 colors', () => {
    const blue = generatePalette('#3D63DD')
    const red  = generatePalette('#DD3D3D')
    expect(blue.light[8].hex).not.toBe(red.light[8].hex)
  })

  it('hex and oklch values are consistent for each step', () => {
    const result = generatePalette('#3D63DD')
    const hexDistance = (a: string, b: string): number => {
      const parse = (h: string) => [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
      ]
      const [ar, ag, ab] = parse(a)
      const [br, bg, bb] = parse(b)
      return Math.max(Math.abs(ar - br), Math.abs(ag - bg), Math.abs(ab - bb))
    }
    const toHex = (oklchStr: string): string => {
      const m = oklchStr.match(/oklch\((\d+\.?\d*)% ([\d.]+) (\d+)\)/)!
      return formatHex({ mode: 'oklch' as const, l: +m[1] / 100, c: +m[2], h: +m[3] }) ?? '#000000'
    }
    for (const step of [...result.light, ...result.dark]) {
      // Allow ±1 per channel for rounding in the formatted oklch string
      expect(hexDistance(toHex(step.oklch), step.hex)).toBeLessThanOrEqual(1)
    }
  })

  it('throws on invalid input', () => {
    expect(() => generatePalette('not-a-color')).toThrow('Invalid color')
  })

  it('achromatic input produces a neutral grey scale (no hue)', () => {
    const result = generatePalette('#808080')
    for (const step of [...result.light, ...result.dark]) {
      // All steps should produce neutral hex values (r = g = b)
      const hex = step.hex.toLowerCase()
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      expect(Math.abs(r - g)).toBeLessThanOrEqual(2)
      expect(Math.abs(g - b)).toBeLessThanOrEqual(2)
    }
  })
})

describe('generateGrayPalettes', () => {
  it('returns neutral and tinted each with 12 light and 12 dark steps', () => {
    const { neutral, tinted } = generateGrayPalettes('#3D63DD')
    expect(neutral.light).toHaveLength(12)
    expect(neutral.dark).toHaveLength(12)
    expect(tinted.light).toHaveLength(12)
    expect(tinted.dark).toHaveLength(12)
  })

  it('each step has hex and oklch properties', () => {
    const { neutral, tinted } = generateGrayPalettes('#3D63DD')
    const allSteps = [
      ...neutral.light, ...neutral.dark,
      ...tinted.light,  ...tinted.dark,
    ]
    for (const step of allSteps) {
      expect(step.hex).toMatch(/^#[0-9a-f]{6}$/i)
      expect(step.oklch).toMatch(/^oklch\(/)
    }
  })

  it('neutral steps are achromatic (r ≈ g ≈ b)', () => {
    const { neutral } = generateGrayPalettes('#3D63DD')
    for (const step of [...neutral.light, ...neutral.dark]) {
      const hex = step.hex.toLowerCase()
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      expect(Math.abs(r - g)).toBeLessThanOrEqual(2)
      expect(Math.abs(g - b)).toBeLessThanOrEqual(2)
    }
  })

  it('tinted steps differ from neutral steps when input has a hue', () => {
    const { neutral, tinted } = generateGrayPalettes('#3D63DD')
    const differs = neutral.light.some((s, i) => s.hex !== tinted.light[i].hex)
    expect(differs).toBe(true)
  })

  it('tinted falls back to neutral when input is achromatic', () => {
    const { neutral, tinted } = generateGrayPalettes('#808080')
    for (let i = 0; i < 12; i++) {
      expect(tinted.light[i].hex).toBe(neutral.light[i].hex)
      expect(tinted.dark[i].hex).toBe(neutral.dark[i].hex)
    }
  })

  it('throws on invalid input', () => {
    expect(() => generateGrayPalettes('not-a-color')).toThrow('Invalid color')
  })
})

describe('generateBackground', () => {
  const palette = generatePalette('#3D63DD')
  const grays   = generateGrayPalettes('#3D63DD')
  const result  = generateBackground(palette, grays)

  it('returns BackgroundColor for both light and dark modes', () => {
    expect(result.light.hex).toMatch(/^#[0-9a-f]{6}$/i)
    expect(result.dark.hex).toMatch(/^#[0-9a-f]{6}$/i)
    expect(result.light.oklch).toMatch(/^oklch\(/)
    expect(result.dark.oklch).toMatch(/^oklch\(/)
  })

  it('light background achieves >= 4.5:1 against primary light step 12', () => {
    const ratio = wcagContrast(result.light.hex, palette.light[11].hex)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('dark background achieves >= 4.5:1 against primary dark step 12', () => {
    const ratio = wcagContrast(result.dark.hex, palette.dark[11].hex)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('source is neutral, tinted, or generated', () => {
    expect(['neutral', 'tinted', 'generated']).toContain(result.light.source)
    expect(['neutral', 'tinted', 'generated']).toContain(result.dark.source)
  })

  it('contrastRatio matches actual computed contrast to one decimal place', () => {
    const actualLight = Math.round(wcagContrast(result.light.hex, palette.light[11].hex) * 10) / 10
    const actualDark  = Math.round(wcagContrast(result.dark.hex,  palette.dark[11].hex)  * 10) / 10
    expect(result.light.contrastRatio).toBe(actualLight)
    expect(result.dark.contrastRatio).toBe(actualDark)
  })

  it('returns best-effort generated background when AA is physically unachievable', () => {
    // A near-white foreground (#d4d4d4) makes AA impossible against any lighter background
    const lightFg: ColorStep = { hex: '#d4d4d4', oklch: 'oklch(85% 0 0)' }
    const fakePalette: PaletteResult = {
      light: [...generatePalette('#3D63DD').light.slice(0, 11), lightFg],
      dark:  generatePalette('#3D63DD').dark,
    }
    const r = generateBackground(fakePalette, grays)
    // Neither neutral (#f9f9f9) nor tinted can achieve 4.5:1 against #d4d4d4
    expect(r.light.source).toBe('generated')
    expect(r.light.hex).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
