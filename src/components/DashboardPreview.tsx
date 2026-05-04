import type {CSSProperties} from 'react'
import type {BackgroundResult, PaletteResult} from '../lib/generatePalette'
import Button from "./button.tsx";
import Input from "./input.tsx";
import Card from "./card.tsx";

type Props = {
    palette: PaletteResult
    gray: PaletteResult
    background: BackgroundResult
    complementarPalette?: PaletteResult
    theme: 'light' | 'dark'
}

const ID = 'dashboard-preview'

export function DashboardPreview(props: Readonly<Props>) {
    const {palette, gray, background, theme, complementarPalette} = props;
    const p = theme === 'light' ? palette.light : palette.dark
    const g = theme === 'light' ? gray.light : gray.dark
    const bg = theme === 'light' ? background.light : background.dark
    const c = theme === "light" ? complementarPalette?.light ?? [] : complementarPalette?.dark ?? []

    const vars = {
        '--p1': p[0].oklch,
        '--p2': p[1].oklch,
        '--p3': p[2].oklch,
        '--p4': p[3].oklch,
        '--p5': p[4].oklch,
        '--p6': p[5].oklch,
        '--p7': p[6].oklch,
        '--p8': p[7].oklch,
        '--p9': p[8].oklch,
        '--p10': p[9].oklch,
        '--p11': p[10].oklch,
        '--p12': p[11].oklch,
        '--g1': g[0].oklch,
        '--g2': g[1].oklch,
        '--g3': g[2].oklch,
        '--g4': g[3].oklch,
        '--g5': g[4].oklch,
        '--g6': g[5].oklch,
        '--g7': g[6].oklch,
        '--g8': g[7].oklch,
        '--g9': g[8].oklch,
        '--g10': g[9].oklch,
        '--g11': g[10].oklch,
        '--g12': g[11].oklch,
        '--c1': c[0].oklch,
        '--c2': c[1].oklch,
        '--c3': c[2].oklch,
        '--c4': c[3].oklch,
        '--c5': c[4].oklch,
        '--c6': c[5].oklch,
        '--c7': c[6].oklch,
        '--c8': c[7].oklch,
        '--c9': c[8].oklch,
        '--c10': c[9].oklch,
        '--c11': c[10].oklch,
        '--c12': c[11].oklch,
        '--bg': bg.oklch,
    } as CSSProperties

    return (
        <div
            id={ID}
            className="px-3 py-6"
            style={{
                ...vars,
                background: 'var(--bg)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
        >
            <style>{`
        #${ID} .db-btn:hover { filter: brightness(0.88); }
        #${ID} .db-link:hover { opacity: 0.7; }
      `}</style>
            <div className="grid lg:grid-cols-3 items-start gap-2">
                <Card className="">
                    <img
                        src="https://images.pexels.com/photos/10144918/pexels-photo-10144918.jpeg"
                        alt="pexels-image"
                        className="w-full aspect-video rounded-lg"
                    />
                    <p className="text-lg font-bold mt-3">Starting the
                        adventure</p>
                    <p className="text-sm text-(--g11) line-clamp-3">Lorem
                        ipsum dolor sit amet, consectetur adipisicing elit.
                        Alias aperiam, deserunt ipsa nostrum odio qui soluta
                        totam voluptates. Atque est facilis hic numquam
                        praesentium quidem rem? Commodi delectus eaque
                        sint!</p>
                    <Button className="self-start mt-4">Discover
                        more</Button>
                </Card>
                <Card>
                    <p className="text-2xl font-semibold mb-0.5">Login</p>
                    <p className="text-(--g11) mb-8 text-sm line-clamp-2">Lorem
                        ipsum dolor sit amet, consectetur adipisicing elit. Ab,
                        aspernatur autem dolor doloribus error, eveniet illo
                        iste modi odit perspiciatis porro praesentium quae quia
                        quisquam repellat, rerum sit veritatis voluptatibus!</p>

                    <div className="flex flex-col gap-3">
                        <Input placeholder="john@mailbox.com" label="Email"
                               id="email"/>
                        <Input placeholder="********" label="Password"
                               type="password" id="password"/>
                        <Button>Login</Button>
                        <Button variant="link">Register</Button>
                    </div>
                </Card>
            </div>

            {/* Header */}
            <div style={{
                padding: '11px 18px',
                borderBottom: '1px solid var(--g6)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '99px',
                    background: 'var(--p9)',
                    flexShrink: 0
                }}/>
                <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--g12)',
                    flex: 1
                }}>Acme
                </div>
                <div
                    style={{display: 'flex', gap: '16px', marginRight: '12px'}}>
                    <span style={{
                        fontSize: '11px',
                        color: 'var(--p11)',
                        borderBottom: '1.5px solid var(--p9)',
                        paddingBottom: '1px'
                    }}>Overview</span>
                    <span style={{
                        fontSize: '11px',
                        color: 'var(--g11)'
                    }}>Reports</span>
                    <span style={{
                        fontSize: '11px',
                        color: 'var(--g11)'
                    }}>Settings</span>
                </div>
                <button
                    className="db-btn"
                    style={{
                        padding: '5px 12px',
                        background: 'var(--p9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'filter 0.15s'
                    }}
                >
                    New report
                </button>
            </div>

            {/* Body */}
            <div style={{padding: '18px'}}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--g12)',
                    marginBottom: '3px'
                }}>Overview
                </div>
                <div style={{
                    fontSize: '11px',
                    color: 'var(--g11)',
                    marginBottom: '16px'
                }}>April 2026
                </div>

                {/* Stat cards */}
                <div
                    style={{display: 'flex', gap: '8px', marginBottom: '14px'}}>
                    <div style={{
                        flex: 1,
                        background: 'var(--g1)',
                        border: '1px solid var(--g6)',
                        borderRadius: '8px',
                        padding: '11px 13px'
                    }}>
                        <div style={{
                            fontSize: '9px',
                            color: 'var(--g11)',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                            marginBottom: '4px'
                        }}>Revenue
                        </div>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: 'var(--p11)',
                            lineHeight: 1
                        }}>$24,200
                        </div>
                        <div style={{
                            fontSize: '10px',
                            color: '#3a8f5e',
                            marginTop: '4px'
                        }}>▲ 12% this month
                        </div>
                    </div>
                    <div style={{
                        flex: 1,
                        background: 'var(--g1)',
                        border: '1px solid var(--g6)',
                        borderRadius: '8px',
                        padding: '11px 13px'
                    }}>
                        <div style={{
                            fontSize: '9px',
                            color: 'var(--g11)',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                            marginBottom: '4px'
                        }}>Active users
                        </div>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: 'var(--g12)',
                            lineHeight: 1
                        }}>1,402
                        </div>
                        <div style={{
                            fontSize: '10px',
                            color: 'var(--g11)',
                            marginTop: '4px'
                        }}>▲ 3% this month
                        </div>
                    </div>
                    <div style={{
                        flex: 1,
                        background: 'var(--g1)',
                        border: '1px solid var(--g6)',
                        borderRadius: '8px',
                        padding: '11px 13px'
                    }}>
                        <div style={{
                            fontSize: '9px',
                            color: 'var(--g11)',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                            marginBottom: '4px'
                        }}>Open issues
                        </div>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: 'var(--g12)',
                            lineHeight: 1
                        }}>8
                        </div>
                        <div style={{
                            fontSize: '10px',
                            color: '#a04040',
                            marginTop: '4px'
                        }}>▼ 1 from last week
                        </div>
                    </div>
                </div>

                {/* Client table */}
                <div style={{
                    background: 'var(--g1)',
                    border: '1px solid var(--g6)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    {/* Header row */}
                    <div style={{
                        display: 'flex',
                        padding: '8px 14px',
                        background: 'var(--g2)',
                        borderBottom: '1px solid var(--g6)'
                    }}>
                        <div style={{
                            flex: 3,
                            fontSize: '9px',
                            fontWeight: 600,
                            color: 'var(--g11)',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em'
                        }}>Client
                        </div>
                        <div style={{
                            flex: 2,
                            fontSize: '9px',
                            fontWeight: 600,
                            color: 'var(--g11)',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em'
                        }}>Status
                        </div>
                        <div style={{
                            flex: 2,
                            fontSize: '9px',
                            fontWeight: 600,
                            color: 'var(--g11)',
                            textTransform: 'uppercase',
                            letterSpacing: '.06em'
                        }}>Amount
                        </div>
                        <div style={{flex: 1}}/>
                    </div>
                    {/* Row 1 — Active */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '9px 14px',
                        borderBottom: '1px solid var(--g6)'
                    }}>
                        <div style={{
                            flex: 3,
                            fontSize: '11px',
                            color: 'var(--g12)'
                        }}>Acme Corp
                        </div>
                        <div style={{flex: 2}}>
                            <span style={{
                                padding: '2px 8px',
                                background: 'var(--p3)',
                                color: 'var(--p11)',
                                borderRadius: '99px',
                                fontSize: '10px',
                                fontWeight: 500
                            }}>Active</span>
                        </div>
                        <div style={{
                            flex: 2,
                            fontSize: '11px',
                            color: 'var(--g12)'
                        }}>$4,200
                        </div>
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}>
                            <span className="db-link" style={{
                                fontSize: '10px',
                                color: 'var(--p11)',
                                cursor: 'pointer',
                                transition: 'opacity 0.15s'
                            }}>View →</span>
                        </div>
                    </div>
                    {/* Row 2 — Overdue (hardcoded danger) */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '9px 14px',
                        borderBottom: '1px solid var(--g6)'
                    }}>
                        <div style={{
                            flex: 3,
                            fontSize: '11px',
                            color: 'var(--g12)'
                        }}>Globex Ltd
                        </div>
                        <div style={{flex: 2}}>
                            <span style={{
                                padding: '2px 8px',
                                background: 'color-mix(in oklch, #c84b4b 18%, transparent)',
                                color: '#c84b4b',
                                borderRadius: '99px',
                                fontSize: '10px',
                                fontWeight: 500
                            }}>Overdue</span>
                        </div>
                        <div style={{
                            flex: 2,
                            fontSize: '11px',
                            color: 'var(--g12)'
                        }}>$890
                        </div>
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}>
                            <span className="db-link" style={{
                                fontSize: '10px',
                                color: 'var(--p11)',
                                cursor: 'pointer',
                                transition: 'opacity 0.15s'
                            }}>View →</span>
                        </div>
                    </div>
                    {/* Row 3 — Pending (gray) */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '9px 14px'
                    }}>
                        <div style={{
                            flex: 3,
                            fontSize: '11px',
                            color: 'var(--g12)'
                        }}>Initech
                        </div>
                        <div style={{flex: 2}}>
                            <span style={{
                                padding: '2px 8px',
                                background: 'var(--g2)',
                                color: 'var(--g11)',
                                borderRadius: '99px',
                                fontSize: '10px',
                                fontWeight: 500
                            }}>Pending</span>
                        </div>
                        <div style={{
                            flex: 2,
                            fontSize: '11px',
                            color: 'var(--g12)'
                        }}>$2,100
                        </div>
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}>
                            <span className="db-link" style={{
                                fontSize: '10px',
                                color: 'var(--p11)',
                                cursor: 'pointer',
                                transition: 'opacity 0.15s'
                            }}>View →</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
