import { describe, it, expect } from 'vitest'
import { buildCss, buildJson } from '../components/ExportPanel'
import { generatePalette, generateGrayPalettes, generateBackground } from '../lib/generatePalette'

const palette    = generatePalette('#3D63DD')
const { neutral, tinted } = generateGrayPalettes('#3D63DD')
const background = generateBackground(palette, { neutral, tinted })

describe('buildCss', () => {
  it('includes primary light vars', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).toContain('--color-1:')
    expect(css).toContain('--color-12:')
  })

  it('includes primary dark vars', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).toContain('--color-dark-1:')
    expect(css).toContain('--color-dark-12:')
  })

  it('includes neutral gray light and dark vars', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).toContain('--gray-1:')
    expect(css).toContain('--gray-12:')
    expect(css).toContain('--gray-dark-1:')
    expect(css).toContain('--gray-dark-12:')
  })

  it('includes tinted gray light and dark vars', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).toContain('--gray-tinted-1:')
    expect(css).toContain('--gray-tinted-12:')
    expect(css).toContain('--gray-tinted-dark-1:')
    expect(css).toContain('--gray-tinted-dark-12:')
  })

  it('wraps everything in :root {}', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css.trimStart().startsWith(':root {')).toBe(true)
    expect(css.trimEnd().endsWith('}')).toBe(true)
  })

  it('includes AA background vars', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).toMatch(/--bg-light:\s+oklch\(/)
    expect(css).toMatch(/--bg-dark:\s+oklch\(/)
  })
})

describe('buildJson', () => {
  it('includes top-level light and dark keys with 12 entries each', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(Object.keys(json.light)).toHaveLength(12)
    expect(Object.keys(json.dark)).toHaveLength(12)
  })

  it('includes neutralGray.light and neutralGray.dark with 12 entries each', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(Object.keys(json.neutralGray.light)).toHaveLength(12)
    expect(Object.keys(json.neutralGray.dark)).toHaveLength(12)
  })

  it('includes tintedGray.light and tintedGray.dark with 12 entries each', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(Object.keys(json.tintedGray.light)).toHaveLength(12)
    expect(Object.keys(json.tintedGray.dark)).toHaveLength(12)
  })

  it('all hex values in neutralGray are valid hex strings', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    for (const hex of Object.values<string>(json.neutralGray.light)) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('includes background.light with hex, contrastRatio, source', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(json.background.light.hex).toMatch(/^#[0-9a-f]{6}$/i)
    expect(typeof json.background.light.contrastRatio).toBe('number')
    expect(['neutral', 'tinted', 'generated']).toContain(json.background.light.source)
    expect(json.background.light.oklch).toBeUndefined()
  })

  it('includes background.dark with hex, contrastRatio, source', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(json.background.dark.hex).toMatch(/^#[0-9a-f]{6}$/i)
    expect(typeof json.background.dark.contrastRatio).toBe('number')
    expect(['neutral', 'tinted', 'generated']).toContain(json.background.dark.source)
    expect(json.background.dark.oklch).toBeUndefined()
  })
})
