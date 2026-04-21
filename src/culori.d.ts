declare module 'culori' {
  type OklchColor = { mode: 'oklch'; l: number; c: number; h: number | undefined }
  type Color = OklchColor | { mode: string; [key: string]: unknown }

  export function parse(color: string): Color | undefined
  export function converter(mode: 'oklch'): (color: Color) => OklchColor | undefined
  export function formatHex(color: Color | undefined): string | undefined
  export function clampChroma(color: OklchColor, mode?: string, gamut?: string): OklchColor
}
