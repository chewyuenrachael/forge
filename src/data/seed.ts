import type Database from 'better-sqlite3'

export function seedDatabase(db: Database.Database): void {
  // ─── Prepared Statements ───────────────────────────────────────────────

  const insertModelFamily = db.prepare(`
    INSERT INTO model_families (id, name, provider, tier, sae_status, sae_estimated_completion, parameter_count, license, enterprise_adoption_pct, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertCustomerCategory = db.prepare(`
    INSERT INTO customer_categories (id, name, description, avg_deal_size_low, avg_deal_size_high, sales_cycle_days_low, sales_cycle_days_high, regulatory_tailwinds, goodfire_value_prop, priority_rank)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertEngagementTier = db.prepare(`
    INSERT INTO engagement_tiers (id, name, price_low, price_high, duration_days, description, researcher_hours, engineer_hours, cost_to_deliver)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertAudience = db.prepare(`
    INSERT INTO audiences (id, type, title, pain_points, framing_emphasis, language_register, value_prop_template)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertCapability = db.prepare(`
    INSERT INTO capabilities (id, name, paper_title, authors, date, type, description, key_results, partner_solution, readiness, model_families_tested, partners)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertPeerCluster = db.prepare(`
    INSERT INTO peer_clusters (id, name, industry, region, prospect_ids, density_score, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertChannelPartner = db.prepare(`
    INSERT INTO channel_partners (id, name, type, relationship_status, primary_contact, client_portfolio_overlap, estimated_annual_revenue, certified_engineers, engagements_sourced, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertActionabilityWeights = db.prepare(`
    INSERT INTO actionability_weights (id, relevance, urgency, coverage, novelty)
    VALUES (?, ?, ?, ?, ?)
  `)

  const insertEvidence = db.prepare(`
    INSERT INTO evidence (id, capability_id, metric, value, context, source, is_headline)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertProspect = db.prepare(`
    INSERT INTO prospects (id, name, industry, customer_category, estimated_ai_spend, model_families, pain_points, regulatory_exposure, priority_score, revenue_engine, pipeline_stage, pipeline_value, peer_cluster_id, contacts, outreach_history, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertSignal = db.prepare(`
    INSERT INTO signals (id, type, title, description, source, source_url, date, relevance_score, urgency_score, coverage_score, novelty_score, actionability_score, matched_capability_ids, matched_prospect_ids, suggested_action, narrative_angle, peer_cluster_ids, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertEngagement = db.prepare(`
    INSERT INTO engagements (id, partner_name, status, engagement_tier, capabilities_applied, model_family_id, start_date, end_date, health_score, pipeline_value, cost_to_deliver, margin_pct, revenue_engine, channel_partner_id, prospect_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMilestone = db.prepare(`
    INSERT INTO milestones (id, engagement_id, title, status, due_date, completed_date, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertPrediction = db.prepare(`
    INSERT INTO predictions (id, engagement_id, description, methodology, severity, confidence, outcome, outcome_notes, outcome_date, model_family_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertContentCalendar = db.prepare(`
    INSERT INTO content_calendar (id, date, type, title, description, signal_id, capability_ids, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertEventLog = db.prepare(`
    INSERT INTO event_log (id, timestamp, event_type, entity_type, entity_id, actor_role, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const updatePeerClusterProspects = db.prepare(`
    UPDATE peer_clusters SET prospect_ids = ? WHERE id = ?
  `)

  // ─── Transaction: seed all tables atomically ───────────────────────────

  const seedAll = db.transaction(() => {

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Independent reference tables (no foreign keys)
    // ═══════════════════════════════════════════════════════════════════════

    // ─── 1. Model Families (10 entries) ────────────────────────────────────

    // Tier A — SAEs available
    insertModelFamily.run('llama-3.3-70b', 'Llama 3.3 70B', 'Meta', 'tier_a', 'available', null, '70B', 'Llama Community License', 9.0, null)
    insertModelFamily.run('llama-4-scout', 'Llama 4 Scout', 'Meta', 'tier_a', 'available', null, '109B', 'Llama Community License', 4.0, null)
    insertModelFamily.run('deepseek-r1', 'DeepSeek R1', 'DeepSeek', 'tier_a', 'available', null, '671B', 'MIT', 5.0, null)
    insertModelFamily.run('llama-3.1-8b', 'Llama 3.1 8B', 'Meta', 'tier_a', 'available', null, '8B', 'Llama Community License', 12.0, null)
    insertModelFamily.run('gemma-12b', 'Gemma 12B', 'Google', 'tier_a', 'available', null, '12B', 'Gemma License', 3.0, 'RLFR hallucination reduction demonstrated on this model')

    // Tier B — planned, 3-month horizon
    insertModelFamily.run('llama-4-maverick', 'Llama 4 Maverick', 'Meta', 'tier_b', 'planned', '2026-07-01', '400B', 'Llama Community License', 2.0, null)
    insertModelFamily.run('mistral-large-3', 'Mistral Large 3', 'Mistral', 'tier_b', 'planned', '2026-08-01', '123B', 'Mistral License', 3.5, 'Critical for EU market — French/EU orgs prefer Mistral')
    insertModelFamily.run('qwen-3-72b', 'Qwen 3 72B', 'Alibaba', 'tier_b', 'planned', '2026-09-01', '72B', 'Apache 2.0', 2.5, null)

    // Tier C — on-demand custom SAEs
    insertModelFamily.run('evo-2', 'Evo 2', 'Arc Institute', 'tier_c', 'available', null, '7B', 'Research', 0.1, 'Genomic foundation model — custom SAEs built for Arc partnership')
    insertModelFamily.run('pleiades', 'Pleiades', 'Prima Mente', 'tier_c', 'available', null, 'Undisclosed', 'Proprietary', 0.0, 'Epigenetic model — custom interpretability for Alzheimer biomarker discovery')

    // ─── 2. Customer Categories (6 entries) ────────────────────────────────

    insertCustomerCategory.run(
      'data_sovereign_enterprise',
      'Data-Sovereign Enterprises',
      'Organizations that self-host AI models for data sovereignty, security, or regulatory compliance. They own the model risk — nobody else audits it for them.',
      150000, 500000, 60, 180,
      JSON.stringify(['eu_ai_act', 'sr_11_7', 'nist_ai_rmf']),
      'You self-host for data sovereignty. But self-hosting means you own the model risk — nobody else audits it for you. Goodfire provides the interpretability layer that makes self-hosted AI auditable.',
      1
    )

    insertCustomerCategory.run(
      'ai_native_startup',
      'AI-Native Startups',
      'Companies building products on top of fine-tuned or custom models. Fine-tuning introduces behaviors that standard evals cannot detect.',
      50000, 150000, 14, 60,
      JSON.stringify([]),
      'You fine-tuned a model for your product. But fine-tuning introduced behaviors you didn\'t intend and can\'t detect with standard evals. Goodfire surfaces what changed and why.',
      2
    )

    insertCustomerCategory.run(
      'research_institution',
      'Research Institutions',
      'Universities, pharma companies, and biotech firms using foundation models for scientific discovery. Their models have learned patterns no human has discovered.',
      75000, 200000, 30, 90,
      JSON.stringify(['fda']),
      'Your foundation model has learned patterns in your data that no human has discovered. We can extract that knowledge — as demonstrated with the Alzheimer\'s biomarker discovery.',
      3
    )

    insertCustomerCategory.run(
      'cost_optimizer',
      'Inference Cost Optimizers',
      'Enterprises spending heavily on reasoning model inference seeking cost reduction without accuracy loss.',
      75000, 175000, 30, 120,
      JSON.stringify([]),
      'Reasoning model costs are spiraling. Goodfire\'s Reasoning Theater probes cut token usage by 68% on MMLU by detecting when models are performing rather than reasoning — enabling early exit without accuracy loss.',
      4
    )

    insertCustomerCategory.run(
      'model_customization_platform',
      'Model Customization Platforms',
      'Platforms that host and serve models to enterprise customers. Channel partner opportunity, not end customer.',
      0, 0, 90, 365,
      JSON.stringify([]),
      'Your customers need interpretability for the models you serve. Goodfire provides white-label interpretability infrastructure that makes your platform the trusted choice for regulated enterprises.',
      5
    )

    insertCustomerCategory.run(
      'sovereign_ai_initiative',
      'Sovereign AI Initiatives',
      'National governments and sovereign entities building domestic AI capability. Longest sales cycles but largest deal sizes.',
      200000, 1000000, 120, 365,
      JSON.stringify(['eu_ai_act', 'nist_ai_rmf']),
      'National AI sovereignty requires national AI transparency. Goodfire provides the interpretability infrastructure for sovereign AI programs — ensuring domestic models meet domestic standards.',
      6
    )

    // ─── 3. Engagement Tiers (4 entries) ───────────────────────────────────

    insertEngagementTier.run('simple', 'Simple', 75000, 100000, 10, '1 supported model, 1 use case', 15, 40, 55000)
    insertEngagementTier.run('standard', 'Standard', 125000, 175000, 15, '1 supported model, 2-3 use cases, production', 25, 60, 85000)
    insertEngagementTier.run('complex', 'Complex', 200000, 350000, 25, 'Novel model family or multiple models, regulated', 40, 100, 150000)
    insertEngagementTier.run('critical', 'Critical', 500000, 2000000, 45, 'Frontier model safety, national security, scientific discovery', 80, 200, 350000)

    // ─── 4. Audiences (5 entries) ──────────────────────────────────────────

    insertAudience.run(
      'aud-ml-engineer',
      'ml_engineer',
      'ML Engineer / AI Platform Lead',
      JSON.stringify([
        'Model debugging opacity',
        'Eval suite blind spots',
        'Fine-tuning regression',
        'PII leakage and safety guardrail gaps',
      ]),
      'Technical accuracy, methodology, reproducibility',
      'Precise, peer-level',
      'Reduce hallucinations by {{reduction_pct}} and cut inference costs by {{savings_pct}} with interpretability-driven model surgery — no retraining required.'
    )

    insertAudience.run(
      'aud-cto',
      'cto',
      'CTO / Head of AI',
      JSON.stringify([
        'AI deployment risk',
        'ROI uncertainty',
        'Team productivity',
        'Model reliability for customer-facing products',
      ]),
      'ROI, competitive advantage, risk mitigation',
      'Strategic, outcome-focused',
      'Turn AI interpretability into measurable ROI: {{savings}} in annual savings, regulatory compliance, and production-grade model reliability.'
    )

    insertAudience.run(
      'aud-compliance',
      'compliance',
      'Compliance / Risk Officer',
      JSON.stringify([
        'Regulatory deadlines',
        'Audit documentation gaps',
        'Model risk quantification',
        'Explainability demands from regulators',
      ]),
      'Regulatory alignment, audit readiness, transparency evidence',
      'Formal, standards-referenced',
      'Meet {{regulation}} requirements with interpretability-based model transparency — audit-ready documentation and provable compliance.'
    )

    insertAudience.run(
      'aud-researcher',
      'researcher',
      'Research Director',
      JSON.stringify([
        'Knowledge extraction from models',
        'Reproducibility',
        'Novel discovery methodology',
        'Bridging research and deployment',
      ]),
      'Scientific rigor, discovery potential, publication value',
      'Academic, evidence-based',
      'Advance scientific discovery with interpretability: from novel biomarker classes to understanding reasoning model internals — methodology validated in peer-reviewed publications.'
    )

    insertAudience.run(
      'aud-ai-community',
      'ai_community',
      'AI Community & Public',
      JSON.stringify([
        'AI trust deficit',
        'Black box concerns',
        'Safety assurance',
        'Practical applications of interpretability',
      ]),
      'Why this matters for AI safety, paradigm implications',
      'Accessible, compelling',
      'Interpretability is moving from research to production — see how it reduces hallucinations, cuts costs, and enables scientific discovery.'
    )

    // ─── 5. Capabilities (10 entries) ──────────────────────────────────────

    insertCapability.run(
      'cap-rlfr',
      'RLFR',
      'Features as Rewards: Using Interpretability to Reduce Hallucinations',
      'Prasad et al.',
      '2026-02-11',
      'fundamental',
      'Probes on model internal representations as reward signals for RL. Uses interpretability features to train models that hallucinate less, at 90x lower cost than LLM-as-judge approaches.',
      JSON.stringify([
        '58% hallucination reduction on Gemma 12B (topline with best-of-32)',
        '31% reduction without test-time interventions (RLFR-NI)',
        '90x cheaper per intervention than LLM-as-judge',
        'Tested across 8 domains: biography, science, medical, history, geography, citations, legal, general',
        'Dataset: LongFact++ (~20,000 prompts, 999 held-out test)',
      ]),
      'Model Surgery as a Service',
      'production',
      JSON.stringify(['Gemma 12B']),
      JSON.stringify([])
    )

    insertCapability.run(
      'cap-reasoning-theater',
      'Reasoning Theater',
      'Reasoning Theater: Probing for Performative Chain-of-Thought',
      'Boppana et al.',
      '2026-03-12',
      'applied',
      'Attention probes decode model beliefs during chain-of-thought reasoning. Detects performative vs genuine reasoning, enabling early exit when the model is just performing rather than actually reasoning.',
      JSON.stringify([
        '68% token savings on MMLU via early exit at 95% probe confidence',
        '30% token savings on GPQA-Diamond',
        '80% token savings on easy recall tasks',
        'Tested on DeepSeek-R1 671B and GPT-OSS 120B',
        'Inflection points ("Wait", "Aha!") correlate with genuine internal uncertainty',
        'Probes generalize across tasks they were not trained on',
      ]),
      'Inference Cost Optimization + CoT Faithfulness Monitoring',
      'demo',
      JSON.stringify(['DeepSeek-R1 671B', 'GPT-OSS 120B']),
      JSON.stringify([])
    )

    insertCapability.run(
      'cap-alzheimers',
      "Alzheimer's Biomarkers",
      'Using Interpretability to Identify a Novel Class of Alzheimer\'s Biomarkers',
      'Wang et al.',
      '2026-01-28',
      'applied',
      'First major scientific discovery from reverse-engineering a foundation model. Discovered DNA fragment length patterns as a novel biomarker class for Alzheimer\'s detection using the Pleiades epigenetic foundation model.',
      JSON.stringify([
        'Discovered DNA fragment length patterns as novel biomarker class for Alzheimer\'s detection',
        'Model: Pleiades (epigenetic foundation model)',
        'Distilled interpretability insights into human-interpretable classifier',
        'Classifier generalizes better than previously reported biomarker classes on independent cohort',
        'Used supervised probing (methylation, length, locus) and unsupervised approaches',
      ]),
      'Scientific Discovery as a Service',
      'production',
      JSON.stringify(['Pleiades']),
      JSON.stringify(['Prima Mente', 'University of Oxford'])
    )

    insertCapability.run(
      'cap-rakuten-pii',
      'Rakuten PII Detection',
      'Deploying Interpretability to Production with Rakuten: SAE Probes for PII Detection',
      'Nguyen et al.',
      '2025-10-28',
      'applied',
      'SAE-feature-based lightweight classifiers for real-time PII detection. Deployed at scale across Rakuten\'s platform with sub-millisecond inference overhead.',
      JSON.stringify([
        'Deployed across 44M+ users',
        'Sub-millisecond inference overhead',
        'Uses SAE features as classifier inputs (not separate model)',
        'Production-grade reliability',
      ]),
      'Runtime Guardrails (PII, jailbreak, toxicity, brand safety)',
      'production',
      JSON.stringify([]),
      JSON.stringify(['Rakuten'])
    )

    insertCapability.run(
      'cap-model-diff',
      'Model Diff Amplification',
      'Discovering Undesired Rare Behaviors via Model Diff Amplification',
      'Aranguri & McGrath',
      '2025-08-21',
      'applied',
      'Surfaces rare undesired behaviors introduced during post-training. Uses logit diff amplification to find behaviors occurring as rarely as once in a million samples.',
      JSON.stringify([
        'Uses logit diff amplification to find behaviors occurring once in a million samples',
        'Identifies what model learned during post-training that was not intended',
        'Detects reward hacking artifacts, memorized training data, capability degradation',
      ]),
      'Model Audit & Quality Assurance',
      'demo',
      JSON.stringify([]),
      JSON.stringify([])
    )

    insertCapability.run(
      'cap-memorization',
      'Memorization vs Reasoning',
      'Understanding Memorization via Loss Curvature',
      'Merullo et al.',
      '2025-11-06',
      'fundamental',
      'Disentangles memorization weights from reasoning weights using loss curvature analysis. Reveals that removing memorization weights can actually improve reasoning performance.',
      JSON.stringify([
        'Can determine which weights are used for memorizing facts vs general reasoning',
        'Removing memorization weights actually improves reasoning performance',
      ]),
      'Model Efficiency — surgical weight removal',
      'research',
      JSON.stringify([]),
      JSON.stringify([])
    )

    insertCapability.run(
      'cap-spd',
      'SPD',
      'Towards Scalable Parameter Decomposition',
      'Bushnaq et al.',
      '2025-06-28',
      'fundamental',
      'Decomposes model weights (not just activations) into interpretable components. Provides a foundation for understanding the fundamental building blocks of neural network computation.',
      JSON.stringify([
        'Decomposes model weights into interpretable components',
        'Works on weights directly, not just activations',
        'Foundation for model design environment',
      ]),
      'Foundation for model design environment',
      'research',
      JSON.stringify([]),
      JSON.stringify([])
    )

    insertCapability.run(
      'cap-evo2-tree',
      'Evo 2 / Tree of Life',
      'Finding the Tree of Life in Evo 2',
      'Pearce et al.',
      '2025-08-28',
      'applied',
      'Found phylogenetic (evolutionary) structure encoded in the Evo 2 genomic foundation model. Demonstrates that biological foundation models learn meaningful evolutionary relationships.',
      JSON.stringify([
        'Found phylogenetic (evolutionary) structure encoded in Evo 2',
        'Demonstrates meaningful biological knowledge in genomic FMs',
        'Partnership with Arc Institute',
      ]),
      'Biological foundation model interpretation',
      'production',
      JSON.stringify(['Evo 2']),
      JSON.stringify(['Arc Institute'])
    )

    insertCapability.run(
      'cap-interpreting-evo2',
      'Interpreting Evo 2',
      "Interpreting Evo 2: Arc Institute's Next-Generation Genomic Foundation Model",
      'Gorton et al.',
      '2025-02-20',
      'applied',
      'Applied interpretability techniques to Arc Institute\'s next-generation genomic foundation model Evo 2, revealing how the model represents and processes genomic information.',
      JSON.stringify([
        'Applied interpretability to next-gen genomic foundation model',
        'Partnership with Arc Institute',
        'Foundation for biological model understanding',
      ]),
      'Biological foundation model interpretation',
      'production',
      JSON.stringify(['Evo 2']),
      JSON.stringify(['Arc Institute'])
    )

    insertCapability.run(
      'cap-reasoning-hood',
      'Under the Hood of a Reasoning Model',
      'Under the Hood of a Reasoning Model',
      'Hazra et al.',
      '2025-04-15',
      'fundamental',
      'Internal analysis of how reasoning models like DeepSeek R1 process information. Reveals the internal mechanisms behind chain-of-thought reasoning in large language models.',
      JSON.stringify([
        'Internal analysis of reasoning model (DeepSeek R1) processing',
        'Reveals mechanisms behind chain-of-thought reasoning',
        'Foundation for understanding reasoning model behavior',
      ]),
      'Reasoning model analysis',
      'research',
      JSON.stringify(['DeepSeek R1']),
      JSON.stringify([])
    )

    // ─── 6. Peer Clusters (4 entries) ──────────────────────────────────────
    // prospect_ids seeded empty, updated in Phase 6

    insertPeerCluster.run('european-insurers', 'European Insurers & Banks', 'Financial Services', 'EU', JSON.stringify([]), 5, 'outreach_active')
    insertPeerCluster.run('us-banks', 'US Financial Institutions', 'Financial Services', 'US', JSON.stringify([]), 4, 'identified')
    insertPeerCluster.run('pharma-rd', 'Pharmaceutical R&D', 'Life Sciences', 'Global', JSON.stringify([]), 3, 'identified')
    insertPeerCluster.run('defense-contractors', 'Defense & Intelligence', 'Defense', 'US/UK', JSON.stringify([]), 3, 'identified')

    // ─── 7. Channel Partners (5 entries) ───────────────────────────────────

    insertChannelPartner.run(
      'cp-deloitte',
      'Deloitte AI Practice',
      'big_four',
      'warm_intro',
      JSON.stringify({ name: 'Sarah Chen', title: 'Managing Director, AI & Data', email: null, linkedin_url: null, persona: 'cto', is_champion: true }),
      50, 2500000, 0, 0,
      'Extensive regulated-industry client base. Strong overlap with data-sovereign enterprise category.'
    )

    insertChannelPartner.run(
      'cp-booz-allen',
      'Booz Allen Hamilton',
      'consulting',
      'active_conversation',
      JSON.stringify({ name: 'Col. James Wright (Ret.)', title: 'VP, AI & Analytics', email: null, linkedin_url: null, persona: 'executive', is_champion: false }),
      30, 1500000, 0, 0,
      'Defense and intelligence focus. Key path to NIST RMF-aligned federal contracts.'
    )

    insertChannelPartner.run(
      'cp-pwc',
      'PwC Risk Assurance',
      'big_four',
      'cold',
      JSON.stringify(null),
      40, 2000000, 0, 0,
      'Strong model risk management practice. Natural fit for SR 11-7 compliance offering.'
    )

    insertChannelPartner.run(
      'cp-together-ai',
      'Together AI',
      'platform',
      'active_conversation',
      JSON.stringify({ name: 'Vipul Ved Prakash', title: 'CEO', email: null, linkedin_url: null, persona: 'cto', is_champion: true }),
      200, 5000000, 0, 0,
      'Model hosting platform — white-label interpretability for their enterprise customers. Multiplier on every model they serve.'
    )

    insertChannelPartner.run(
      'cp-guidehouse',
      'Guidehouse',
      'consulting',
      'cold',
      JSON.stringify(null),
      25, 800000, 0, 0,
      'Government and public sector focus. Path to sovereign AI initiatives.'
    )

    // ─── 8. Actionability Weights (1 entry) ────────────────────────────────

    insertActionabilityWeights.run('default', 0.35, 0.30, 0.20, 0.15)

    // ─── 8b. ICP Weights (1 entry) ──────────────────────────────────────
    const insertICPWeights = db.prepare(`
      INSERT INTO icp_weights (id, model_family_match, regulatory_pressure, peer_cluster_density, recent_signals)
      VALUES (?, ?, ?, ?, ?)
    `)
    insertICPWeights.run('default', 0.40, 0.25, 0.20, 0.15)

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Tables with foreign keys to Phase 1
    // ═══════════════════════════════════════════════════════════════════════

    // ─── 9. Evidence (27 entries) ──────────────────────────────────────────

    // RLFR (4 entries)
    insertEvidence.run('ev-rlfr-1', 'cap-rlfr', 'hallucination_reduction', '58%', 'Topline with best-of-32 sampling on Gemma 12B', 'Prasad et al., Feb 2026', 1)
    insertEvidence.run('ev-rlfr-2', 'cap-rlfr', 'hallucination_reduction_base', '31%', 'Without test-time interventions (RLFR-NI)', 'Prasad et al., Feb 2026', 0)
    insertEvidence.run('ev-rlfr-3', 'cap-rlfr', 'cost_efficiency', '90x cheaper', 'Per intervention vs LLM-as-judge', 'Prasad et al., Feb 2026', 0)
    insertEvidence.run('ev-rlfr-4', 'cap-rlfr', 'domain_coverage', '8 domains', 'Biography, science, medical, history, geography, citations, legal, general', 'Prasad et al., Feb 2026', 0)

    // Reasoning Theater (4 entries)
    insertEvidence.run('ev-rt-1', 'cap-reasoning-theater', 'token_savings_mmlu', '68%', 'Early exit at 95% probe confidence', 'Boppana et al., Mar 2026', 1)
    insertEvidence.run('ev-rt-2', 'cap-reasoning-theater', 'token_savings_gpqa', '30%', 'On harder reasoning tasks (GPQA-Diamond)', 'Boppana et al., Mar 2026', 0)
    insertEvidence.run('ev-rt-3', 'cap-reasoning-theater', 'token_savings_recall', '80%', 'On easy recall tasks where model already knows the answer', 'Boppana et al., Mar 2026', 0)
    insertEvidence.run('ev-rt-4', 'cap-reasoning-theater', 'cross_task_transfer', 'Probes generalize', 'Probes trained on one task transfer to untrained tasks', 'Boppana et al., Mar 2026', 0)

    // Alzheimer's Biomarkers (3 entries)
    insertEvidence.run('ev-alz-1', 'cap-alzheimers', 'novel_biomarker_discovery', 'DNA fragment length patterns', 'First scientific discovery via model reverse-engineering', 'Wang et al., Jan 2026', 1)
    insertEvidence.run('ev-alz-2', 'cap-alzheimers', 'classifier_generalization', 'Better than prior biomarker classes', 'On independent cohort validation', 'Wang et al., Jan 2026', 0)
    insertEvidence.run('ev-alz-3', 'cap-alzheimers', 'partnership_scope', 'Prima Mente + University of Oxford', 'Cross-institutional collaboration validating methodology', 'Wang et al., Jan 2026', 0)

    // Rakuten PII Detection (3 entries)
    insertEvidence.run('ev-rak-1', 'cap-rakuten-pii', 'production_scale', '44M+ users', 'Rakuten platform deployment at scale', 'Nguyen et al., Oct 2025', 1)
    insertEvidence.run('ev-rak-2', 'cap-rakuten-pii', 'inference_overhead', 'Sub-millisecond', 'Real-time PII detection with negligible latency', 'Nguyen et al., Oct 2025', 0)
    insertEvidence.run('ev-rak-3', 'cap-rakuten-pii', 'detection_precision', '>99% precision', 'Production PII detection precision rate', 'Nguyen et al., Oct 2025', 0)

    // Model Diff Amplification (2 entries)
    insertEvidence.run('ev-md-1', 'cap-model-diff', 'behavior_detection_sensitivity', '1 in 1,000,000 samples', 'Rare undesired behavior detection via logit diff', 'Aranguri & McGrath, Aug 2025', 1)
    insertEvidence.run('ev-md-2', 'cap-model-diff', 'behavior_types_detected', 'Reward hacking, memorization, degradation', 'Three distinct classes of post-training artifacts identified', 'Aranguri & McGrath, Aug 2025', 0)

    // Memorization vs Reasoning (2 entries)
    insertEvidence.run('ev-mem-1', 'cap-memorization', 'reasoning_improvement', 'Improved after weight removal', 'Removing memorization weights improves reasoning performance', 'Merullo et al., Nov 2025', 1)
    insertEvidence.run('ev-mem-2', 'cap-memorization', 'weight_disentanglement', 'Memorization vs reasoning separable', 'Loss curvature analysis cleanly separates weight functions', 'Merullo et al., Nov 2025', 0)

    // SPD (2 entries)
    insertEvidence.run('ev-spd-1', 'cap-spd', 'weight_decomposition', 'Interpretable components extracted', 'Decomposes weights, not just activations — deeper than SAEs', 'Bushnaq et al., Jun 2025', 1)
    insertEvidence.run('ev-spd-2', 'cap-spd', 'scalability', 'Tested up to 7B parameters', 'Scales beyond prior decomposition methods', 'Bushnaq et al., Jun 2025', 0)

    // Evo 2 / Tree of Life (2 entries)
    insertEvidence.run('ev-evo2-1', 'cap-evo2-tree', 'phylogenetic_structure', 'Evolutionary relationships encoded', 'Species-level phylogenetic tree reconstructed from model features', 'Pearce et al., Aug 2025', 1)
    insertEvidence.run('ev-evo2-2', 'cap-evo2-tree', 'partnership_validation', 'Arc Institute collaboration', 'Joint research with world-class genomics institution', 'Pearce et al., Aug 2025', 0)

    // Interpreting Evo 2 (2 entries)
    insertEvidence.run('ev-ievo2-1', 'cap-interpreting-evo2', 'genomic_coverage', 'Comprehensive model analysis', 'Full interpretability analysis of next-gen genomic foundation model', 'Gorton et al., Feb 2025', 1)
    insertEvidence.run('ev-ievo2-2', 'cap-interpreting-evo2', 'biological_insights', 'Novel biological patterns identified', 'Interpretability reveals learned biological knowledge not in training labels', 'Gorton et al., Feb 2025', 0)

    // Under the Hood of a Reasoning Model (3 entries)
    insertEvidence.run('ev-rh-1', 'cap-reasoning-hood', 'mechanism_analysis', 'Internal mechanisms mapped', 'Chain-of-thought reasoning mechanisms identified in DeepSeek R1', 'Hazra et al., Apr 2025', 1)
    insertEvidence.run('ev-rh-2', 'cap-reasoning-hood', 'model_scale', '671B parameter model analyzed', 'Full internal analysis of production-scale reasoning model', 'Hazra et al., Apr 2025', 0)
    insertEvidence.run('ev-rh-3', 'cap-reasoning-hood', 'reasoning_patterns', 'Genuine vs performative reasoning distinguished', 'Foundation for Reasoning Theater early-exit methodology', 'Hazra et al., Apr 2025', 0)

    // ─── 10. Prospects (14 entries) ────────────────────────────────────────

    // European Banks/Insurers → european-insurers peer cluster
    insertProspect.run(
      'pros-eu-bank', 'Deutsche Kredit AG', 'European Banking',
      'data_sovereign_enterprise', 2400000,
      JSON.stringify(['llama-3.3-70b', 'deepseek-r1']),
      JSON.stringify(['EU AI Act compliance deadline', 'SR 11-7 model validation', 'Hallucination risk in customer-facing AI']),
      JSON.stringify(['eu_ai_act', 'sr_11_7']),
      92, 'direct', 'proposal_sent', 300000, 'european-insurers',
      JSON.stringify([{ name: 'Dr. Stefan Mueller', title: 'Head of AI Risk', email: null, linkedin_url: null, persona: 'compliance', is_champion: true }]),
      JSON.stringify([{ date: '2026-02-15', type: 'email', audience_framing: 'compliance', signal_id: 'sig-eu-ai-act', status: 'replied', notes: 'Interested in EU AI Act compliance assessment' }]),
      'Strong regulatory pressure from BaFin. Board-level AI governance initiative underway.'
    )

    insertProspect.run(
      'pros-allianz', 'Allianz', 'Insurance',
      'data_sovereign_enterprise', 3200000,
      JSON.stringify(['llama-3.3-70b', 'mistral-large-3']),
      JSON.stringify(['EU AI Act high-risk classification for insurance pricing', 'Model fairness in underwriting', 'Claims processing AI transparency']),
      JSON.stringify(['eu_ai_act']),
      88, 'direct', 'meeting_booked', 250000, 'european-insurers',
      JSON.stringify([{ name: 'Dr. Claudia Weber', title: 'Chief Data Officer', email: null, linkedin_url: null, persona: 'cto', is_champion: true }]),
      JSON.stringify([{ date: '2026-03-01', type: 'email', audience_framing: 'cto', signal_id: null, status: 'meeting_booked', notes: 'Meeting scheduled for April 10' }]),
      'Largest European insurer. Using Llama models for claims triage. EIOPA guidance creates urgency.'
    )

    insertProspect.run(
      'pros-bnp', 'BNP Paribas', 'European Banking',
      'data_sovereign_enterprise', 2800000,
      JSON.stringify(['mistral-large-3', 'llama-3.3-70b']),
      JSON.stringify(['EU AI Act Article 13 compliance', 'Model risk management for trading AI', 'Cross-border regulatory alignment']),
      JSON.stringify(['eu_ai_act', 'sr_11_7']),
      85, 'direct', 'outreach_sent', 200000, 'european-insurers',
      JSON.stringify([{ name: 'Pierre Dubois', title: 'Head of AI Strategy', email: null, linkedin_url: null, persona: 'cto', is_champion: false }]),
      JSON.stringify([{ date: '2026-03-20', type: 'email', audience_framing: 'cto', signal_id: null, status: 'sent', notes: null }]),
      'French bank — strong preference for Mistral models. ECB stress-testing AI governance.'
    )

    insertProspect.run(
      'pros-ing', 'ING', 'European Banking',
      'data_sovereign_enterprise', 1800000,
      JSON.stringify(['llama-3.3-70b', 'deepseek-r1']),
      JSON.stringify(['EU AI Act compliance', 'Customer service AI hallucination', 'Model transparency for Dutch regulators']),
      JSON.stringify(['eu_ai_act']),
      79, 'direct', 'signal_detected', 175000, 'european-insurers',
      JSON.stringify([{ name: 'Maarten de Vries', title: 'AI Platform Lead', email: null, linkedin_url: null, persona: 'ml_engineer', is_champion: false }]),
      JSON.stringify([]),
      'Early-stage. Known to deploy open-source models for customer service.'
    )

    // US Financial → us-banks peer cluster
    insertProspect.run(
      'pros-jpmorgan', 'JPMorgan Chase', 'Financial Services',
      'data_sovereign_enterprise', 8500000,
      JSON.stringify(['llama-3.3-70b', 'llama-4-scout']),
      JSON.stringify(['SR 11-7 model risk management', 'AI model audit at scale', 'Real-time guardrails for trading AI']),
      JSON.stringify(['sr_11_7']),
      95, 'direct', 'discovery_complete', 500000, 'us-banks',
      JSON.stringify([
        { name: 'Dr. Aarav Patel', title: 'Head of AI Model Risk', email: null, linkedin_url: null, persona: 'compliance', is_champion: true },
        { name: 'Lisa Chang', title: 'Managing Director, AI Platform', email: null, linkedin_url: null, persona: 'cto', is_champion: false },
      ]),
      JSON.stringify([
        { date: '2026-03-25', type: 'referral', audience_framing: 'compliance', signal_id: 'sig-jpmorgan-rfp', status: 'meeting_booked', notes: 'RFP response submitted. Technical deep-dive scheduled.' },
      ]),
      'Issued formal RFP for AI model risk assessment tooling. Largest US bank by assets. Top priority.'
    )

    insertProspect.run(
      'pros-goldman', 'Goldman Sachs', 'Financial Services',
      'cost_optimizer', 3500000,
      JSON.stringify(['deepseek-r1', 'llama-3.3-70b']),
      JSON.stringify(['Reasoning model inference costs', 'Model transparency for regulators', 'Trading AI optimization']),
      JSON.stringify(['sr_11_7']),
      82, 'direct', 'outreach_sent', 350000, 'us-banks',
      JSON.stringify([{ name: 'Michael Torres', title: 'VP, AI Infrastructure', email: null, linkedin_url: null, persona: 'ml_engineer', is_champion: false }]),
      JSON.stringify([{ date: '2026-03-28', type: 'email', audience_framing: 'ml_engineer', signal_id: null, status: 'sent', notes: null }]),
      'Heavy user of reasoning models for quantitative strategies. Cost optimization angle strongest.'
    )

    // Pharma → pharma-rd peer cluster
    insertProspect.run(
      'pros-roche', 'Roche', 'Pharmaceutical',
      'research_institution', 4200000,
      JSON.stringify(['llama-3.1-8b', 'gemma-12b']),
      JSON.stringify(['Drug discovery model interpretability', 'FDA AI/ML regulatory submissions', 'Biomarker discovery acceleration']),
      JSON.stringify(['fda']),
      86, 'direct', 'meeting_booked', 200000, 'pharma-rd',
      JSON.stringify([{ name: 'Dr. Elena Rossi', title: 'Director, Computational Biology', email: null, linkedin_url: null, persona: 'researcher', is_champion: true }]),
      JSON.stringify([{ date: '2026-03-15', type: 'event', audience_framing: 'researcher', signal_id: null, status: 'meeting_booked', notes: 'Met at JP Morgan Healthcare Conference. Follow-up scheduled.' }]),
      'Interested in Alzheimer\'s biomarker methodology applied to their oncology models.'
    )

    insertProspect.run(
      'pros-astrazeneca', 'AstraZeneca', 'Pharmaceutical',
      'research_institution', 3800000,
      JSON.stringify(['llama-3.1-8b', 'evo-2']),
      JSON.stringify(['Genomic model interpretation', 'Clinical trial AI transparency', 'Drug-target interaction discovery']),
      JSON.stringify(['fda']),
      80, 'direct', 'signal_detected', 150000, 'pharma-rd',
      JSON.stringify([{ name: 'Dr. James Whitfield', title: 'Head of AI Research', email: null, linkedin_url: null, persona: 'researcher', is_champion: false }]),
      JSON.stringify([]),
      'Using genomic foundation models for drug discovery. Natural fit for Evo 2 interpretability work.'
    )

    // AI-Native Startups
    insertProspect.run(
      'pros-synthetix', 'Synthetix AI', 'AI-Powered Content',
      'ai_native_startup', 1200000,
      JSON.stringify(['deepseek-r1', 'llama-4-scout']),
      JSON.stringify(['Fine-tuned model regression after updates', 'Content safety guardrails', 'Inference cost optimization']),
      JSON.stringify([]),
      76, 'direct', 'response_received', 100000, null,
      JSON.stringify([{ name: 'Alex Kim', title: 'CTO & Co-founder', email: null, linkedin_url: null, persona: 'cto', is_champion: true }]),
      JSON.stringify([{ date: '2026-03-22', type: 'linkedin', audience_framing: 'cto', signal_id: null, status: 'replied', notes: 'Interested in Model Diff for post-fine-tuning QA' }]),
      'Series B startup. Fine-tunes reasoning models for enterprise content generation.'
    )

    insertProspect.run(
      'pros-orbital', 'Orbital ML', 'AI Infrastructure',
      'ai_native_startup', 800000,
      JSON.stringify(['llama-3.3-70b', 'gemma-12b']),
      JSON.stringify(['Model behavioral drift in production', 'Customer-reported AI errors', 'Safety evaluation tooling gaps']),
      JSON.stringify([]),
      71, 'direct', 'signal_detected', 75000, null,
      JSON.stringify([{ name: 'Priya Sharma', title: 'VP Engineering', email: null, linkedin_url: null, persona: 'ml_engineer', is_champion: false }]),
      JSON.stringify([]),
      'Seed-stage. Building AI safety evaluation platform. Potential integration partner.'
    )

    // Defense → defense-contractors peer cluster
    insertProspect.run(
      'pros-bae', 'BAE Systems', 'Defense & Intelligence',
      'data_sovereign_enterprise', 4500000,
      JSON.stringify(['llama-3.3-70b']),
      JSON.stringify(['Model auditability for classified systems', 'NIST AI RMF compliance', 'Explainability for decision support AI']),
      JSON.stringify(['nist_ai_rmf']),
      84, 'channel', 'outreach_sent', 400000, 'defense-contractors',
      JSON.stringify([{ name: 'Dr. Richard Haynes', title: 'Chief AI Scientist', email: null, linkedin_url: null, persona: 'researcher', is_champion: false }]),
      JSON.stringify([{ date: '2026-03-10', type: 'referral', audience_framing: 'researcher', signal_id: null, status: 'sent', notes: 'Intro via Booz Allen Hamilton' }]),
      'UK-headquartered. US defense division exploring AI interpretability for NIST compliance. Channel through Booz Allen.'
    )

    // Healthcare
    insertProspect.run(
      'pros-cleveland', 'Cleveland Clinic', 'Healthcare',
      'research_institution', 1500000,
      JSON.stringify(['llama-3.1-8b', 'gemma-12b']),
      JSON.stringify(['Clinical AI safety and transparency', 'FDA AI/ML device guidance', 'Medical AI hallucination prevention']),
      JSON.stringify(['fda']),
      81, 'direct', 'signal_detected', 125000, null,
      JSON.stringify([{ name: 'Dr. Sarah Martinez', title: 'Director, AI in Medicine', email: null, linkedin_url: null, persona: 'researcher', is_champion: false }]),
      JSON.stringify([]),
      'Top US hospital system. Research-oriented — Alzheimer\'s biomarker work resonates strongly.'
    )

    // Platform/Channel
    insertProspect.run(
      'pros-together-ai', 'Together AI', 'AI Infrastructure',
      'model_customization_platform', 2000000,
      JSON.stringify(['llama-3.3-70b', 'llama-4-scout', 'deepseek-r1', 'mistral-large-3']),
      JSON.stringify(['Customer demand for model transparency', 'Differentiation from commodity hosting', 'Enterprise trust requirements']),
      JSON.stringify([]),
      83, 'channel', 'discovery_complete', 150000, null,
      JSON.stringify([{ name: 'Vipul Ved Prakash', title: 'CEO', email: null, linkedin_url: null, persona: 'cto', is_champion: true }]),
      JSON.stringify([{ date: '2026-03-05', type: 'event', audience_framing: 'cto', signal_id: null, status: 'meeting_booked', notes: 'Platform partnership discussion — white-label interpretability' }]),
      'Model hosting platform. Channel partner opportunity — white-label Goodfire for their enterprise tier.'
    )

    // Sovereign AI
    insertProspect.run(
      'pros-dgnum', 'France DGNUM', 'Government / Sovereign AI',
      'sovereign_ai_initiative', 500000,
      JSON.stringify(['mistral-large-3']),
      JSON.stringify(['Sovereign AI model transparency', 'EU AI Act compliance for government AI', 'French AI independence verification']),
      JSON.stringify(['eu_ai_act']),
      77, 'direct', 'signal_detected', 750000, null,
      JSON.stringify([{ name: 'Marie Laurent', title: 'Director, AI Strategy', email: null, linkedin_url: null, persona: 'executive', is_champion: false }]),
      JSON.stringify([]),
      'French government digital directorate. Building sovereign AI stack with Mistral. Longest sales cycle but strategic.'
    )

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: Signals (references prospect IDs but no strict FK)
    // ═══════════════════════════════════════════════════════════════════════

    // ─── 11. Signals (15 entries) ──────────────────────────────────────────
    // actionability = (relevance × 0.35) + (urgency × 0.30) + (coverage × 0.20) + (novelty × 0.15)

    insertSignal.run(
      'sig-eu-ai-act', 'regulatory',
      'EU AI Act High-Risk Provisions Take Effect',
      'EU AI Act Article 13 transparency requirements become enforceable August 2, 2026. High-risk AI systems must demonstrate interpretability and provide meaningful explanations of their decision-making processes.',
      'European Commission', null, '2026-08-02',
      98, 92, 75, 85,
      90, // (98×0.35)+(92×0.30)+(75×0.20)+(85×0.15) = 34.3+27.6+15+12.75 = 89.65
      JSON.stringify(['cap-rlfr', 'cap-rakuten-pii', 'cap-model-diff']),
      JSON.stringify(['pros-eu-bank', 'pros-allianz', 'pros-bnp', 'pros-ing', 'pros-dgnum']),
      'Accelerate outreach to EU-regulated prospects with compliance-focused messaging',
      'Goodfire interpretability as the path to Article 13 compliance',
      JSON.stringify(['european-insurers']),
      'active'
    )

    insertSignal.run(
      'sig-nist-update', 'regulatory',
      'NIST AI RMF Profile Update for Generative AI',
      'NIST releases updated AI Risk Management Framework guidance specifically addressing generative AI transparency and interpretability requirements.',
      'NIST', null, '2026-03-15',
      82, 65, 60, 80,
      72, // (82×0.35)+(65×0.30)+(60×0.20)+(80×0.15) = 28.7+19.5+12+12 = 72.2
      JSON.stringify(['cap-rlfr', 'cap-model-diff', 'cap-reasoning-hood']),
      JSON.stringify(['pros-bae', 'pros-jpmorgan', 'pros-goldman']),
      'Reference NIST alignment in US-focused prospect communications',
      'Goodfire capabilities map directly to NIST AI RMF GOVERN and MAP functions',
      JSON.stringify(['us-banks', 'defense-contractors']),
      'active'
    )

    insertSignal.run(
      'sig-reasoning-cost', 'competitor',
      'Major AI Lab Announces 10x Reasoning Model Cost Increase',
      'Leading AI provider raises pricing for reasoning model API access, citing compute costs. Enterprise customers report 3-5x budget overruns on reasoning workloads.',
      'Industry reports', null, '2026-03-20',
      95, 88, 50, 70,
      80, // (95×0.35)+(88×0.30)+(50×0.20)+(70×0.15) = 33.25+26.4+10+10.5 = 80.15
      JSON.stringify(['cap-reasoning-theater']),
      JSON.stringify(['pros-goldman', 'pros-synthetix']),
      'Position Reasoning Theater as immediate cost relief for reasoning model users',
      '68% token savings directly addresses the cost crisis in reasoning model deployment',
      JSON.stringify([]),
      'active'
    )

    insertSignal.run(
      'sig-colorado-sb205', 'regulatory',
      'Colorado SB 205 AI Transparency Law Implementation',
      'Colorado becomes first US state to require algorithmic impact assessments for high-risk AI systems, with enforcement beginning Q3 2026.',
      'Colorado General Assembly', null, '2026-04-01',
      75, 60, 35, 75,
      63, // (75×0.35)+(60×0.30)+(35×0.20)+(75×0.15) = 26.25+18+7+11.25 = 62.5
      JSON.stringify(['cap-rlfr', 'cap-model-diff']),
      JSON.stringify([]),
      'Target Colorado-based enterprises and companies with Colorado operations',
      'State-level regulation signals coming federal action — early movers gain competitive advantage',
      JSON.stringify([]),
      'active'
    )

    insertSignal.run(
      'sig-pharma-ai', 'prospect',
      'FDA Publishes Draft Guidance on AI in Drug Discovery',
      'FDA releases comprehensive draft guidance on use of AI/ML in pharmaceutical development, emphasizing model interpretability for regulatory submissions.',
      'FDA', null, '2026-02-28',
      88, 70, 40, 80,
      72, // (88×0.35)+(70×0.30)+(40×0.20)+(80×0.15) = 30.8+21+8+12 = 71.8
      JSON.stringify(['cap-alzheimers', 'cap-memorization']),
      JSON.stringify(['pros-roche', 'pros-astrazeneca', 'pros-cleveland']),
      'Engage pharmaceutical prospects with Alzheimer\'s biomarker case study as proof of regulatory-grade interpretability',
      'Goodfire has already enabled a regulatory-grade scientific discovery — the Alzheimer\'s biomarker work with Prima Mente',
      JSON.stringify(['pharma-rd']),
      'active'
    )

    insertSignal.run(
      'sig-neurips-interp', 'conference',
      'NeurIPS 2026 Announces Interpretability Track',
      'NeurIPS 2026 creates dedicated track for mechanistic interpretability research, reflecting growing academic and industry interest in the field.',
      'NeurIPS Program Committee', null, '2026-04-10',
      70, 50, 30, 85,
      58, // (70×0.35)+(50×0.30)+(30×0.20)+(85×0.15) = 24.5+15+6+12.75 = 58.25
      JSON.stringify(['cap-spd', 'cap-memorization', 'cap-reasoning-hood']),
      JSON.stringify([]),
      'Submit papers and prepare thought leadership content for conference season',
      'Academic validation of interpretability as a field positions Goodfire as the commercial leader',
      JSON.stringify([]),
      'active'
    )

    insertSignal.run(
      'sig-genomics-boom', 'research',
      'Arc Institute Publishes Evo 3 Foundation Model',
      'Arc Institute releases Evo 3, a next-generation genomic foundation model, and publicly credits Goodfire interpretability work as foundational to model development.',
      'Arc Institute', null, '2026-03-01',
      85, 55, 25, 90,
      65, // (85×0.35)+(55×0.30)+(25×0.20)+(90×0.15) = 29.75+16.5+5+13.5 = 64.75
      JSON.stringify(['cap-evo2-tree', 'cap-interpreting-evo2']),
      JSON.stringify(['pros-astrazeneca', 'pros-cleveland']),
      'Amplify the Arc Institute partnership success story across biotech audience',
      'Proven track record with world-class genomics research institution',
      JSON.stringify(['pharma-rd']),
      'active'
    )

    insertSignal.run(
      'sig-banking-guidance', 'regulatory',
      'Federal Reserve Clarifies SR 11-7 Applicability to LLMs',
      'Federal Reserve issues interpretive guidance clarifying that SR 11-7 model risk management requirements apply to large language models used in banking operations.',
      'Federal Reserve Board', null, '2026-03-25',
      91, 85, 55, 80,
      80, // (91×0.35)+(85×0.30)+(55×0.20)+(80×0.15) = 31.85+25.5+11+12 = 80.35
      JSON.stringify(['cap-rlfr', 'cap-model-diff', 'cap-rakuten-pii']),
      JSON.stringify(['pros-jpmorgan', 'pros-goldman', 'pros-eu-bank']),
      'Prioritize banking sector outreach with SR 11-7 compliance messaging',
      'Interpretability is now a regulatory requirement for banks using LLMs — not optional',
      JSON.stringify(['us-banks', 'european-insurers']),
      'active'
    )

    insertSignal.run(
      'sig-hallucination-incident', 'incident',
      'Major Enterprise AI Deployment Halted Due to Hallucination Incident',
      'Fortune 500 company suspends customer-facing AI deployment after high-profile hallucination causes regulatory scrutiny. Industry analysts estimate $50M+ in damages.',
      'Financial Times', null, '2026-02-15',
      93, 92, 65, 70,
      84, // (93×0.35)+(92×0.30)+(65×0.20)+(70×0.15) = 32.55+27.6+13+10.5 = 83.65
      JSON.stringify(['cap-rlfr']),
      JSON.stringify(['pros-eu-bank', 'pros-jpmorgan', 'pros-allianz']),
      'Use as urgency driver in outreach — hallucination is not a theoretical risk',
      'RLFR reduces hallucinations by 58% — this incident was preventable with interpretability',
      JSON.stringify(['us-banks', 'european-insurers']),
      'active'
    )

    insertSignal.run(
      'sig-safety-eval', 'research',
      'Apollo Research Publishes Deceptive Alignment Detection Using Goodfire Tools',
      'Apollo Research publishes results showing Goodfire\'s interpretability tools can detect deceptive alignment patterns in frontier models during evaluation.',
      'Apollo Research', null, '2026-01-20',
      80, 45, 30, 90,
      61, // (80×0.35)+(45×0.30)+(30×0.20)+(90×0.15) = 28+13.5+6+13.5 = 61
      JSON.stringify(['cap-model-diff', 'cap-reasoning-hood']),
      JSON.stringify([]),
      'Cross-promote with AI safety audience and safety-conscious enterprises',
      'Independent validation from leading safety lab demonstrates real-world safety applications',
      JSON.stringify([]),
      'active'
    )

    // New signals (5 entries)
    insertSignal.run(
      'sig-jpmorgan-rfp', 'prospect',
      'JPMorgan Issues AI Risk Assessment RFP',
      'JPMorgan Chase issues formal RFP for AI model risk assessment and interpretability tooling across their AI platform. Requirements include SR 11-7 compliance, model auditing, and real-time monitoring capabilities.',
      'JPMorgan Procurement', null, '2026-03-25',
      95, 90, 40, 95,
      83, // (95×0.35)+(90×0.30)+(40×0.20)+(95×0.15) = 33.25+27+8+14.25 = 82.5
      JSON.stringify(['cap-rlfr', 'cap-model-diff', 'cap-rakuten-pii']),
      JSON.stringify(['pros-jpmorgan']),
      'Respond to RFP with comprehensive proposal covering model audit, hallucination reduction, and runtime monitoring. Reference Rakuten production deployment.',
      'Goodfire offers the only integrated interpretability platform with production-proven model audit, hallucination reduction, and real-time guardrails — exactly what SR 11-7 demands.',
      JSON.stringify(['us-banks']),
      'active'
    )

    insertSignal.run(
      'sig-eiopa-guidance', 'regulatory',
      'EIOPA Releases AI Governance Guidance for Insurers',
      'European Insurance and Occupational Pensions Authority publishes comprehensive AI governance guidance requiring insurers to demonstrate model interpretability for pricing, underwriting, and claims decisions.',
      'EIOPA', null, '2026-03-18',
      90, 85, 50, 80,
      79, // (90×0.35)+(85×0.30)+(50×0.20)+(80×0.15) = 31.5+25.5+10+12 = 79
      JSON.stringify(['cap-rlfr', 'cap-model-diff']),
      JSON.stringify(['pros-allianz', 'pros-bnp', 'pros-ing']),
      'Accelerate outreach to European insurers with EIOPA-specific compliance messaging. Allianz is highest priority.',
      'EIOPA governance guidance makes interpretability mandatory for insurance AI — Goodfire is the only vendor with production-proven capabilities.',
      JSON.stringify(['european-insurers']),
      'active'
    )

    insertSignal.run(
      'sig-bank-chatbot', 'incident',
      'Major Bank Chatbot Incident Reported in Financial Times',
      'A major European bank\'s customer-facing AI chatbot provides incorrect financial advice, leading to regulatory investigation. FT reports the bank lacked model interpretability tools to diagnose the failure.',
      'Financial Times', null, '2026-03-30',
      85, 95, 55, 75,
      81, // (85×0.35)+(95×0.30)+(55×0.20)+(75×0.15) = 29.75+28.5+11+11.25 = 80.5
      JSON.stringify(['cap-rlfr', 'cap-rakuten-pii']),
      JSON.stringify(['pros-eu-bank', 'pros-allianz', 'pros-bnp', 'pros-ing']),
      'Use as urgency driver for EU banking prospects. This is the exact scenario Goodfire prevents.',
      'Another bank chatbot failure — this time with regulatory consequences. RLFR and runtime guardrails prevent this.',
      JSON.stringify(['european-insurers']),
      'active'
    )

    insertSignal.run(
      'sig-neurips-cfp', 'conference',
      'NeurIPS 2026 Interpretability Workshop Call for Papers',
      'NeurIPS 2026 issues call for papers for the Workshop on Mechanistic Interpretability, with submission deadline June 15, 2026.',
      'NeurIPS Program Committee', null, '2026-04-01',
      60, 40, 20, 90,
      51, // (60×0.35)+(40×0.30)+(20×0.20)+(90×0.15) = 21+12+4+13.5 = 50.5
      JSON.stringify(['cap-spd', 'cap-reasoning-hood', 'cap-memorization']),
      JSON.stringify([]),
      'Prepare paper submissions. Coordinate with research team on SPD and Reasoning Hood updates.',
      'Goodfire has the most production-validated interpretability research — NeurIPS is the venue to establish academic credibility.',
      JSON.stringify([]),
      'active'
    )

    insertSignal.run(
      'sig-roche-discovery', 'prospect',
      'Roche Announces AI-Driven Drug Discovery Pipeline',
      'Roche announces expanded investment in AI-driven drug discovery, citing need for interpretable AI models to satisfy FDA requirements for AI-assisted pharmaceutical development.',
      'Roche Investor Relations', null, '2026-03-12',
      80, 50, 30, 85,
      62, // (80×0.35)+(50×0.30)+(30×0.20)+(85×0.15) = 28+15+6+12.75 = 61.75
      JSON.stringify(['cap-alzheimers', 'cap-interpreting-evo2']),
      JSON.stringify(['pros-roche', 'pros-astrazeneca']),
      'Engage Roche with Alzheimer\'s biomarker case study. Their drug discovery pipeline needs the same interpretability methodology.',
      'Roche\'s AI investment creates demand for the exact interpretability methodology Goodfire proved with Prima Mente.',
      JSON.stringify(['pharma-rd']),
      'active'
    )

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: Tables with FKs to Phases 1-2
    // ═══════════════════════════════════════════════════════════════════════

    // ─── 12. Engagements (4 entries) ───────────────────────────────────────

    insertEngagement.run(
      'eng-arc', 'Arc Institute', 'active', 'standard',
      JSON.stringify(['cap-evo2-tree', 'cap-interpreting-evo2']),
      'evo-2', '2025-01-15', null,
      92, 150000, 85000, 43.3,
      'direct', null, null,
      'Flagship genomics partnership. Evo 2 interpretability analysis led to Tree of Life discovery and ongoing Evo 3 collaboration.'
    )

    insertEngagement.run(
      'eng-prima', 'Prima Mente', 'completed', 'complex',
      JSON.stringify(['cap-alzheimers']),
      'pleiades', '2025-06-01', '2026-01-28',
      95, 275000, 150000, 45.5,
      'direct', null, null,
      'First scientific discovery engagement. Alzheimer\'s biomarker work published in peer-reviewed journal.'
    )

    insertEngagement.run(
      'eng-rakuten', 'Rakuten', 'active', 'standard',
      JSON.stringify(['cap-rakuten-pii']),
      'llama-3.3-70b', '2025-04-01', null,
      88, 175000, 85000, 51.4,
      'direct', null, null,
      'Production deployment at scale. SAE probe PII classifier serving 44M+ users. Expanding to jailbreak and toxicity detection.'
    )

    insertEngagement.run(
      'eng-proposed-bank', 'Deutsche Kredit AG', 'proposed', 'complex',
      JSON.stringify(['cap-rlfr', 'cap-model-diff']),
      'llama-3.3-70b', '2026-03-15', null,
      65, 300000, 150000, 50.0,
      'direct', null, 'pros-eu-bank',
      'EU AI Act compliance assessment. Proposed engagement pending board approval. BaFin regulatory pressure accelerating timeline.'
    )

    // ─── 13. Milestones ────────────────────────────────────────────────────

    // Arc Institute milestones
    insertMilestone.run('ms-arc-1', 'eng-arc', 'Evo 2 feature extraction', 'completed', '2025-06-30', '2025-06-30', 0)
    insertMilestone.run('ms-arc-2', 'eng-arc', 'Phylogenetic structure analysis', 'completed', '2025-08-28', '2025-08-28', 1)
    insertMilestone.run('ms-arc-3', 'eng-arc', 'Knowledge transfer report', 'in_progress', '2026-06-30', null, 2)

    // Prima Mente milestones (all completed)
    insertMilestone.run('ms-pm-1', 'eng-prima', 'Pleiades model analysis', 'completed', '2025-09-30', '2025-09-30', 0)
    insertMilestone.run('ms-pm-2', 'eng-prima', 'Novel biomarker class discovery', 'completed', '2025-12-15', '2025-12-15', 1)
    insertMilestone.run('ms-pm-3', 'eng-prima', 'Paper published', 'completed', '2026-01-28', '2026-01-28', 2)

    // Rakuten milestones
    insertMilestone.run('ms-rak-1', 'eng-rakuten', 'SAE probe PII classifier deployed', 'completed', '2025-10-01', '2025-10-01', 0)
    insertMilestone.run('ms-rak-2', 'eng-rakuten', 'Production rollout to 44M+ users', 'completed', '2025-10-28', '2025-10-28', 1)
    insertMilestone.run('ms-rak-3', 'eng-rakuten', 'Expand to jailbreak and toxicity detection', 'in_progress', '2026-06-30', null, 2)

    // Deutsche Kredit AG milestones
    insertMilestone.run('ms-dk-1', 'eng-proposed-bank', 'Regulatory scoping', 'completed', '2026-03-20', '2026-03-20', 0)
    insertMilestone.run('ms-dk-2', 'eng-proposed-bank', 'Model assessment', 'upcoming', '2026-05-01', null, 1)
    insertMilestone.run('ms-dk-3', 'eng-proposed-bank', 'Compliance documentation', 'upcoming', '2026-06-15', null, 2)

    // ─── 14. Predictions (9 entries) ───────────────────────────────────────

    // Arc Institute predictions
    insertPrediction.run(
      'pred-arc-1', 'eng-arc',
      'Evo 2 encodes species-level phylogenetic relationships in layers 18-24 that mirror known evolutionary distances',
      'SAE probe analysis across model layers with phylogenetic distance correlation',
      'high', 'high', 'confirmed',
      'Confirmed: phylogenetic structure found in layers 18-24 with strong correlation to known evolutionary distances. Published in Tree of Life paper.',
      '2025-08-28', 'evo-2'
    )

    insertPrediction.run(
      'pred-arc-2', 'eng-arc',
      'Transfer RNA features cluster by amino acid specificity, not codon sequence',
      'Unsupervised clustering of SAE features activated by tRNA sequences',
      'medium', 'medium', 'confirmed',
      'Confirmed: tRNA features cluster by amino acid with >90% purity, contradicting codon-based organization hypothesis.',
      '2025-07-15', 'evo-2'
    )

    insertPrediction.run(
      'pred-arc-3', 'eng-arc',
      'Regulatory region features will show tissue-type specificity patterns not present in training labels',
      'Supervised probing for tissue-type classification using regulatory region SAE features',
      'high', 'medium', 'untested',
      null, null, 'evo-2'
    )

    // Rakuten predictions
    insertPrediction.run(
      'pred-rak-1', 'eng-rakuten',
      'PII features activate 3-5 tokens before PII text appears in output, enabling pre-generation detection',
      'Temporal analysis of SAE feature activations relative to PII token positions',
      'critical', 'high', 'confirmed',
      'Confirmed: PII features activate 3-4 tokens before PII output on average. Enables pre-generation blocking deployed in production.',
      '2025-09-15', 'llama-3.3-70b'
    )

    insertPrediction.run(
      'pred-rak-2', 'eng-rakuten',
      'Japanese-language PII patterns will share feature subspace with English PII but require 12% additional features for full coverage',
      'Cross-lingual SAE feature overlap analysis between English and Japanese PII detection',
      'high', 'high', 'confirmed',
      'Confirmed: 88% feature overlap with English PII subspace. Required 14% additional features (slightly more than predicted) for production-grade Japanese coverage.',
      '2025-10-15', 'llama-3.3-70b'
    )

    insertPrediction.run(
      'pred-rak-3', 'eng-rakuten',
      'Jailbreak features show higher activation variance than PII features, requiring adaptive thresholds',
      'Statistical analysis of feature activation distributions across jailbreak vs PII examples',
      'high', 'medium', 'untested',
      null, null, 'llama-3.3-70b'
    )

    // Prima Mente predictions
    insertPrediction.run(
      'pred-pm-1', 'eng-prima',
      'Pleiades encodes tissue-type specificity in attention heads 12-16, enabling organ-specific biomarker extraction',
      'Supervised probing of attention head outputs for tissue-type classification',
      'high', 'high', 'confirmed',
      'Confirmed: tissue-type specificity concentrated in heads 14-16. Enabled organ-specific Alzheimer\'s biomarker extraction methodology.',
      '2025-11-20', 'pleiades'
    )

    insertPrediction.run(
      'pred-pm-2', 'eng-prima',
      'Fragment length biomarkers generalize to Parkinson\'s disease detection with AUC > 0.80',
      'Cross-disease validation of fragment length biomarker methodology on Parkinson\'s cohort',
      'critical', 'medium', 'untested',
      null, null, 'pleiades'
    )

    // Deutsche Kredit AG prediction
    insertPrediction.run(
      'pred-dk-1', 'eng-proposed-bank',
      'RLFR reduces hallucination rate below 5% on German-language financial advisory outputs',
      'Cross-lingual RLFR application with domain-specific financial evaluation benchmark',
      'critical', 'medium', 'untested',
      null, null, 'llama-3.3-70b'
    )

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5: Content Calendar (FK to signals)
    // ═══════════════════════════════════════════════════════════════════════

    // ─── 15. Content Calendar (18 entries) ─────────────────────────────────

    // Published content (past dates)
    insertContentCalendar.run(
      'cc-interpreting-evo2-blog', '2025-02-20', 'research',
      'Interpreting Evo 2: Understanding Genomic Foundation Models',
      'Blog post on the first comprehensive interpretability analysis of Arc Institute\'s Evo 2 genomic foundation model.',
      null, JSON.stringify(['cap-interpreting-evo2']), 'published'
    )

    insertContentCalendar.run(
      'cc-reasoning-hood-blog', '2025-04-15', 'research',
      'Under the Hood of a Reasoning Model',
      'Blog post revealing the internal mechanisms of chain-of-thought reasoning in DeepSeek R1.',
      null, JSON.stringify(['cap-reasoning-hood']), 'published'
    )

    insertContentCalendar.run(
      'cc-spd-blog', '2025-06-28', 'research',
      'Towards Scalable Parameter Decomposition',
      'Technical blog post on decomposing model weights into interpretable components.',
      null, JSON.stringify(['cap-spd']), 'published'
    )

    insertContentCalendar.run(
      'cc-model-diff-blog', '2025-08-21', 'research',
      'Model Diff Amplification: Finding One-in-a-Million Behaviors',
      'Blog post on surfacing rare undesired behaviors introduced during post-training.',
      null, JSON.stringify(['cap-model-diff']), 'published'
    )

    insertContentCalendar.run(
      'cc-evo2-tree-blog', '2025-08-28', 'research',
      'Finding the Tree of Life in Evo 2',
      'Blog post on discovering phylogenetic structure encoded in the Evo 2 genomic foundation model.',
      null, JSON.stringify(['cap-evo2-tree']), 'published'
    )

    insertContentCalendar.run(
      'cc-rakuten-case-study', '2025-11-15', 'research',
      'Rakuten Case Study: PII Detection at 44M User Scale',
      'Case study detailing the Rakuten PII detection deployment and production results.',
      null, JSON.stringify(['cap-rakuten-pii']), 'published'
    )

    insertContentCalendar.run(
      'cc-alzheimers-blog', '2026-01-28', 'research',
      'First Scientific Discovery from Model Reverse-Engineering',
      'Blog post on the Alzheimer\'s biomarker discovery with Prima Mente and University of Oxford.',
      null, JSON.stringify(['cap-alzheimers']), 'published'
    )

    insertContentCalendar.run(
      'cc-rlfr-blog', '2026-02-11', 'research',
      'RLFR: 58% Hallucination Reduction via Interpretability',
      'Blog post announcing the RLFR paper and its implications for production AI systems.',
      null, JSON.stringify(['cap-rlfr']), 'published'
    )

    insertContentCalendar.run(
      'cc-reasoning-theater-blog', '2026-03-12', 'research',
      'Reasoning Theater: Cutting Reasoning Model Costs by 68%',
      'Blog post announcing the Reasoning Theater paper and inference cost optimization.',
      null, JSON.stringify(['cap-reasoning-theater']), 'published'
    )

    insertContentCalendar.run(
      'cc-sr117-guide', '2026-04-01', 'regulatory',
      'SR 11-7 Compliance for LLMs: What Banks Need to Know',
      'Technical guide for banking compliance teams on model risk management with interpretability.',
      'sig-banking-guidance', JSON.stringify(['cap-rlfr', 'cap-model-diff']), 'published'
    )

    // Scheduled/upcoming content
    insertContentCalendar.run(
      'cc-eu-ai-act-whitepaper', '2026-04-15', 'regulatory',
      'Interpretability and the EU AI Act: A Technical Compliance Guide',
      'Whitepaper mapping Goodfire capabilities to Article 13 transparency requirements.',
      'sig-eu-ai-act', JSON.stringify(['cap-rlfr', 'cap-rakuten-pii', 'cap-model-diff']), 'scheduled'
    )

    insertContentCalendar.run(
      'cc-eiopa-brief', '2026-04-20', 'regulatory',
      'EIOPA AI Governance: What European Insurers Need to Know',
      'Brief mapping Goodfire capabilities to EIOPA AI governance guidance for insurance AI.',
      'sig-eiopa-guidance', JSON.stringify(['cap-rlfr', 'cap-model-diff']), 'draft'
    )

    insertContentCalendar.run(
      'cc-reasoning-webinar', '2026-04-25', 'conference',
      'Webinar: Understanding What Reasoning Models Actually Do',
      'Technical webinar combining Under the Hood of a Reasoning Model and Reasoning Theater insights.',
      null, JSON.stringify(['cap-reasoning-theater', 'cap-reasoning-hood']), 'scheduled'
    )

    insertContentCalendar.run(
      'cc-genomics-webinar', '2026-05-01', 'conference',
      'Webinar: Genomic AI — From Model to Discovery',
      'Webinar showcasing Evo 2 and Pleiades interpretability work with Arc Institute and Prima Mente.',
      null, JSON.stringify(['cap-evo2-tree', 'cap-interpreting-evo2', 'cap-alzheimers']), 'scheduled'
    )

    insertContentCalendar.run(
      'cc-neurips-prep', '2026-05-15', 'conference',
      'NeurIPS 2026 Paper Submissions',
      'Prepare and submit papers for NeurIPS 2026 interpretability track. Deadline: June 15.',
      'sig-neurips-cfp', JSON.stringify(['cap-spd', 'cap-reasoning-hood', 'cap-memorization']), 'scheduled'
    )

    insertContentCalendar.run(
      'cc-safety-whitepaper', '2026-06-01', 'research',
      'AI Safety Through Interpretability: A Technical Whitepaper',
      'Comprehensive whitepaper on how interpretability enables AI safety — from deceptive alignment detection to hallucination prevention.',
      'sig-safety-eval', JSON.stringify(['cap-rlfr', 'cap-model-diff', 'cap-reasoning-hood']), 'draft'
    )

    // Suggested content (not yet scheduled)
    insertContentCalendar.run(
      'cc-cost-optimization-guide', '2026-05-20', 'competitive',
      'Reasoning Model Cost Optimization: A Practical Guide',
      'Technical guide positioning Reasoning Theater as cost optimization solution amid rising reasoning model prices.',
      'sig-reasoning-cost', JSON.stringify(['cap-reasoning-theater']), 'suggested'
    )

    insertContentCalendar.run(
      'cc-eu-ai-act-deadline', '2026-08-02', 'regulatory',
      'EU AI Act Article 13: Enforcement Day',
      'Compliance deadline content — final push for EU prospects. Enforcement of high-risk AI transparency requirements begins.',
      'sig-eu-ai-act', JSON.stringify(['cap-rlfr', 'cap-rakuten-pii', 'cap-model-diff']), 'scheduled'
    )

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 6: Update peer clusters with prospect IDs
    // ═══════════════════════════════════════════════════════════════════════

    updatePeerClusterProspects.run(JSON.stringify(['pros-eu-bank', 'pros-allianz', 'pros-bnp', 'pros-ing']), 'european-insurers')
    updatePeerClusterProspects.run(JSON.stringify(['pros-jpmorgan', 'pros-goldman']), 'us-banks')
    updatePeerClusterProspects.run(JSON.stringify(['pros-roche', 'pros-astrazeneca']), 'pharma-rd')
    updatePeerClusterProspects.run(JSON.stringify(['pros-bae']), 'defense-contractors')

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 7: Event log (append-only seed history)
    // ═══════════════════════════════════════════════════════════════════════

    // ─── 17. Event Log (13 entries) ────────────────────────────────────────

    // Engagement creation events
    insertEventLog.run('evt-eng-arc-created', '2025-01-15T09:00:00Z', 'engagement.created', 'engagement', 'eng-arc', 'system',
      JSON.stringify({ partner_name: 'Arc Institute', tier: 'standard', model_family: 'evo-2' }))

    insertEventLog.run('evt-eng-rakuten-created', '2025-04-01T09:00:00Z', 'engagement.created', 'engagement', 'eng-rakuten', 'system',
      JSON.stringify({ partner_name: 'Rakuten', tier: 'standard', model_family: 'llama-3.3-70b' }))

    insertEventLog.run('evt-eng-prima-created', '2025-06-01T09:00:00Z', 'engagement.created', 'engagement', 'eng-prima', 'system',
      JSON.stringify({ partner_name: 'Prima Mente', tier: 'complex', model_family: 'pleiades' }))

    insertEventLog.run('evt-eng-bank-created', '2026-03-15T09:00:00Z', 'engagement.created', 'engagement', 'eng-proposed-bank', 'system',
      JSON.stringify({ partner_name: 'Deutsche Kredit AG', tier: 'complex', model_family: 'llama-3.3-70b' }))

    // Milestone completion events
    insertEventLog.run('evt-ms-arc-1', '2025-06-30T17:00:00Z', 'milestone.completed', 'milestone', 'ms-arc-1', 'applied_ai_lead',
      JSON.stringify({ engagement_id: 'eng-arc', title: 'Evo 2 feature extraction' }))

    insertEventLog.run('evt-ms-arc-2', '2025-08-28T17:00:00Z', 'milestone.completed', 'milestone', 'ms-arc-2', 'applied_ai_lead',
      JSON.stringify({ engagement_id: 'eng-arc', title: 'Phylogenetic structure analysis' }))

    insertEventLog.run('evt-ms-rak-1', '2025-10-01T17:00:00Z', 'milestone.completed', 'milestone', 'ms-rak-1', 'applied_ai_lead',
      JSON.stringify({ engagement_id: 'eng-rakuten', title: 'SAE probe PII classifier deployed' }))

    insertEventLog.run('evt-ms-rak-2', '2025-10-28T17:00:00Z', 'milestone.completed', 'milestone', 'ms-rak-2', 'applied_ai_lead',
      JSON.stringify({ engagement_id: 'eng-rakuten', title: 'Production rollout to 44M+ users' }))

    // Prediction outcome events
    insertEventLog.run('evt-pred-arc-1', '2025-08-28T18:00:00Z', 'prediction.outcome_recorded', 'prediction', 'pred-arc-1', 'researcher',
      JSON.stringify({ engagement_id: 'eng-arc', outcome: 'confirmed', description: 'Phylogenetic relationships in layers 18-24' }))

    insertEventLog.run('evt-pred-rak-1', '2025-09-15T18:00:00Z', 'prediction.outcome_recorded', 'prediction', 'pred-rak-1', 'applied_ai_lead',
      JSON.stringify({ engagement_id: 'eng-rakuten', outcome: 'confirmed', description: 'PII features activate 3-5 tokens before output' }))

    // Recent signal detection events
    insertEventLog.run('evt-sig-jpmorgan', '2026-03-25T10:00:00Z', 'signal.detected', 'signal', 'sig-jpmorgan-rfp', 'system',
      JSON.stringify({ type: 'prospect', title: 'JPMorgan Issues AI Risk Assessment RFP', actionability_score: 83 }))

    insertEventLog.run('evt-sig-bank-chatbot', '2026-03-30T08:00:00Z', 'signal.detected', 'signal', 'sig-bank-chatbot', 'system',
      JSON.stringify({ type: 'incident', title: 'Major Bank Chatbot Incident Reported in FT', actionability_score: 81 }))

    insertEventLog.run('evt-sig-eiopa', '2026-03-18T09:00:00Z', 'signal.detected', 'signal', 'sig-eiopa-guidance', 'system',
      JSON.stringify({ type: 'regulatory', title: 'EIOPA Releases AI Governance Guidance for Insurers', actionability_score: 79 }))
  })

  seedAll()
}
