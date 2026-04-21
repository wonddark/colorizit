import { useState } from 'react'
import { ColorInput } from './components/ColorInput'

const DEFAULT_COLOR = '#3D63DD'

export default function App() {
  const [color, setColor] = useState(DEFAULT_COLOR)
  return (
    <div className="min-h-screen bg-[#111] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <ColorInput value={color} onChange={setColor} />
        <p className="mt-4 text-white/40 font-mono text-sm">{color}</p>
      </div>
    </div>
  )
}
