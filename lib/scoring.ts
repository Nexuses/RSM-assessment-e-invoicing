export type AssessmentAxisResult = {
  score: number;
  category: string;
  recommendation: string;
};

export type PhaseRecommendation = {
  phase: 'phase_1' | 'phase_2' | 'other';
  label: string;
  description: string;
};

export type AssessmentResult = {
  eligible: boolean;
  ineligibleReason?: string;
  phaseRecommendation: PhaseRecommendation;
  urgency: AssessmentAxisResult;
  complexity: AssessmentAxisResult;
  totalScore: number;
  maxUrgencyScore: number;
  maxComplexityScore: number;
};

/** Phase is driven by question 1 (q2): annual aggregate turnover band. */
export function getPhaseFromTurnover(answers: Record<string, string>): PhaseRecommendation {
  switch (answers.q2) {
    case 'gt_50m':
      return {
        phase: 'phase_1',
        label: 'Phase 1',
        description:
          'Contact RSM to schedule a meeting to assess your technical and compliance readiness for Phase 1 (critical priority).',
      };
    case 'lt_50m':
      return {
        phase: 'phase_2',
        label: 'Phase 2',
        description:
          'Start planning for Phase 2 compliance (2027+) and engage with a solution provider.',
      };
    default:
      return {
        phase: 'other',
        label: 'To be confirmed',
        description:
          'Monitor regulatory updates and prepare when required. Phase applicability could not be determined from your turnover response.',
      };
  }
}

const MAX_URGENCY = 23;
const MAX_COMPLEXITY = 76;

const urgencyCategory = (score: number): AssessmentAxisResult => {
  if (score >= 18) {
    return {
      score,
      category: 'Critical / Phase 1',
      recommendation:
        'Immediate Action. Client is a prime target for the July 2026 mandate. Mobilize assessment team immediately.',
    };
  }
  if (score >= 10) {
    return {
      score,
      category: 'Phase 2 / High Likely',
      recommendation:
        'Planning Phase. Likely targeted for 2027, but should start vendor selection now to avoid bottlenecks.',
    };
  }
  return {
    score,
    category: 'Low Priority / Exempt',
    recommendation:
      'Monitor. Keep client informed of regulatory changes. No immediate implementation needed.',
  };
};

const complexityCategory = (score: number): AssessmentAxisResult => {
  if (score >= 40) {
    return {
      score,
      category: 'Enterprise / Complex',
      recommendation:
        'Custom Project. Requires dedicated Project Manager, robust middleware, data residency handling, and significant ERP customization.',
    };
  }
  if (score >= 20) {
    return {
      score,
      category: 'Standard Integration',
      recommendation:
        'Middleware Solution. Use standard connectors (API/SFTP) with moderate mapping for multiple templates or entities.',
    };
  }
  if (score >= 10) {
    return {
      score,
      category: 'Simple / Plugin',
      recommendation:
        'Plug & Play. Use ready-made connectors for Tier 2 ERPs (Zoho/Xero) or simple direct API.',
    };
  }
  return {
    score,
    category: 'Manual / Portal',
    recommendation:
      'Portal Solution. Volume is too low to justify integration. Recommend web-portal manual entry or excel upload.',
  };
};

const parseCsv = (value?: string): string[] =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export function computeAssessment(answers: Record<string, string>): AssessmentResult {
  const vatRegistered = answers.q5 === '1';
  if (!vatRegistered) {
    return {
      eligible: false,
      ineligibleReason:
        'Not registered for VAT in the UAE. Per the assessment logic, this disqualifies the entity from the e-invoicing mandate scope for scoring purposes.',
      phaseRecommendation: getPhaseFromTurnover(answers),
      urgency: { score: 0, category: 'Out of scope', recommendation: 'No scoring applied.' },
      complexity: { score: 0, category: 'N/A', recommendation: 'No scoring applied.' },
      totalScore: 0,
      maxUrgencyScore: MAX_URGENCY,
      maxComplexityScore: MAX_COMPLEXITY,
    };
  }

  // Axis A (Urgency): Q1, Q2, Q3, Q4
  const q1 = (() => {
    switch (answers.q1) {
      case 'uae_mainland':
        return 5;
      case 'uae_free_zone':
        return 3;
      case 'outside_uae':
        return 1;
      default:
        return 0;
    }
  })();

  const q2 = (() => {
    switch (answers.q2) {
      case 'gt_50m':
        return 10;
      case 'lt_50m':
        return 5;
      case 'not_registered_vat':
        return 0;
      default:
        return 0;
    }
  })();

  // Q3: If any B2B or B2G selected => 5 points; else if only B2C => 1; else 0
  const q3Selections = new Set(parseCsv(answers.q3));
  const q3 = (() => {
    const hasB2BOrB2G = q3Selections.has('b2b') || q3Selections.has('b2g');
    const hasB2C = q3Selections.has('b2c');
    if (hasB2BOrB2G) return 5;
    if (hasB2C) return 1;
    return 0;
  })();

  const q4 = (() => {
    if (!answers.q4) return 0;
    if (answers.q4 === 'general_trading') return 3;
    // Any of the exempt/special sectors
    return 1;
  })();

  const urgencyScore = q1 + q2 + q3 + q4;

  // Axis B (Complexity): Q6 - Q16
  const q6 = (() => {
    switch (answers.q6) {
      case 'lt_1k':
        return 1;
      case '1k_10k':
        return 3;
      case '10k_100k':
        return 5;
      case 'gt_100k':
        return 10;
      default:
        return 0;
    }
  })();

  const q7 = (() => {
    switch (answers.q7) {
      case 'single_trn':
        return 1;
      case 'multiple_trn':
        return 5;
      case 'tax_group':
        return 8;
      default:
        return 0;
    }
  })();

  const q8 = (() => {
    const raw = answers.q8;
    if (raw === '1') return 3;
    if (raw === '0') return 0;
    try {
      const parsed = JSON.parse(raw) as { choice?: string };
      if (parsed.choice === '1') return 3;
      if (parsed.choice === '0' || parsed.choice === 'no_branch') return 0;
    } catch {
      // legacy plain value
    }
    return 0;
  })();

  const q9 = (() => {
    const raw = answers.q9;
    let value = raw;
    try {
      const parsed = JSON.parse(raw) as { value?: string };
      if (parsed.value) value = parsed.value;
    } catch {
      // plain value
    }
    switch (value) {
      case 'uae_only':
        return 0;
      case 'ksa':
      case 'global':
        return 5;
      default:
        return 0;
    }
  })();

  const q10 = (() => {
    const raw = answers.q10;
    let value = raw;
    try {
      const parsed = JSON.parse(raw) as { value?: string };
      if (parsed.value) value = parsed.value;
    } catch {
      // plain value
    }
    switch (value) {
      case 'tier1':
        return 3;
      case 'tier2':
        return 1;
      case 'custom':
      case 'other':
        return 8;
      case 'manual':
        return 15;
      default:
        return 0;
    }
  })();

  const q11 = (() => {
    switch (answers.q11) {
      case 'api':
        return 0;
      case 'sftp':
        return 5;
      case 'manual':
        return 10;
      case 'unknown':
        return 5;
      default:
        return 0;
    }
  })();

  const q12 = (() => {
    switch (answers.q12) {
      case 'cloud_uae':
      case 'onprem_uae':
        return 0;
      case 'cloud_global':
      case 'local':
        return 5;
      default:
        return 0;
    }
  })();

  const q13 = (() => {
    switch (answers.q13) {
      case 'inhouse':
        return 0;
      case 'external':
      case 'none':
        return 5;
      default:
        return 0;
    }
  })();

  const q14 = answers.q14 === '1' ? 5 : 0;
  const q15 = answers.q15 === '1' ? 2 : 0;

  const q16 = (() => {
    switch (answers.q16) {
      case 'one':
        return 0;
      case 'two_to_five':
        return 3;
      case 'five_plus':
        return 8;
      default:
        return 0;
    }
  })();

  const complexityScore = q6 + q7 + q8 + q9 + q10 + q11 + q12 + q13 + q14 + q15 + q16;

  const urgency = urgencyCategory(urgencyScore);
  const complexity = complexityCategory(complexityScore);

  return {
    eligible: true,
    phaseRecommendation: getPhaseFromTurnover(answers),
    urgency,
    complexity,
    totalScore: urgencyScore + complexityScore,
    maxUrgencyScore: MAX_URGENCY,
    maxComplexityScore: MAX_COMPLEXITY,
  };
}

