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

- **Dashboard** — Research capability overview, timeline, solution map, and weekly brief summary
- **Prospect Intelligence** — ICP scoring, peer cluster analysis, dinner planner, burst outreach
- **GTM Command Center** — Signal detection, prospect intelligence, ROI calculator with real Goodfire benchmarks
- **Solution Architect** — Three-stage engagement scoper: intake → capability match → simulation → proposal
- **Narrative Engine** — Discourse monitoring, content calendar, audience-specific framing
- **Research Delivery Hub** — Active engagement tracking, milestone management, health alerts
- **Channel Partnerships** — Partner management, certification tracking, revenue attribution
- **Model Coverage** — SAE investment tracker, breakeven matrix, pipeline demand by model family
- **Operations** — Cross-functional metrics, pipeline visibility, conversion analytics, weight tuning

## Feedback Loops

Forge includes three self-calibrating feedback mechanisms:

1. **Signal Quality Feedback** — Rate signals as useful or noise. Quality analytics by signal type inform weight adjustments.
2. **Conversion Analytics** — Track which signals, outreach framings, and prospect categories actually convert through the pipeline.
3. **Weight Auto-Tuning** — Forge suggests actionability and ICP weight adjustments based on conversion data. The GTM Lead approves or customizes.

A system health indicator in the header monitors data freshness, prediction sample size, and feedback coverage, alerting when the system's intelligence is degrading.

## Weekly GTM Brief

Auto-generated every Monday from all data layers. Covers: new signals, pipeline movement, engagement health, prediction outcomes, competitive activity, and priority targets. Exportable as markdown for the CEO's Monday 1:1.

## Data Integrity

Every metric, benchmark, and capability reference in Forge traces to Goodfire's published research. The ROI Calculator uses conservative estimates grounded in:
- RLFR (Prasad et al., Feb 2026): 58% hallucination reduction, 90x cheaper than LLM-as-judge
- Reasoning Theater (Boppana et al., Mar 2026): 68% token savings on MMLU via probe-guided early exit
- Rakuten PII Detection (Nguyen et al., Oct 2025): SAE probes deployed at 44M+ users

## Built By

Rachael Chew — [rachaelchew.com](https://rachaelchew.com)
Built as proof-of-work for Goodfire.
