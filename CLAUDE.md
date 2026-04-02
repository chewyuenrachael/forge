# Forge — Goodfire Commercial Intelligence OS

## Mission Context
Forge is the commercial intelligence operating system for Goodfire, a public benefit corporation advancing AI interpretability. Every design decision, data point, and interaction in this application must reflect the same standard of rigor, transparency, and intentionality that defines Goodfire's research.

This application will be reviewed by Goodfire's founding team — engineers and researchers from DeepMind, OpenAI, Harvard, and Stanford. The engineering bar is not "works correctly." It is "works correctly, fails gracefully, explains itself, and earns trust on inspection."

---

## Tech Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Framework | Next.js | 14+ (App Router) | SSR + client interactivity, file-based routing |
| Language | TypeScript | 5.3+ strict mode | Type safety is non-negotiable at a research company |
| Styling | Tailwind CSS | 3.4+ | Utility-first, consistent design tokens |
| Database | SQLite via better-sqlite3 | Latest | Zero-dependency persistence, no external services |
| AI | @anthropic-ai/sdk | Latest | Anthropic API for intelligence features |
| Charts | Recharts | Latest | Composable React charting |
| Icons | Lucide React | Latest | Consistent, MIT-licensed icon set |

---

## Security Requirements

**These are not guidelines. These are invariants. Violating any of these is a build-blocking defect.**

### API Key Handling
- The Anthropic API key lives ONLY in `.env.local`, NEVER committed to git
- `.env.local` is in `.gitignore` — verify this before any commit
- API keys are accessed ONLY through `process.env` in server-side code (API routes, server components)
- NEVER import, reference, or expose `ANTHROPIC_API_KEY` in any file under `src/components/` or any `"use client"` module
- NEVER log API keys, even partially. No `console.log(key.substring(0, 5))` patterns
- API route handlers must validate that the key exists before making calls and return a typed error if missing — not a stack trace

### Input Sanitization
- ALL user inputs from forms (IntakeForm, ROI Calculator, search fields) must be sanitized before:
  - Database insertion (parameterized queries ONLY — never string interpolation into SQL)
  - Rendering in the DOM (React handles this by default, but never use `dangerouslySetInnerHTML` without explicit sanitization)
  - Passing to the Anthropic API as prompt content
- Maximum input lengths must be enforced:
  - Text inputs: 500 characters
  - Textarea fields: 5,000 characters
  - Search queries: 200 characters
- Reject or truncate inputs exceeding these limits before processing

### Database Security
- Use parameterized queries exclusively. The pattern is:
  ```typescript
  // CORRECT
  db.prepare('SELECT * FROM capabilities WHERE id = ?').get(id)
  
  // NEVER — SQL injection vector
  db.prepare(`SELECT * FROM capabilities WHERE id = '${id}'`).get()
  ```
- The SQLite database file (`forge.db`) is in `.gitignore`
- Database initialization and seeding run on first launch only — check for existing data before seeding
- No raw SQL strings constructed from user input anywhere in the codebase

### API Route Hardening
- Every API route must:
  1. Validate the HTTP method (return 405 for unsupported methods)
  2. Parse and validate the request body with explicit type checking
  3. Wrap all logic in try/catch
  4. Return structured error responses: `{ error: string, code: string }` — never raw error messages or stack traces
  5. Set appropriate status codes (200, 400, 404, 500 — never default to 200 for errors)
- Rate limiting: for routes that call the Anthropic API, enforce a simple in-memory rate limit (10 requests/minute per route). This prevents accidental infinite loops during development and demonstrates awareness of API cost management.

### Content Security
- No external script loading except from explicitly trusted CDNs (cdnjs.cloudflare.com for fonts)
- No `eval()`, `Function()`, or dynamic code execution
- No `innerHTML` assignment outside of React's rendering pipeline
- Image sources restricted to local `/public/` directory and explicitly allowlisted domains

### Dependency Hygiene
- Minimize dependencies. Every `npm install` must be justified by a clear need that cannot be met with built-in Node.js/Next.js/React capabilities
- No dependency with fewer than 1,000 weekly npm downloads unless hand-audited
- Pin exact versions in `package.json` (no `^` or `~` prefixes) for reproducible builds
- Run `npm audit` after installation and resolve any high/critical vulnerabilities before proceeding

---

## Engineering Principles

### TypeScript Discipline
- `strict: true` in `tsconfig.json` — this is the first thing a reviewer checks
- No `any` types. If you reach for `any`, you have a design problem. Use `unknown` with type guards, generics, or explicit union types instead
- No `// @ts-ignore` or `// @ts-expect-error` without an adjacent comment explaining exactly why and a linked issue/TODO for resolution
- All function signatures have explicit return types — no implicit inference for exported functions
- Discriminated unions for state machines (loading/success/error patterns):
  ```typescript
  type AsyncState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: string }
  ```

### Error Handling Philosophy
- Errors are data, not exceptions. The codebase distinguishes between:
  - **Expected errors** (invalid input, missing data, API rate limit): handled with result types, displayed to user with actionable message
  - **Unexpected errors** (database corruption, network failure): caught at boundaries, logged with context, displayed as generic "something went wrong" with a recovery action
- Every `try/catch` must either:
  1. Handle the error specifically and recover, OR
  2. Add context and re-throw: `throw new Error(\`Failed to load capabilities: ${e.message}\`)`
- Silent `catch (e) {}` blocks are forbidden. If you catch, you must either handle or log.

### Component Architecture
- Named exports only. No `export default` — it makes refactoring harder and obscures import dependencies
- Components are categorized by responsibility:
  - `ui/` — Pure presentational. Accept data via props, emit events via callbacks. Zero business logic. Zero data fetching. These could be extracted into a standalone component library.
  - `components/{feature}/` — Feature-specific. May fetch data, manage local state, compose UI primitives. These know about the domain.
  - `app/{route}/page.tsx` — Page-level orchestration. Fetches data (server component) or coordinates feature components (client component). Minimal JSX.
- Props interfaces are defined adjacent to the component, not in a global types file, unless shared across 3+ components
- Component files under 200 lines. If a component exceeds this, it has too many responsibilities. Split it.

### State Management
- Local state (`useState`, `useReducer`) for component-scoped state
- URL state (query params via `useSearchParams`) for filterable/shareable state (e.g., active tab, search query, selected capability)
- No global state library. This application is not complex enough to need one. If you think it needs Redux/Zustand, the architecture is wrong.
- Data fetching via `fetch` in server components or `useEffect` + `useState` in client components. No SWR/React Query — keep dependencies minimal.

### Data Integrity
- **Every number displayed in the UI must trace to a published source.** The 58% hallucination reduction comes from the RLFR paper (Prasad et al., Feb 2026). The 68% token savings comes from Reasoning Theater (Boppana et al., Mar 2026). If you cannot cite the source for a number, do not display it.
- **Calculated values must show their work.** The ROI Calculator does not produce magic numbers — it shows the formula: `annualSaving = monthlySpend × reductionFactor × 12`. The user must be able to verify every calculation.
- **Confidence levels are honest.** A "High confidence" projection means the technique has been demonstrated on the same model family in a published paper. "Medium" means it has been demonstrated on a related architecture. "Low" means it is extrapolated from research-stage results. Never inflate confidence to make a sale.
- Seed data is sourced exclusively from Goodfire's published research, blog posts, and press releases. No invented metrics, no speculative partner data, no fabricated quotes.

### Performance Standards
- Pages must render meaningful content within 1 second on localhost
- No layout shift after initial render (all containers have defined heights or skeleton states)
- Images are optimized (`next/image` with explicit width/height)
- Bundle size monitored: no single page JS bundle should exceed 200KB gzip
- Database queries are indexed on columns used in WHERE clauses
- Recharts components are lazy-loaded (`dynamic import`) since they are heavy and below-the-fold on most pages

### Testing Approach
- For this proof-of-work build, the verification strategy is:
  1. `npm run build` must succeed with zero errors and zero warnings
  2. Every page renders without runtime errors (manually verify by navigating to each route)
  3. The ROI Calculator produces correct results for known inputs (spot-check: $100K/month inference spend with reasoning models should show ~$68K/month savings citing the Reasoning Theater benchmark)
  4. Database seed data matches published Goodfire research (cross-reference against seed-data skill)
- If this were a production application, every API route and calculation function would have unit tests. For the proof-of-work, correctness is verified by inspection and compilation.

---

## Design System

### Philosophy
This is a professional intelligence dashboard for a research company. The design communicates: **precision, depth, trustworthiness.** It does not communicate: playfulness, consumer friendliness, or startup informality.

Reference: Bloomberg Terminal (information density), Linear (interaction quality), Notion (typographic clarity), Palantir Gotham (analytical seriousness).

### Color Tokens

Define these as CSS custom properties in `globals.css` AND as Tailwind extensions in `tailwind.config.ts`. Every color in the application must reference a token — no raw hex values in component code.

```
--color-bg-base: #0A0A0F          /* Page background — near-black with blue undertone */
--color-bg-surface: #12121A       /* Card/panel background */
--color-bg-elevated: #1A1A25      /* Hover states, active panels, dropdowns */
--color-bg-overlay: #000000CC     /* Modal backdrop — black at 80% opacity */

--color-border-subtle: #1E1E2A    /* Default borders — barely visible */
--color-border-default: #2A2A3A   /* Emphasized borders — visible but quiet */
--color-border-strong: #3A3A4A    /* Focus rings, active states */

--color-text-primary: #E8E8F0     /* Body text, headings */
--color-text-secondary: #8888A0   /* Labels, descriptions, metadata */
--color-text-tertiary: #5A5A70    /* Disabled states, decorative text */
--color-text-inverse: #0A0A0F     /* Text on accent backgrounds */

--color-accent-amber: #F5A623     /* Primary actions, key metrics, brand accent */
--color-accent-amber-hover: #FFB84D
--color-accent-amber-muted: #F5A62320  /* Amber at 12% opacity — subtle highlights */

--color-accent-blue: #4A9EFF      /* Links, secondary actions, info states */
--color-accent-green: #34D399     /* Success, positive trends, production-proven */
--color-accent-red: #EF4444       /* Errors, alerts, negative trends */
--color-accent-purple: #A78BFA    /* Research indicators, science-related */

--color-chart-1: #F5A623          /* Primary chart color */
--color-chart-2: #4A9EFF          /* Secondary chart color */
--color-chart-3: #34D399          /* Tertiary chart color */
--color-chart-4: #A78BFA          /* Quaternary chart color */
--color-chart-5: #EF4444          /* Quinary chart color */
```

### Typography

Load via `next/font/google` in `src/app/layout.tsx`. No external stylesheet links.

| Role | Font | Weight | Size | Tracking | Usage |
|---|---|---|---|---|---|
| Display | Fraunces | 600 | 28-36px | -0.02em | Page titles, hero metrics |
| Heading | DM Sans | 600 | 18-24px | -0.01em | Section headers, card titles |
| Body | DM Sans | 400 | 14-16px | 0 | Body text, descriptions |
| Label | DM Sans | 500 | 12-13px | 0.02em (uppercase) | Metadata labels, column headers |
| Mono | JetBrains Mono or DM Mono | 400 | 13-14px | 0 | Data values, metrics, code, benchmarks |

The monospace accent is critical. Numbers, percentages, dollar amounts, and benchmark values must render in the mono font. This communicates precision. A metric displayed in DM Sans says "approximately." A metric displayed in JetBrains Mono says "exactly."

### Spacing System

Use Tailwind's default spacing scale. These are the most-used values:

| Token | Value | Usage |
|---|---|---|
| `p-4` / `gap-4` | 16px | Default card padding, grid gaps |
| `p-6` | 24px | Page section padding |
| `p-8` | 32px | Page container padding |
| `space-y-1` | 4px | Tight vertical rhythm (within a card) |
| `space-y-3` | 12px | Default vertical rhythm (between elements) |
| `space-y-6` | 24px | Section separation |
| `space-y-10` | 40px | Major section breaks |

### Component Design Rules

**Cards:**
- Background: `bg-surface` (var `--color-bg-surface`)
- Border: 1px `border-subtle`
- Border radius: `rounded-lg` (8px) — not `rounded-xl` or `rounded-full`. This is a precision tool, not a consumer app.
- Padding: `p-4` for compact, `p-6` for standard
- Hover: elevate to `bg-elevated` with `transition-colors duration-150`
- No drop shadows. Shadows imply depth hierarchy that doesn't exist in a flat dashboard. Use borders instead.

**Buttons:**
- Primary: `bg-accent-amber text-inverse` with `hover:bg-accent-amber-hover`. Used for ONE action per view — the most important CTA.
- Secondary: `border border-default text-primary` with `hover:bg-elevated`. Used for supporting actions.
- Ghost: `text-secondary hover:text-primary hover:bg-elevated`. Used for inline/toolbar actions.
- All buttons: `h-9 px-4 text-sm font-medium rounded-md transition-colors duration-150`
- Disabled state: `opacity-50 cursor-not-allowed` — do not change color, just reduce opacity.

**Badges:**
- Small, pill-shaped labels: `px-2 py-0.5 text-xs font-medium rounded-md`
- Variants: amber (primary), blue (info), green (success/production), red (alert), purple (research), gray (neutral)
- Background: accent color at 15% opacity. Text: accent color at full saturation. Example: green badge = `bg-green-500/15 text-green-400`

**Tables:**
- Header row: `text-xs uppercase tracking-wider text-secondary font-medium` with bottom border
- Data rows: `text-sm text-primary` with subtle bottom border (`border-subtle`)
- Alternating rows: not needed if borders are present. If used, alternate with `bg-surface` and `bg-base`
- Numeric columns: right-aligned, monospace font
- Sortable columns: header shows sort indicator icon (ChevronUp/Down from Lucide)
- Cell padding: `px-4 py-3`

**Inputs:**
- Background: `bg-base` (darker than card surface)
- Border: `border-default`, focus: `border-accent-amber ring-1 ring-accent-amber/30`
- Text: `text-primary`
- Placeholder: `text-tertiary`
- Height: `h-9` for single-line, auto for textarea
- Font: inherit (DM Sans), except for numeric inputs which use monospace

**Metric Cards:**
- Large number in Fraunces 600, 28-36px, `text-primary`
- Label below in DM Sans 500, 12px uppercase, `text-secondary`
- Trend indicator: small inline badge with arrow icon + percentage. Green for positive, red for negative.
- Monospace font for all numeric values.

### Layout Architecture

```
┌─────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌────────────────────────────────────┐ │
│ │          │ │ Header (sticky top)                 │ │
│ │ Sidebar  │ ├────────────────────────────────────┤ │
│ │ (fixed   │ │                                    │ │
│ │  left,   │ │ PageContainer                      │ │
│ │  w-64)   │ │ (scrollable, max-w-[1400px],       │ │
│ │          │ │  mx-auto, px-8, py-6)              │ │
│ │          │ │                                    │ │
│ │          │ │  ┌──── Page Content ────┐          │ │
│ │          │ │  │                      │          │ │
│ │          │ │  │  Grid layouts:       │          │ │
│ │          │ │  │  - 4-col for metrics │          │ │
│ │          │ │  │  - 2-col for panels  │          │ │
│ │          │ │  │  - 1-col for tables  │          │ │
│ │          │ │  │                      │          │ │
│ │          │ │  └──────────────────────┘          │ │
│ └──────────┘ └────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Sidebar:**
- Fixed position, full viewport height
- Width: 256px (`w-64`), collapsible to 64px (`w-16`) icon-only mode
- Background: `bg-base` with right border `border-subtle`
- Logo/wordmark at top: "FORGE" in Fraunces 600, 18px, `text-accent-amber`, tracking wide
- Navigation items: Lucide icon + label. Active state: amber left border (3px), `text-primary`, `bg-elevated`. Inactive: `text-secondary`, `hover:text-primary hover:bg-elevated`
- Navigation order: Overview, GTM Command Center, Solution Architect, Narrative Engine, Research Delivery, Operations
- Bottom section: "Built for Goodfire" small text in `text-tertiary`

**Header:**
- Sticky top within the main content area
- Height: 56px (`h-14`)
- Shows: page title (Fraunces 600, 20px) + optional subtitle (`text-secondary`, 14px)
- Right side: context indicator (e.g., days until EU AI Act deadline as a small badge)
- Bottom border: `border-subtle`

### Interaction Design

- **Transitions:** All interactive elements use `transition-colors duration-150 ease-in-out`. No jarring state changes.
- **Focus states:** Visible focus ring on all interactive elements (`ring-2 ring-accent-amber/40 ring-offset-2 ring-offset-base`). Keyboard accessibility is a professional standard, not an optional feature.
- **Loading states:** Skeleton placeholders matching the shape of expected content. Use `animate-pulse` on `bg-elevated` rectangles. Never show a blank page or a spinner without context.
- **Empty states:** When a list or feed has no items, display a centered message with an icon, a short explanation, and an action (e.g., "No signals detected. Signals will appear as external events match Goodfire capabilities."). Never show a blank container.
- **Hover feedback:** Cards and list items show subtle background change. Buttons show color change. Links show underline. Every clickable element must communicate "I am interactive" on hover.

### Responsive Considerations
- The primary target is desktop (1440px-1920px). This is a work tool, not a consumer product.
- Minimum supported width: 1280px. Below this, the sidebar collapses to icon-only.
- Do not invest time in mobile layouts. If someone views on mobile, it should not crash, but it does not need to be optimized.

---

## Architecture

```
forge/
├── CLAUDE.md
├── .gitignore                     # Includes: .env.local, forge.db, node_modules, .next
├── .env.local.example             # Template: ANTHROPIC_API_KEY=your_key_here
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── README.md
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout: fonts, sidebar, header
│   │   ├── page.tsx               # Dashboard overview
│   │   ├── globals.css            # Tailwind + CSS custom properties
│   │   ├── gtm/
│   │   │   └── page.tsx           # GTM Command Center
│   │   ├── solutions/
│   │   │   └── page.tsx           # Solution Architect
│   │   ├── narratives/
│   │   │   └── page.tsx           # Narrative Engine
│   │   ├── delivery/
│   │   │   └── page.tsx           # Research Delivery Hub
│   │   ├── ops/
│   │   │   └── page.tsx           # Operations Dashboard
│   │   └── api/
│   │       ├── knowledge/
│   │       │   └── route.ts       # Knowledge Graph CRUD
│   │       ├── signals/
│   │       │   └── route.ts       # External signal processing
│   │       ├── roi/
│   │       │   └── route.ts       # ROI calculations
│   │       ├── scoper/
│   │       │   └── route.ts       # Engagement scoping
│   │       └── narrative/
│   │           └── route.ts       # Narrative generation
│   ├── components/
│   │   ├── ui/                    # Pure presentational primitives
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── MetricCard.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── PageContainer.tsx
│   │   ├── gtm/
│   │   │   ├── SignalFeed.tsx
│   │   │   ├── ProspectCard.tsx
│   │   │   ├── OutreachDraft.tsx
│   │   │   └── ROICalculator.tsx
│   │   ├── solutions/
│   │   │   ├── IntakeForm.tsx
│   │   │   ├── CapabilityMatch.tsx
│   │   │   ├── SolutionSimulation.tsx
│   │   │   └── ProposalPreview.tsx
│   │   ├── narratives/
│   │   │   ├── DiscourseMonitor.tsx
│   │   │   ├── ContentCalendar.tsx
│   │   │   ├── NarrativeDraft.tsx
│   │   │   └── AudienceFramer.tsx
│   │   ├── delivery/
│   │   │   ├── EngagementTracker.tsx
│   │   │   ├── KnowledgeRetrieval.tsx
│   │   │   └── PartnerReport.tsx
│   │   └── ops/
│   │       ├── PipelineView.tsx
│   │       ├── RevenueMetrics.tsx
│   │       └── EngagementHealth.tsx
│   ├── lib/
│   │   ├── db.ts                  # SQLite connection, schema, initialization
│   │   ├── knowledge-graph.ts     # Knowledge graph query functions
│   │   ├── anthropic.ts           # Anthropic API client with error handling
│   │   ├── signals.ts             # Signal detection and matching logic
│   │   ├── roi-engine.ts          # ROI calculation engine
│   │   └── constants.ts           # Shared constants, enums, config values
│   ├── data/
│   │   └── seed.ts                # Database seed from published research
│   └── types/
│       └── index.ts               # All TypeScript type definitions
└── public/
    └── goodfire-logo.svg
```

---

## Code Style

### Naming Conventions
- **Files:** kebab-case for utilities (`roi-engine.ts`), PascalCase for components (`ROICalculator.tsx`)
- **Variables/functions:** camelCase. Descriptive names. `calculateAnnualSavings()` not `calcSav()`
- **Types/interfaces:** PascalCase. Prefix with `I` only for interfaces that describe a contract (never for data shapes). `Capability` not `ICapability` for data. `Searchable` for a behavioral interface.
- **Constants:** UPPER_SNAKE_CASE for true constants (`MAX_INPUT_LENGTH = 500`), camelCase for configuration objects
- **Database columns:** snake_case (`created_at`, `partner_name`)
- **CSS custom properties:** kebab-case with semantic prefixes (`--color-bg-surface`, `--color-text-primary`)

### Import Order
```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { BarChart, Bar, XAxis, YAxis } from 'recharts'
import { Search, ChevronDown } from 'lucide-react'

// 3. Internal: lib/utils
import { calculateROI } from '@/lib/roi-engine'
import { getAllCapabilities } from '@/lib/knowledge-graph'

// 4. Internal: components
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

// 5. Internal: types
import type { Capability, ROIResult } from '@/types'
```

### Component Pattern
```typescript
// Standard component structure
import { type FC } from 'react'
import { Card } from '@/components/ui/Card'
import type { Capability } from '@/types'

interface CapabilityCardProps {
  capability: Capability
  isActive?: boolean
  onSelect: (id: string) => void
}

export const CapabilityCard: FC<CapabilityCardProps> = ({
  capability,
  isActive = false,
  onSelect,
}) => {
  return (
    <Card className={isActive ? 'border-accent-amber' : ''}>
      {/* Component content */}
    </Card>
  )
}
```

### API Route Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAllCapabilities } from '@/lib/knowledge-graph'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('search')
    
    // Input validation
    if (query && query.length > 200) {
      return NextResponse.json(
        { error: 'Search query exceeds maximum length', code: 'INPUT_TOO_LONG' },
        { status: 400 }
      )
    }
    
    const capabilities = query
      ? searchCapabilities(query)
      : getAllCapabilities()
    
    return NextResponse.json({ data: capabilities })
  } catch (error) {
    console.error('Knowledge API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

// Explicitly reject unsupported methods
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  )
}
```

---

## Graceful Degradation

The application must function at three levels:

**Level 1: Full (Anthropic API key present)**
All features work. AI-powered signal matching, outreach drafting, narrative generation, and partner report translation use the Anthropic API.

**Level 2: Demo (no API key)**
All interfaces render with seed data. AI-powered features show a clearly labeled "Demo Mode" badge and use template-based generation instead of API calls. The ROI Calculator, Knowledge Graph, Solution Architect matching, and all navigation work fully.

**Level 3: Error (database failure)**
If SQLite fails to initialize, the app displays a clear error page with the specific issue and recovery instructions. It does not show a blank screen or cryptic error.

Detection logic in `src/lib/anthropic.ts`:
```typescript
export const isAPIAvailable = (): boolean => {
  return !!process.env.ANTHROPIC_API_KEY
}
```

Components that use AI features must check availability and render the appropriate fallback.

---

## Commit Hygiene

- Meaningful commit messages: `feat: add ROI calculator with RLFR and Reasoning Theater benchmarks`
- Prefix conventions: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`
- Never commit `.env.local`, `forge.db`, `node_modules`, `.next`
- Verify `.gitignore` includes all sensitive and generated files before initial commit

---

## Final Quality Gate

Before considering the build complete, verify each item:

- [ ] `npm run build` succeeds with zero errors AND zero warnings
- [ ] `npx tsc --noEmit` passes with zero type errors
- [ ] Every page renders at `localhost:3000` without console errors
- [ ] Navigation between all 6 pages works via sidebar
- [ ] ROI Calculator computes correct results (spot-check against published benchmarks)
- [ ] All displayed research data matches published Goodfire papers
- [ ] No `any` types in the codebase (search: `grep -r ": any" src/`)
- [ ] No raw SQL string interpolation (search: `grep -r "\\${" src/lib/db.ts`)
- [ ] `.env.local` is in `.gitignore`
- [ ] `forge.db` is in `.gitignore`
- [ ] Fonts render correctly (DM Sans body, Fraunces display, monospace metrics)
- [ ] Keyboard focus is visible on all interactive elements
- [ ] Empty and loading states are handled for every data display
- [ ] App runs correctly without `ANTHROPIC_API_KEY` (demo mode)