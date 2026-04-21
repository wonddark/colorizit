import { useEffect, useRef, useState } from 'react'
import { parse, formatHex } from 'culori'

type Props = {
  value: string
  onChange: (hex: string) => void
}

function tryParseToHex(input: string): string | null {
  const parsed = parse(input.trim())
  return parsed ? (formatHex(parsed) ?? null) : null
}

export function ColorInput({ value, onChange }: Props) {
  const [displayColor, setDisplayColor] = useState(value)
  const [text, setText] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setDisplayColor(value)
    setText(value)
  }, [value])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setDisplayColor(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), 150)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    clearTimeout(timerRef.current)
    setText(v)
    const hex = tryParseToHex(v)
    if (hex) onChange(hex)
  }

  const handleTextBlur = () => {
    const hex = tryParseToHex(text)
    if (!hex) setText(value)
  }

  return (
    <div className="flex items-center gap-3">
      <label className="cursor-pointer shrink-0">
        <input
          type="color"
          value={displayColor}
          onChange={handlePickerChange}
          className="sr-only"
        />
        <div
          className="w-11 h-11 rounded-xl border border-white/10 shadow-md"
          style={{ background: displayColor }}
        />
      </label>
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        spellCheck={false}
        className="font-mono text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white w-32 focus:outline-none focus:border-white/30"
      />
      <span className="text-sm text-white/30">Pick a color to generate your palette</span>
    </div>
  )
}
