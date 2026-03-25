import type {
  AggregateScores,
  DimensionKey,
  MultiSelectToolOption,
  ReadinessBand,
  RoleLevel,
  SingleChoiceOption
} from "../types/assessment.js";

export const ROLE_LEVELS: RoleLevel[] = ["c-suite", "manager", "ic"];

export const SINGLE_CHOICE_OPTIONS: SingleChoiceOption[] = ["A", "B", "C", "D"];

export const SINGLE_CHOICE_SCORES: Record<SingleChoiceOption, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 4
};

export const MULTI_SELECT_TOOL_OPTIONS: MultiSelectToolOption[] = [
  "generative-ai-document-drafting",
  "ai-assisted-data-analysis",
  "automated-customer-communication",
  "compliance-monitoring",
  "ml-credit-scoring",
  "llm-regulatory-analysis",
  "none-of-the-above"
];

export const QUESTION_DIMENSIONS: Record<number, DimensionKey> = {
  1: "aiLiteracy",
  2: "aiLiteracy",
  3: "aiLiteracy",
  4: "aiLiteracy",
  5: "aiLiteracy",
  6: "dataReadiness",
  7: "dataReadiness",
  8: "dataReadiness",
  9: "dataReadiness",
  10: "dataReadiness",
  11: "aiStrategy",
  12: "aiStrategy",
  13: "aiStrategy",
  14: "aiStrategy",
  15: "aiStrategy",
  16: "workflowAdoption",
  17: "workflowAdoption",
  18: "workflowAdoption",
  19: "workflowAdoption",
  20: "workflowAdoption",
  21: "ethicsCompliance",
  22: "ethicsCompliance",
  23: "ethicsCompliance",
  24: "ethicsCompliance",
  25: "ethicsCompliance"
};

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  aiLiteracy: "AI Awareness & Literacy",
  dataReadiness: "Data Infrastructure & Readiness",
  aiStrategy: "AI Strategy & Leadership",
  workflowAdoption: "Workflow Integration & Adoption",
  ethicsCompliance: "Ethics, Risk & Compliance"
};

export const TOTAL_QUESTIONS = 25;

export const MULTI_SELECT_QUESTION_ID = 4;

export const ZERO_DIMENSION_SCORES = {
  aiLiteracy: 0,
  dataReadiness: 0,
  aiStrategy: 0,
  workflowAdoption: 0,
  ethicsCompliance: 0
};

export const ZERO_AGGREGATE_SCORES: AggregateScores = {
  ...ZERO_DIMENSION_SCORES,
  total: 0
};

export const READINESS_BANDS: ReadinessBand[] = [
  {
    min: 0,
    max: 30,
    label: "Low",
    description: "Significant foundational gaps across most dimensions."
  },
  {
    min: 31,
    max: 54,
    label: "Developing",
    description:
      "Awareness exists but capability is inconsistent and untrained."
  },
  {
    min: 55,
    max: 74,
    label: "Moderate",
    description: "Functional AI readiness with clear upskilling opportunities."
  },
  {
    min: 75,
    max: 89,
    label: "Advanced",
    description:
      "Strong capability; focus on strategic integration and governance."
  },
  {
    min: 90,
    max: 100,
    label: "Leading",
    description:
      "Benchmark-level readiness; focus on competitive differentiation."
  }
];

export const DIMENSION_RECOMMENDATIONS: Record<DimensionKey, string> = {
  aiLiteracy:
    "Run role-based AI literacy training with practical evaluation exercises for frontline staff and managers.",
  dataReadiness:
    "Formalise data quality, governance, and cross-functional access patterns before scaling AI workflows.",
  aiStrategy:
    "Assign executive ownership, define funded use cases, and track AI progress on a leadership cadence.",
  workflowAdoption:
    "Pair tooling rollouts with change management, champions, and productivity metrics that show impact.",
  ethicsCompliance:
    "Operationalise responsible AI controls with documented review paths, bias checks, and regulator-ready audit trails."
};
