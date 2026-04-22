import { useState } from 'react'
import type { TokenSet } from '../lib/buildTokens'

type Props = {
  id: string
  tokens: TokenSet
  label: string
}

const TABS = ['Overview', 'Activity', 'Settings']

export function ComponentKit({ id, tokens, label }: Props) {
  const [activeTab, setActiveTab] = useState(0)

  const vars = {
    '--preview-bg': tokens.background,
    '--preview-fg': tokens.foreground,
    '--preview-card': tokens.card,
    '--preview-primary': tokens.primary,
    '--preview-primary-fg': tokens['primary-foreground'],
    '--preview-secondary': tokens.secondary,
    '--preview-secondary-fg': tokens['secondary-foreground'],
    '--preview-muted': tokens.muted,
    '--preview-muted-fg': tokens['muted-foreground'],
    '--preview-accent': tokens.accent,
    '--preview-accent-fg': tokens['accent-foreground'],
    '--preview-border': tokens.border,
    '--preview-ring': tokens.ring,
  } as React.CSSProperties

  return (
    <div id={id} style={{ ...vars, background: 'var(--preview-bg)', padding: '28px' }}>
      <style>{`
        #${id} .pk-btn:hover:not(:disabled) { filter: brightness(0.88); }
        #${id} .pk-btn-ghost:hover:not(:disabled) { filter: none; background: var(--preview-muted); }
        #${id} .pk-input:focus { outline: none; border-color: var(--preview-ring); box-shadow: 0 0 0 3px color-mix(in oklch, var(--preview-ring) 25%, transparent); }
        #${id} .pk-tab:hover:not(.pk-tab-active) { color: var(--preview-fg); }
        #${id} .pk-link:hover { opacity: 0.75; }
      `}</style>

      {/* Mode label */}
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px', opacity: 0.35, color: 'var(--preview-fg)' }}>
        {label}
      </div>

      {/* Buttons */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--preview-muted-fg)', marginBottom: '10px' }}>Buttons</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="pk-btn" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: 'var(--preview-primary)', color: 'var(--preview-primary-fg)', transition: 'filter 0.15s' }}>Primary</button>
          <button className="pk-btn" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', background: 'var(--preview-secondary)', color: 'var(--preview-secondary-fg)', transition: 'filter 0.15s' }}>Secondary</button>
          <button className="pk-btn" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1.5px solid var(--preview-border)', color: 'var(--preview-fg)', transition: 'filter 0.15s' }}>Outline</button>
          <button className="pk-btn pk-btn-ghost" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--preview-muted-fg)', transition: 'background 0.15s' }}>Ghost</button>
          <button disabled style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'not-allowed', background: 'var(--preview-primary)', color: 'var(--preview-primary-fg)', opacity: 0.4 }}>Disabled</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--preview-muted-fg)', marginBottom: '10px' }}>Tabs</div>
        <div style={{ display: 'flex', gap: '2px', borderBottom: '1.5px solid var(--preview-border)' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`pk-tab${activeTab === i ? ' pk-tab-active' : ''}`}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === i ? '2px solid var(--preview-primary)' : '2px solid transparent',
                marginBottom: '-1.5px',
                cursor: 'pointer',
                color: activeTab === i ? 'var(--preview-primary)' : 'var(--preview-muted-fg)',
                transition: 'color 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--preview-muted-fg)', marginBottom: '10px' }}>Inputs</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            className="pk-input"
            placeholder="Enter value…"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--preview-border)', background: 'var(--preview-bg)', color: 'var(--preview-fg)', fontSize: '13px', width: '200px', transition: 'border-color 0.15s, box-shadow 0.15s' }}
          />
          <input
            disabled
            placeholder="Disabled"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--preview-border)', background: 'var(--preview-bg)', color: 'var(--preview-fg)', fontSize: '13px', width: '200px', opacity: 0.45, cursor: 'not-allowed' }}
          />
        </div>
      </div>

      {/* Card */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--preview-muted-fg)', marginBottom: '10px' }}>Card</div>
        <div style={{ background: 'var(--preview-card)', border: '1px solid var(--preview-border)', borderRadius: '12px', padding: '16px 20px', maxWidth: '340px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--preview-fg)', marginBottom: '4px' }}>Color Palette</div>
          <div style={{ fontSize: '13px', color: 'var(--preview-muted-fg)', lineHeight: 1.5 }}>
            A 12-step Radix-style scale generated from your brand color.{' '}
            <a className="pk-link" style={{ color: 'var(--preview-primary)', textDecoration: 'underline', cursor: 'pointer', transition: 'opacity 0.15s' }}>Learn more</a>
          </div>
          <span style={{ display: 'inline-block', marginTop: '10px', padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: 'var(--preview-accent)', color: 'var(--preview-accent-fg)' }}>New</span>
        </div>
      </div>

      {/* Typography */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--preview-muted-fg)', marginBottom: '10px' }}>Typography</div>
        <div style={{ fontSize: '14px', color: 'var(--preview-fg)', lineHeight: 1.6 }}>
          Heading text in foreground color.<br />
          <span style={{ color: 'var(--preview-muted-fg)' }}>Muted supporting text sits below the primary content.</span><br />
          <a className="pk-link" style={{ color: 'var(--preview-primary)', textDecoration: 'underline', cursor: 'pointer', transition: 'opacity 0.15s' }}>Inline link example</a>
        </div>
      </div>
    </div>
  )
}
