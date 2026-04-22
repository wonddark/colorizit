import { describe, it, expect } from 'vitest'
import { buildCss, buildJson, buildShadcn } from '../components/ExportPanel'
import { generatePalette, generateGrayPalettes, generateBackground, generateHarmonies } from '../lib/generatePalette'

const palette    = generatePalette('#3D63DD')
const { neutral, tinted } = generateGrayPalettes('#3D63DD')
const background = generateBackground(palette, { neutral, tinted })
const harmonies        = generateHarmonies('#3D63DD')
const accentPalette    = harmonies.accent[0].palette
const secondaryPalette = harmonies.secondary[0].palette

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

describe('buildShadcn', () => {
  const coreTokens = [
    '--background', '--foreground',
    '--card', '--card-foreground',
    '--popover', '--popover-foreground',
    '--primary', '--primary-foreground',
    '--secondary', '--secondary-foreground',
    '--muted', '--muted-foreground',
    '--accent', '--accent-foreground',
    '--border', '--input', '--ring',
  ]

  it('wraps output in @layer base', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    expect(out.trimStart().startsWith('@layer base {')).toBe(true)
    expect(out.trimEnd().endsWith('}')).toBe(true)
  })

  it('contains :root and .dark blocks', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    expect(out).toContain(':root {')
    expect(out).toContain('.dark {')
  })

  it('includes all 17 core tokens in :root', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    const root = out.slice(out.indexOf(':root {'), out.indexOf('.dark {'))
    for (const token of coreTokens) {
      expect(root).toContain(token + ':')
    }
  })

  it('includes all 17 core tokens in .dark', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    const dark = out.slice(out.indexOf('.dark {'))
    for (const token of coreTokens) {
      expect(dark).toContain(token + ':')
    }
  })

  it('--primary-foreground is an oklch value', () => {
    const out = buildShadcn(palette, neutral, tinted, background)
    expect(out).toMatch(/--primary-foreground:\s+oklch\(/)
  })
})

describe('buildCss — with accent/secondary', () => {
  it('includes accent light vars when accentPalette provided', () => {
    const css = buildCss(palette, neutral, tinted, background, accentPalette)
    expect(css).toContain('--accent-1:')
    expect(css).toContain('--accent-12:')
  })

  it('includes accent dark vars when accentPalette provided', () => {
    const css = buildCss(palette, neutral, tinted, background, accentPalette)
    expect(css).toContain('--accent-dark-1:')
    expect(css).toContain('--accent-dark-12:')
  })

  it('includes secondary light vars when secondaryPalette provided', () => {
    const css = buildCss(palette, neutral, tinted, background, undefined, secondaryPalette)
    expect(css).toContain('--secondary-1:')
    expect(css).toContain('--secondary-12:')
  })

  it('includes secondary dark vars when secondaryPalette provided', () => {
    const css = buildCss(palette, neutral, tinted, background, undefined, secondaryPalette)
    expect(css).toContain('--secondary-dark-1:')
    expect(css).toContain('--secondary-dark-12:')
  })

  it('omits accent/secondary sections when no palettes provided', () => {
    const css = buildCss(palette, neutral, tinted, background)
    expect(css).not.toContain('--accent-1:')
    expect(css).not.toContain('--secondary-1:')
  })
})

describe('buildJson — with accent/secondary', () => {
  it('includes accent.light and accent.dark with 12 entries when palette provided', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background, accentPalette))
    expect(Object.keys(json.accent.light)).toHaveLength(12)
    expect(Object.keys(json.accent.dark)).toHaveLength(12)
  })

  it('includes secondary.light and secondary.dark with 12 entries when palette provided', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background, undefined, secondaryPalette))
    expect(Object.keys(json.secondary.light)).toHaveLength(12)
    expect(Object.keys(json.secondary.dark)).toHaveLength(12)
  })

  it('omits accent/secondary keys when no palettes provided', () => {
    const json = JSON.parse(buildJson(palette, neutral, tinted, background))
    expect(json.accent).toBeUndefined()
    expect(json.secondary).toBeUndefined()
  })
})
