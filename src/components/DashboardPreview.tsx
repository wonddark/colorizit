import type {CSSProperties} from 'react'
import type {BackgroundResult, PaletteResult} from '../lib/generatePalette'

type Props = {
  palette: PaletteResult
  gray: PaletteResult
  background: BackgroundResult
  complementarPalette?: PaletteResult
  theme: 'light' | 'dark'
}

const ID = 'dashboard-preview'

export function DashboardPreview(props: Readonly<Props>) {
  const { palette, gray, background, theme } = props;
  const p = theme === 'light' ? palette.light : palette.dark
  const g = theme === 'light' ? gray.light : gray.dark
  const bg = theme === 'light' ? background.light : background.dark

  const vars = {
    '--p3':  p[2].oklch,
    '--p9':  p[8].oklch,
    '--p11': p[10].oklch,
    '--g1':  g[0].oklch,
    '--g2':  g[1].oklch,
    '--g6':  g[5].oklch,
    '--g11': g[10].oklch,
    '--g12': g[11].oklch,
    '--bg':  bg.oklch,
  } as CSSProperties

  return (
    <div
      id={ID}
      style={{ ...vars, background: 'var(--bg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <style>{`
        #${ID} .db-btn:hover { filter: brightness(0.88); }
        #${ID} .db-link:hover { opacity: 0.7; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '11px 18px', borderBottom: '1px solid var(--g6)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '99px', background: 'var(--p9)', flexShrink: 0 }} />
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--g12)', flex: 1 }}>Acme</div>
        <div style={{ display: 'flex', gap: '16px', marginRight: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--p11)', borderBottom: '1.5px solid var(--p9)', paddingBottom: '1px' }}>Overview</span>
          <span style={{ fontSize: '11px', color: 'var(--g11)' }}>Reports</span>
          <span style={{ fontSize: '11px', color: 'var(--g11)' }}>Settings</span>
        </div>
        <button
          className="db-btn"
          style={{ padding: '5px 12px', background: 'var(--p9)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', transition: 'filter 0.15s' }}
        >
          New report
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '18px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g12)', marginBottom: '3px' }}>Overview</div>
        <div style={{ fontSize: '11px', color: 'var(--g11)', marginBottom: '16px' }}>April 2026</div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <div style={{ flex: 1, background: 'var(--g1)', border: '1px solid var(--g6)', borderRadius: '8px', padding: '11px 13px' }}>
            <div style={{ fontSize: '9px', color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Revenue</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--p11)', lineHeight: 1 }}>$24,200</div>
            <div style={{ fontSize: '10px', color: '#3a8f5e', marginTop: '4px' }}>▲ 12% this month</div>
          </div>
          <div style={{ flex: 1, background: 'var(--g1)', border: '1px solid var(--g6)', borderRadius: '8px', padding: '11px 13px' }}>
            <div style={{ fontSize: '9px', color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Active users</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--g12)', lineHeight: 1 }}>1,402</div>
            <div style={{ fontSize: '10px', color: 'var(--g11)', marginTop: '4px' }}>▲ 3% this month</div>
          </div>
          <div style={{ flex: 1, background: 'var(--g1)', border: '1px solid var(--g6)', borderRadius: '8px', padding: '11px 13px' }}>
            <div style={{ fontSize: '9px', color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>Open issues</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--g12)', lineHeight: 1 }}>8</div>
            <div style={{ fontSize: '10px', color: '#a04040', marginTop: '4px' }}>▼ 1 from last week</div>
          </div>
        </div>

        {/* Client table */}
        <div style={{ background: 'var(--g1)', border: '1px solid var(--g6)', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'flex', padding: '8px 14px', background: 'var(--g2)', borderBottom: '1px solid var(--g6)' }}>
            <div style={{ flex: 3, fontSize: '9px', fontWeight: 600, color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Client</div>
            <div style={{ flex: 2, fontSize: '9px', fontWeight: 600, color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Status</div>
            <div style={{ flex: 2, fontSize: '9px', fontWeight: 600, color: 'var(--g11)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Amount</div>
            <div style={{ flex: 1 }} />
          </div>
          {/* Row 1 — Active */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid var(--g6)' }}>
            <div style={{ flex: 3, fontSize: '11px', color: 'var(--g12)' }}>Acme Corp</div>
            <div style={{ flex: 2 }}>
              <span style={{ padding: '2px 8px', background: 'var(--p3)', color: 'var(--p11)', borderRadius: '99px', fontSize: '10px', fontWeight: 500 }}>Active</span>
            </div>
            <div style={{ flex: 2, fontSize: '11px', color: 'var(--g12)' }}>$4,200</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <span className="db-link" style={{ fontSize: '10px', color: 'var(--p11)', cursor: 'pointer', transition: 'opacity 0.15s' }}>View →</span>
            </div>
          </div>
          {/* Row 2 — Overdue (hardcoded danger) */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid var(--g6)' }}>
            <div style={{ flex: 3, fontSize: '11px', color: 'var(--g12)' }}>Globex Ltd</div>
            <div style={{ flex: 2 }}>
              <span style={{ padding: '2px 8px', background: 'color-mix(in oklch, #c84b4b 18%, transparent)', color: '#c84b4b', borderRadius: '99px', fontSize: '10px', fontWeight: 500 }}>Overdue</span>
            </div>
            <div style={{ flex: 2, fontSize: '11px', color: 'var(--g12)' }}>$890</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <span className="db-link" style={{ fontSize: '10px', color: 'var(--p11)', cursor: 'pointer', transition: 'opacity 0.15s' }}>View →</span>
            </div>
          </div>
          {/* Row 3 — Pending (gray) */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px' }}>
            <div style={{ flex: 3, fontSize: '11px', color: 'var(--g12)' }}>Initech</div>
            <div style={{ flex: 2 }}>
              <span style={{ padding: '2px 8px', background: 'var(--g2)', color: 'var(--g11)', borderRadius: '99px', fontSize: '10px', fontWeight: 500 }}>Pending</span>
            </div>
            <div style={{ flex: 2, fontSize: '11px', color: 'var(--g12)' }}>$2,100</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <span className="db-link" style={{ fontSize: '10px', color: 'var(--p11)', cursor: 'pointer', transition: 'opacity 0.15s' }}>View →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
