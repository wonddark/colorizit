import { describe, it, expect } from 'vitest'
import { generatePalette } from '../lib/generatePalette'

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

  it('step 9 has the same oklch target in light and dark', () => {
    const result = generatePalette('#3D63DD')
    expect(result.light[8].oklch).toBe(result.dark[8].oklch)
  })

  it('throws on invalid input', () => {
    expect(() => generatePalette('not-a-color')).toThrow('Invalid color')
  })
})
