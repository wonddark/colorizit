# Colorizit

A **color palette generator** that produces Radix-style 12-step color scales from a single seed color, with full light/dark theme support and WCAG AA-compliant backgrounds.

## Features

- **12-step palette generation** — creates smooth light and dark scales using OKLCH color space
- **Neutral & tinted grays** — generates both achromatic and hue-tinted gray palettes
- **Color harmonies** — complementary palette suggestions
- **AA-compliant backgrounds** — binary-searched backgrounds that meet WCAG contrast requirements
- **Live preview** — dashboard-style preview panel showing how colors work together
- **Theme toggle** — switch between light and dark modes
- **Export** — shadcn/ui-compatible CSS variable token output

## Tech Stack

| Category | Tools |
|----------|-------|
| Framework | React 19, TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Color science | culori 4 (OKLCH, WCAG contrast) |
| Testing | Vitest |
| Linting | ESLint 9, typescript-eslint |

## Getting Started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173` in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Run unit tests |
| `pnpm lint` | Run ESLint |

## How It Works

1. **Input** — enter any hex color or use the color picker
2. **Palette** — the seed hue is mapped onto predefined OKLCH lightness/chrom waypoints to produce 12-step light and dark scales
3. **Grays** — a neutral (zero chroma) and tinted (seed hue, low chroma) gray scale are generated
4. **Background** — the system first checks whether the extreme gray steps pass AA contrast; if not, it binary-searches for the closest passing lightness
5. **Preview** — a live dashboard renders components using the generated CSS variables

## Project Structure

```
src/
├── components/
│   ├── App.tsx               # Root component, state orchestration
│   ├── BackgroundSwatch.tsx  # AA background contrast display
│   ├── button.tsx            # Shadcn-style button primitive
│   ├── card.tsx              # Shadcn-style card primitive
│   ├── ColorInput.tsx        # Color picker + theme toggle
│   ├── DashboardPreview.tsx  # Live dashboard preview
│   ├── ExportPanel.tsx       # Token export panel
│   ├── HarmonySuggestions.tsx # Complementary palette cards
│   ├── input.tsx             # Shadcn-style input primitive
│   ├── PaletteScale.tsx      # 12-step scale renderer
│   └── PreviewPanel.tsx      # Preview panel wrapper
├── lib/
│   ├── buildAppVars.ts       # CSS variable builder
│   ├── buildTokens.ts        # Token export builders
│   └── generatePalette.ts    # Core palette/gray/harmony/background logic
├── __tests__/
│   ├── buildAppVars.test.ts
│   ├── exportBuilders.test.ts
│   └── generatePalette.test.ts
├── index.css                 # Global styles + Tailwind
└── main.tsx                  # Entry point
```

## License

MIT
