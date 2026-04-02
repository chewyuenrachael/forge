---
name: seed-data
description: Reference for all Goodfire research data that must be seeded into the database
---

# Goodfire Research Data — Seed Reference

Use this data when creating the seed file and any component that displays Goodfire capabilities.

## Capabilities

### 1. RLFR (Reinforcement Learning from Feature Rewards)
- Paper: "Features as Rewards: Using Interpretability to Reduce Hallucinations"
- Authors: Prasad et al.
- Date: February 11, 2026
- Type: Fundamental Research → Applied
- Capability: Probes on model internal representations as reward signals for RL
- Key results:
  - 58% hallucination reduction on Gemma 12B (topline with best-of-32)
  - 31% reduction without test-time interventions (RLFR-NI)
  - 90x cheaper per intervention than LLM-as-judge
  - Tested across 8 domains: biography, science, medical, history, geography, citations, legal, general
  - Dataset: LongFact++ (~20,000 prompts, 999 held-out test)
- Partner solution: Model Surgery as a Service
- Readiness: Production-proven

### 2. Reasoning Theater
- Paper: "Reasoning Theater: Probing for Performative Chain-of-Thought"
- Authors: Boppana et al.
- Date: March 12, 2026
- Type: Applied Research
- Capability: Attention probes decode model beliefs during CoT; detect performative vs genuine reasoning
- Key results:
  - 68% token savings on MMLU via early exit at 95% probe confidence
  - 30% token savings on GPQA-Diamond
  - 80% token savings on easy recall tasks
  - Tested on DeepSeek-R1 671B and GPT-OSS 120B
  - Inflection points ("Wait", "Aha!") correlate with genuine internal uncertainty
  - Probes generalize across tasks they weren't trained on
- Partner solution: Inference Cost Optimization + CoT Faithfulness Monitoring
- Readiness: Demo-ready

### 3. Alzheimer's Biomarkers
- Paper: "Using Interpretability to Identify a Novel Class of Alzheimer's Biomarkers"
- Authors: Wang et al.
- Date: January 28, 2026
- Type: Applied Research
- Partner: Prima Mente (and University of Oxford)
- Capability: First major scientific discovery from reverse-engineering a foundation model
- Key results:
  - Discovered DNA fragment length patterns as novel biomarker class for Alzheimer's detection
  - Model name: Pleiades (epigenetic foundation model)
  - Distilled interpretability insights into human-interpretable classifier
  - Classifier generalizes better than previously reported biomarker classes on independent cohort
  - Used supervised probing (methylation, length, locus) and unsupervised approaches
- Partner solution: Scientific Discovery as a Service
- Readiness: Production-proven (with Prima Mente)

### 4. Rakuten PII Detection
- Paper: "Deploying Interpretability to Production with Rakuten: SAE Probes for PII Detection"
- Authors: Nguyen et al.
- Date: October 28, 2025
- Type: Applied Research
- Partner: Rakuten
- Capability: SAE-feature-based lightweight classifiers for real-time PII detection
- Key results:
  - Deployed across 44M+ users
  - Sub-millisecond inference overhead
  - Uses SAE features as classifier inputs (not separate model)
  - Production-grade reliability
- Partner solution: Runtime Guardrails (PII, jailbreak, toxicity, brand safety)
- Readiness: Production-proven

### 5. Model Diff Amplification
- Paper: "Discovering Undesired Rare Behaviors via Model Diff Amplification"
- Authors: Aranguri & McGrath
- Date: August 21, 2025
- Type: Applied Research
- Capability: Surfaces rare undesired behaviors introduced during post-training
- Key results:
  - Uses logit diff amplification to find behaviors occurring once in a million samples
  - Identifies what model learned during post-training that wasn't intended
  - Detects reward hacking artifacts, memorized training data, capability degradation
- Partner solution: Model Audit & Quality Assurance
- Readiness: Demo-ready

### 6. Memorization vs Reasoning (Loss Curvature)
- Paper: "Understanding Memorization via Loss Curvature"
- Authors: Merullo et al.
- Date: November 6, 2025
- Type: Fundamental Research
- Capability: Disentangles memorization weights from reasoning weights
- Key results:
  - Can determine which weights are used for memorizing facts vs general reasoning
  - Removing memorization weights actually improves reasoning performance
- Partner solution: Model Efficiency — surgical weight removal
- Readiness: Research-stage

### 7. SPD (Scalable Parameter Decomposition)
- Paper: "Towards Scalable Parameter Decomposition"
- Authors: Bushnaq et al.
- Date: June 28, 2025
- Type: Fundamental Research
- Capability: Decomposes model weights (not just activations) into interpretable components
- Partner solution: Foundation for model design environment
- Readiness: Research-stage

### 8. Evo 2 / Tree of Life
- Paper: "Finding the Tree of Life in Evo 2"
- Authors: Pearce et al.
- Date: August 28, 2025
- Type: Applied Research
- Partner: Arc Institute
- Capability: Found phylogenetic (evolutionary) structure encoded in Evo 2 genomic foundation model
- Partner solution: Biological foundation model interpretation
- Readiness: Production-proven (with Arc Institute)

### 9. Interpreting Evo 2 (Arc Institute)
- Paper: "Interpreting Evo 2: Arc Institute's Next-Generation Genomic Foundation Model"
- Authors: Gorton et al.
- Date: February 20, 2025
- Partner: Arc Institute
- Capability: Applied interpretability to next-gen genomic FM
- Readiness: Production-proven

### 10. Under the Hood of a Reasoning Model
- Paper: "Under the Hood of a Reasoning Model"
- Authors: Hazra et al.
- Date: April 15, 2025
- Type: Fundamental Research
- Capability: Internal analysis of how reasoning models (DeepSeek R1) process information
- Readiness: Research-stage

## Partners
- Arc Institute — genomic model interpretation (Evo 2)
- Prima Mente — Alzheimer's biomarker discovery
- Mayo Clinic — genomics collaboration
- Rakuten — PII detection in production (44M+ users)
- Apollo Research — AI safety evaluation
- Haize Labs — model security testing
- Microsoft — partnership (details undisclosed)

## Company Facts
- Founded: 2024
- HQ: San Francisco
- Team: ~51 people (as of Feb 2026)
- Funding: $209M total ($50M Series A Apr 2025, $150M Series B Feb 2026)
- Valuation: $1.25B
- Structure: Public Benefit Corporation
- Key people: Eric Ho (CEO), Daniel Balsam (CTO), Tom McGrath (Chief Scientist)
- Investors: B Capital (led Series B), Menlo Ventures (led Series A), Lightspeed, Anthropic, Salesforce Ventures, Eric Schmidt, DFJ Growth
- Dario Amodei personal endorsement + Anthropic investment

## Regulatory Context
- EU AI Act high-risk provisions: effective August 2, 2026
- Article 13: transparency requirements (ambiguous — interpretability could define the standard)
- US: NIST AI RMF (voluntary), SR 11-7 (banking), FDA AI/ML guidance (medical)
- Colorado SB 205, California SB 53