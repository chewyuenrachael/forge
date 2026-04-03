import type Database from 'better-sqlite3'

export function seedDatabase(db: Database.Database): void {
  const insertCapability = db.prepare(`
    INSERT INTO capabilities (id, name, paper_title, authors, date, type, description, key_results, partner_solution, readiness, model_families, partners)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertEvidence = db.prepare(`
    INSERT INTO evidence (id, capability_id, metric, value, context, source)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertAudience = db.prepare(`
    INSERT INTO audiences (id, type, title, pain_points, framing_emphasis, language_register)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertProspect = db.prepare(`
    INSERT INTO prospects (id, name, industry, estimated_ai_spend, model_families, pain_points, regulatory_exposure, priority_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertSignal = db.prepare(`
    INSERT INTO signals (id, type, title, description, source, date, relevance_score, matched_capability_ids, suggested_action, narrative_angle)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertEngagement = db.prepare(`
    INSERT INTO engagements (id, partner_name, status, capabilities_applied, start_date, health_score, milestones)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertContentCalendar = db.prepare(`
    INSERT INTO content_calendar (id, date, type, title, description)
    VALUES (?, ?, ?, ?, ?)
  `)

  const seedAll = db.transaction(() => {
    // ─── Capabilities ──────────────────────────────────────────────────

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

    // ─── Evidence ──────────────────────────────────────────────────────

    insertEvidence.run('ev-rlfr-1', 'cap-rlfr', 'Hallucination reduction', '58%', 'Topline with best-of-32 on Gemma 12B', 'Prasad et al., Feb 2026')
    insertEvidence.run('ev-rlfr-2', 'cap-rlfr', 'Hallucination reduction (no test-time)', '31%', 'RLFR-NI variant without test-time interventions', 'Prasad et al., Feb 2026')
    insertEvidence.run('ev-rlfr-3', 'cap-rlfr', 'Cost efficiency vs LLM-as-judge', '90x cheaper', 'Per-intervention cost comparison', 'Prasad et al., Feb 2026')
    insertEvidence.run('ev-rlfr-4', 'cap-rlfr', 'Domain coverage', '8 domains', 'Biography, science, medical, history, geography, citations, legal, general', 'Prasad et al., Feb 2026')

    insertEvidence.run('ev-rt-1', 'cap-reasoning-theater', 'Token savings (MMLU)', '68%', 'Early exit at 95% probe confidence', 'Boppana et al., Mar 2026')
    insertEvidence.run('ev-rt-2', 'cap-reasoning-theater', 'Token savings (GPQA-Diamond)', '30%', 'On harder reasoning tasks', 'Boppana et al., Mar 2026')
    insertEvidence.run('ev-rt-3', 'cap-reasoning-theater', 'Token savings (easy recall)', '80%', 'On easy recall tasks', 'Boppana et al., Mar 2026')

    insertEvidence.run('ev-alz-1', 'cap-alzheimers', 'Novel biomarker discovery', 'DNA fragment length patterns', 'First scientific discovery via model reverse-engineering', 'Wang et al., Jan 2026')
    insertEvidence.run('ev-alz-2', 'cap-alzheimers', 'Classifier generalization', 'Better than prior biomarker classes', 'On independent cohort', 'Wang et al., Jan 2026')

    insertEvidence.run('ev-rak-1', 'cap-rakuten-pii', 'Production deployment scale', '44M+ users', 'Rakuten platform deployment', 'Nguyen et al., Oct 2025')
    insertEvidence.run('ev-rak-2', 'cap-rakuten-pii', 'Inference overhead', 'Sub-millisecond', 'Real-time PII detection', 'Nguyen et al., Oct 2025')

    insertEvidence.run('ev-md-1', 'cap-model-diff', 'Behavior detection sensitivity', '1 in 1,000,000 samples', 'Rare undesired behavior detection', 'Aranguri & McGrath, Aug 2025')

    insertEvidence.run('ev-mem-1', 'cap-memorization', 'Reasoning improvement', 'Improved after weight removal', 'Removing memorization weights improves reasoning', 'Merullo et al., Nov 2025')

    // ─── Audiences ─────────────────────────────────────────────────────

    insertAudience.run(
      'aud-ml-engineer',
      'ml_engineer',
      'ML Engineer / AI Platform Lead',
      JSON.stringify([
        'Model hallucinations in production',
        'Inference cost scaling with reasoning models',
        'Lack of visibility into model behavior',
        'PII leakage and safety guardrail gaps',
      ]),
      'Technical depth, benchmarks, integration simplicity',
      'Technical, precise, benchmark-driven'
    )

    insertAudience.run(
      'aud-cto',
      'cto',
      'CTO / Head of AI',
      JSON.stringify([
        'AI spend growing faster than revenue',
        'Board pressure on responsible AI',
        'Regulatory compliance uncertainty',
        'Model reliability for customer-facing products',
      ]),
      'ROI, risk reduction, competitive advantage',
      'Executive, outcome-oriented, strategic'
    )

    insertAudience.run(
      'aud-compliance',
      'compliance',
      'Compliance / Risk Officer',
      JSON.stringify([
        'EU AI Act Article 13 transparency requirements',
        'SR 11-7 model risk management for banking',
        'FDA AI/ML guidance for medical devices',
        'Audit trail and explainability demands',
      ]),
      'Regulatory alignment, audit readiness, risk quantification',
      'Formal, regulation-aware, risk-focused'
    )

    insertAudience.run(
      'aud-researcher',
      'researcher',
      'Research Director',
      JSON.stringify([
        'Understanding what foundation models actually learn',
        'Reproducibility and interpretability of model behavior',
        'Bridging the gap between research and deployment',
        'Scientific discovery acceleration',
      ]),
      'Methodological rigor, novel insights, peer-reviewed foundations',
      'Academic, methodologically precise, citation-heavy'
    )

    insertAudience.run(
      'aud-general',
      'general',
      'AI Community & Public',
      JSON.stringify([
        'AI safety and trustworthiness concerns',
        'Understanding vs black-box AI',
        'Practical applications of interpretability',
        'Responsible AI development',
      ]),
      'Accessibility, real-world impact, safety narrative',
      'Accessible, narrative-driven, impact-focused'
    )

    // ─── Prospects ─────────────────────────────────────────────────────

    insertProspect.run(
      'pros-eu-bank',
      'Deutsche Kredit AG',
      'European Banking',
      2400000,
      JSON.stringify(['GPT-4', 'Claude 3.5']),
      JSON.stringify(['EU AI Act compliance deadline', 'SR 11-7 model validation', 'Hallucination risk in customer-facing AI']),
      JSON.stringify(['eu_ai_act', 'sr_11_7']),
      92
    )

    insertProspect.run(
      'pros-pharma',
      'Meridian Therapeutics',
      'Pharmaceutical',
      1800000,
      JSON.stringify(['Custom genomic models', 'GPT-4']),
      JSON.stringify(['Drug discovery model transparency', 'FDA AI/ML compliance', 'Biomarker validation']),
      JSON.stringify(['fda']),
      87
    )

    insertProspect.run(
      'pros-ai-lab',
      'Frontier Systems',
      'Frontier AI',
      5000000,
      JSON.stringify(['Proprietary LLMs']),
      JSON.stringify(['Reasoning model optimization', 'Safety evaluation at scale', 'Cost of inference']),
      JSON.stringify([]),
      85
    )

    insertProspect.run(
      'pros-defense',
      'Athena Defense Solutions',
      'Defense & Intelligence',
      3200000,
      JSON.stringify(['Classified models']),
      JSON.stringify(['Model auditability requirements', 'Adversarial robustness', 'Explainability for decision support']),
      JSON.stringify(['eu_ai_act']),
      78
    )

    insertProspect.run(
      'pros-healthcare',
      'Pacific Health Network',
      'Healthcare',
      1200000,
      JSON.stringify(['Med-PaLM', 'GPT-4']),
      JSON.stringify(['Clinical AI hallucination risk', 'Patient safety requirements', 'FDA pre-market review']),
      JSON.stringify(['fda']),
      83
    )

    insertProspect.run(
      'pros-finserv',
      'Atlas Capital Partners',
      'Financial Services',
      2800000,
      JSON.stringify(['GPT-4', 'Claude 3.5', 'Llama 3']),
      JSON.stringify(['Model risk management under SR 11-7', 'Trading model transparency', 'Regulatory reporting automation']),
      JSON.stringify(['sr_11_7']),
      88
    )

    // ─── Signals ───────────────────────────────────────────────────────

    insertSignal.run(
      'sig-eu-ai-act',
      'regulatory',
      'EU AI Act High-Risk Provisions Take Effect',
      'EU AI Act Article 13 transparency requirements become enforceable August 2, 2026. High-risk AI systems must demonstrate interpretability and provide meaningful explanations of their decision-making processes.',
      'European Commission',
      '2026-08-02',
      98,
      JSON.stringify(['cap-rlfr', 'cap-rakuten-pii', 'cap-model-diff']),
      'Accelerate outreach to EU-regulated prospects with compliance-focused messaging',
      'Goodfire interpretability as the path to Article 13 compliance'
    )

    insertSignal.run(
      'sig-nist-update',
      'regulatory',
      'NIST AI RMF Profile Update for Generative AI',
      'NIST releases updated AI Risk Management Framework guidance specifically addressing generative AI transparency and interpretability requirements.',
      'NIST',
      '2026-03-15',
      82,
      JSON.stringify(['cap-rlfr', 'cap-model-diff', 'cap-reasoning-hood']),
      'Reference NIST alignment in US-focused prospect communications',
      'Goodfire capabilities map directly to NIST AI RMF GOVERN and MAP functions'
    )

    insertSignal.run(
      'sig-reasoning-cost',
      'competitor',
      'Major AI Lab Announces 10x Reasoning Model Cost Increase',
      'Leading AI provider raises pricing for reasoning model API access, citing compute costs. Enterprise customers report 3-5x budget overruns on reasoning workloads.',
      'Industry reports',
      '2026-03-20',
      95,
      JSON.stringify(['cap-reasoning-theater']),
      'Position Reasoning Theater as immediate cost relief for reasoning model users',
      '68% token savings directly addresses the cost crisis in reasoning model deployment'
    )

    insertSignal.run(
      'sig-colorado-sb205',
      'regulatory',
      'Colorado SB 205 AI Transparency Law Implementation',
      'Colorado becomes first US state to require algorithmic impact assessments for high-risk AI systems, with enforcement beginning Q3 2026.',
      'Colorado General Assembly',
      '2026-04-01',
      75,
      JSON.stringify(['cap-rlfr', 'cap-model-diff']),
      'Target Colorado-based enterprises and companies with Colorado operations',
      'State-level regulation signals coming federal action — early movers gain competitive advantage'
    )

    insertSignal.run(
      'sig-pharma-ai',
      'prospect',
      'FDA Publishes Draft Guidance on AI in Drug Discovery',
      'FDA releases comprehensive draft guidance on use of AI/ML in pharmaceutical development, emphasizing model interpretability for regulatory submissions.',
      'FDA',
      '2026-02-28',
      88,
      JSON.stringify(['cap-alzheimers', 'cap-memorization']),
      'Engage pharmaceutical prospects with Alzheimer\'s biomarker case study as proof of regulatory-grade interpretability',
      'Goodfire has already enabled a regulatory-grade scientific discovery — the Alzheimer\'s biomarker work with Prima Mente'
    )

    insertSignal.run(
      'sig-neurips-interp',
      'conference',
      'NeurIPS 2026 Announces Interpretability Track',
      'NeurIPS 2026 creates dedicated track for mechanistic interpretability research, reflecting growing academic and industry interest in the field.',
      'NeurIPS Program Committee',
      '2026-04-10',
      70,
      JSON.stringify(['cap-spd', 'cap-memorization', 'cap-reasoning-hood']),
      'Submit papers and prepare thought leadership content for conference season',
      'Academic validation of interpretability as a field positions Goodfire as the commercial leader'
    )

    insertSignal.run(
      'sig-genomics-boom',
      'research',
      'Arc Institute Publishes Evo 3 Foundation Model',
      'Arc Institute releases Evo 3, a next-generation genomic foundation model, and publicly credits Goodfire interpretability work as foundational to model development.',
      'Arc Institute',
      '2026-03-01',
      85,
      JSON.stringify(['cap-evo2-tree', 'cap-interpreting-evo2']),
      'Amplify the Arc Institute partnership success story across biotech audience',
      'Proven track record with world-class genomics research institution'
    )

    insertSignal.run(
      'sig-banking-guidance',
      'regulatory',
      'Federal Reserve Clarifies SR 11-7 Applicability to LLMs',
      'Federal Reserve issues interpretive guidance clarifying that SR 11-7 model risk management requirements apply to large language models used in banking operations.',
      'Federal Reserve Board',
      '2026-03-25',
      91,
      JSON.stringify(['cap-rlfr', 'cap-model-diff', 'cap-rakuten-pii']),
      'Prioritize banking sector outreach with SR 11-7 compliance messaging',
      'Interpretability is now a regulatory requirement for banks using LLMs — not optional'
    )

    insertSignal.run(
      'sig-hallucination-incident',
      'competitor',
      'Major Enterprise AI Deployment Halted Due to Hallucination Incident',
      'Fortune 500 company suspends customer-facing AI deployment after high-profile hallucination causes regulatory scrutiny. Industry analysts estimate $50M+ in damages.',
      'Financial Times',
      '2026-02-15',
      93,
      JSON.stringify(['cap-rlfr']),
      'Use as urgency driver in outreach — hallucination is not a theoretical risk',
      'RLFR reduces hallucinations by 58% — this incident was preventable with interpretability'
    )

    insertSignal.run(
      'sig-safety-eval',
      'research',
      'Apollo Research Publishes Deceptive Alignment Detection Using Goodfire Tools',
      'Apollo Research publishes results showing Goodfire\'s interpretability tools can detect deceptive alignment patterns in frontier models during evaluation.',
      'Apollo Research',
      '2026-01-20',
      80,
      JSON.stringify(['cap-model-diff', 'cap-reasoning-hood']),
      'Cross-promote with AI safety audience and safety-conscious enterprises',
      'Independent validation from leading safety lab demonstrates real-world safety applications'
    )

    // ─── Engagements ───────────────────────────────────────────────────

    insertEngagement.run(
      'eng-arc',
      'Arc Institute',
      'active',
      JSON.stringify(['cap-evo2-tree', 'cap-interpreting-evo2']),
      '2025-01-15',
      92,
      JSON.stringify([
        { id: 'ms-arc-1', title: 'Evo 2 interpretability analysis complete', status: 'completed', due_date: '2025-06-30' },
        { id: 'ms-arc-2', title: 'Tree of Life paper published', status: 'completed', due_date: '2025-08-28' },
        { id: 'ms-arc-3', title: 'Evo 3 interpretability collaboration', status: 'in_progress', due_date: '2026-06-30' },
      ])
    )

    insertEngagement.run(
      'eng-prima',
      'Prima Mente',
      'completed',
      JSON.stringify(['cap-alzheimers']),
      '2025-06-01',
      95,
      JSON.stringify([
        { id: 'ms-pm-1', title: 'Pleiades model analysis', status: 'completed', due_date: '2025-09-30' },
        { id: 'ms-pm-2', title: 'Novel biomarker class discovery', status: 'completed', due_date: '2025-12-15' },
        { id: 'ms-pm-3', title: 'Paper published', status: 'completed', due_date: '2026-01-28' },
      ])
    )

    insertEngagement.run(
      'eng-rakuten',
      'Rakuten',
      'active',
      JSON.stringify(['cap-rakuten-pii']),
      '2025-04-01',
      88,
      JSON.stringify([
        { id: 'ms-rak-1', title: 'SAE probe PII classifier deployed', status: 'completed', due_date: '2025-10-01' },
        { id: 'ms-rak-2', title: 'Production rollout to 44M+ users', status: 'completed', due_date: '2025-10-28' },
        { id: 'ms-rak-3', title: 'Expand to jailbreak and toxicity detection', status: 'in_progress', due_date: '2026-06-30' },
      ])
    )

    insertEngagement.run(
      'eng-proposed-bank',
      'Deutsche Kredit AG',
      'proposed',
      JSON.stringify(['cap-rlfr', 'cap-model-diff']),
      '2026-03-15',
      65,
      JSON.stringify([
        { id: 'ms-dk-1', title: 'Technical discovery call', status: 'completed', due_date: '2026-03-20' },
        { id: 'ms-dk-2', title: 'EU AI Act compliance assessment', status: 'upcoming', due_date: '2026-05-01' },
        { id: 'ms-dk-3', title: 'Pilot scope definition', status: 'upcoming', due_date: '2026-06-15' },
      ])
    )

    // ─── Content Calendar ──────────────────────────────────────────────

    insertContentCalendar.run(
      'cc-rlfr-blog',
      '2026-02-11',
      'research',
      'RLFR: 58% Hallucination Reduction via Interpretability',
      'Blog post announcing the RLFR paper and its implications for production AI systems.'
    )

    insertContentCalendar.run(
      'cc-alzheimers-blog',
      '2026-01-28',
      'research',
      'First Scientific Discovery from Model Reverse-Engineering',
      'Blog post on the Alzheimer\'s biomarker discovery with Prima Mente and Oxford.'
    )

    insertContentCalendar.run(
      'cc-reasoning-theater-blog',
      '2026-03-12',
      'research',
      'Reasoning Theater: Cutting Reasoning Model Costs by 68%',
      'Blog post announcing the Reasoning Theater paper and inference cost optimization.'
    )

    insertContentCalendar.run(
      'cc-eu-ai-act-whitepaper',
      '2026-04-15',
      'regulatory',
      'Interpretability and the EU AI Act: A Technical Compliance Guide',
      'Whitepaper mapping Goodfire capabilities to Article 13 transparency requirements.'
    )

    insertContentCalendar.run(
      'cc-rakuten-case-study',
      '2025-11-15',
      'research',
      'Rakuten Case Study: PII Detection at 44M User Scale',
      'Case study detailing the Rakuten PII detection deployment and results.'
    )

    insertContentCalendar.run(
      'cc-neurips-prep',
      '2026-05-15',
      'conference',
      'NeurIPS 2026 Paper Submissions',
      'Prepare and submit papers for NeurIPS 2026 interpretability track.'
    )

    insertContentCalendar.run(
      'cc-sr117-guide',
      '2026-04-01',
      'regulatory',
      'SR 11-7 Compliance for LLMs: What Banks Need to Know',
      'Technical guide for banking compliance teams on model risk management with interpretability.'
    )

    insertContentCalendar.run(
      'cc-reasoning-webinar',
      '2026-04-20',
      'suggested',
      'Webinar: Understanding What Reasoning Models Actually Do',
      'Technical webinar combining Under the Hood of a Reasoning Model and Reasoning Theater insights.'
    )
  })

  seedAll()
}
