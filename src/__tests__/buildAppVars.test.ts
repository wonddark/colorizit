import { describe, it, expect } from 'vitest'
import { buildAppVars } from '../lib/buildAppVars'
import { generatePalette } from '../lib/generatePalette'

const palette = generatePalette('#3D63DD')

describe('buildAppVars', () => {
  it('dark mode returns exactly 8 vars', () => {
    const vars = buildAppVars('dark', palette)
    expect(Object.keys(vars)).toHaveLength(8)
  })

  it('dark mode --app-bg is #111111', () => {
    const vars = buildAppVars('dark', palette)
    expect(vars['--app-bg']).toBe('#111111')
  })

  it('dark mode --app-fg is #ffffff', () => {
    const vars = buildAppVars('dark', palette)
    expect(vars['--app-fg']).toBe('#ffffff')
  })

  it('dark mode vars are identical regardless of palette', () => {
    const v1 = buildAppVars('dark', palette)
    const v2 = buildAppVars('dark', generatePalette('#ff6600'))
    expect(v1).toEqual(v2)
  })

  it('light mode returns exactly 8 vars', () => {
    const vars = buildAppVars('light', palette)
    expect(Object.keys(vars)).toHaveLength(8)
  })

  it('light mode --app-bg uses palette.light[0].hex', () => {
    const vars = buildAppVars('light', palette)
    expect(vars['--app-bg']).toBe(palette.light[0].hex)
  })

  it('light mode --app-fg uses palette.light[11].hex', () => {
    const vars = buildAppVars('light', palette)
    expect(vars['--app-fg']).toBe(palette.light[11].hex)
  })

  it('light mode --app-border uses palette.light[5].hex', () => {
    const vars = buildAppVars('light', palette)
    expect(vars['--app-border']).toBe(palette.light[5].hex)
  })

  it('light mode --app-surface uses palette.light[1].hex', () => {
    const vars = buildAppVars('light', palette)
    expect(vars['--app-surface']).toBe(palette.light[1].hex)
  })

  it('light mode vars change when palette changes', () => {
    const v1 = buildAppVars('light', palette)
    const v2 = buildAppVars('light', generatePalette('#ff6600'))
    expect(v1['--app-bg']).not.toBe(v2['--app-bg'])
  })
})
