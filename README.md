# Forge — Goodfire Commercial Intelligence OS

Forge transforms Goodfire's frontier interpretability research into a shared operational layer for every customer-facing role. It is a cross-functional intelligence system with five interfaces built on a unified Research Knowledge Graph.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Optionally, add an Anthropic API key to `.env.local` for AI-powered features:
```
ANTHROPIC_API_KEY=your_key_here
```

The app works fully in demo mode without an API key.

## Interfaces

- **Dashboard** — Research capability overview, timeline, and solution map
- **GTM Command Center** — Signal detection, prospect intelligence, ROI calculator with real Goodfire benchmarks
- **Solution Architect** — Three-stage engagement scoper: intake → capability match → simulation → proposal
- **Narrative Engine** — Discourse monitoring, content calendar, audience-specific framing
- **Research Delivery Hub** — Active engagement tracking and milestone management
- **Operations** — Cross-functional metrics and pipeline visibility

## Data Integrity

Every metric, benchmark, and capability reference in Forge traces to Goodfire's published research. The ROI Calculator uses conservative estimates grounded in:
- RLFR (Prasad et al., Feb 2026): 58% hallucination reduction, 90x cheaper than LLM-as-judge
- Reasoning Theater (Boppana et al., Mar 2026): 68% token savings on MMLU via probe-guided early exit
- Rakuten PII Detection (Nguyen et al., Oct 2025): SAE probes deployed at 44M+ users

## Built By

Rachael Chew — [rachaelchew.com](https://rachaelchew.com)
Built as proof-of-work for Goodfire.
