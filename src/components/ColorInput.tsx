import {useEffect, useRef, useState} from 'react'
import {formatHex, parse} from 'culori'

type Props = {
  value: string
  onChange: (hex: string) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M11.2 4.8l-1.4 1.4M4.8 11.2l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 9.5A5.5 5.5 0 016 2.5a5.5 5.5 0 100 11 5.5 5.5 0 006.5-4z" fill="currentColor"/>
    </svg>
  )
}

function tryParseToHex(input: string): string | null {
  const parsed = parse(input.trim())
  return parsed ? (formatHex(parsed) ?? null) : null
}

export function ColorInput(props: Readonly<Props>) {
    const { value, onChange, theme, onToggleTheme } = props;
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
    <div className="flex items-center h-9">
      <label className="cursor-pointer shrink-0 h-full aspect-square">
        <span className="sr-only">Color input</span>
          <input
          type="color"
          value={displayColor}
          onChange={handlePickerChange}
          className="sr-only"
        />
        <div
          className="h-full w-full rounded-l-lg border border-(--app-border) shadow-md"
          style={{ background: displayColor }}
        />
      </label>
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        spellCheck={false}
        className="font-mono text-sm px-3 py-2 rounded-r-lg bg-(--app-surface) border border-(--app-border) text-(--app-fg) w-32 h-full focus:outline-none focus:border-(--app-border-strong)"
      />
      <span className="text-sm text-(--app-fg-muted) ml-auto">
        Pick a color to generate your palette
      </span>
      <button
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-(--app-surface) border border-(--app-border) text-(--app-fg-muted) hover:text-(--app-fg) hover:bg-(--app-surface-hover) transition-colors shrink-0"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  )
}
