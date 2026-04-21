import { describe, it, expect } from 'vitest'
import { formatHex } from 'culori'
import { generatePalette, generateGrayPalettes } from '../lib/generatePalette'

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
