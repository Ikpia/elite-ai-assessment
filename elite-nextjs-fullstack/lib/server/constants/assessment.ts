import type {
  AggregateScores,
  DimensionKey,
  FirmType,
  MultiSelectToolOption,
  ReadinessBand,
  RoleLevel,
  SingleChoiceOption
} from "../types/assessment";

export const ROLE_LEVELS: RoleLevel[] = ["director", "c-suite", "manager", "ic"];
export const FIRM_TYPES: FirmType[] = [
  "financial-services",
  "healthcare",
  "consulting-firms",
  "smes"
];

export const SINGLE_CHOICE_OPTIONS: SingleChoiceOption[] = ["A", "B", "C", "D"];

export const SINGLE_CHOICE_SCORES: Record<SingleChoiceOption, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 4
};

export const MULTI_SELECT_TOOL_OPTIONS: MultiSelectToolOption[] = [
  "option-1",
  "option-2",
  "option-3",
  "option-4",
  "option-5",
  "option-6",
  "option-7",
  "option-8",
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
  aiStrategy: "Process Integration Capability",
  workflowAdoption: "Leadership & Strategic Alignment",
  ethicsCompliance: "Risk, Ethics & Governance Readiness"
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
    max: 25,
    label: "AI Unaware",
    description:
      "[Organisation Name]'s current AI readiness score indicates that the organisation faces significant competitive and operational exposure from its current AI capability position. The gaps identified across all five dimensions suggest that AI adoption without structured capability development is likely to produce disappointing results - and that the cost of inaction is accumulating daily. The good news: organisations starting from this position that commit to structured development consistently achieve the most dramatic improvements in the shortest timeframe."
  },
  {
    min: 26,
    max: 50,
    label: "AI Exploring",
    description:
      "[Organisation Name] has foundational AI awareness and some promising early adoption but lacks the systematic capability infrastructure to extract consistent value from AI investment. The diagnostic has identified specific, addressable gaps that - if closed in the right sequence - will produce measurable competitive improvement within 60-90 days."
  },
  {
    min: 51,
    max: 75,
    label: "AI Developing",
    description:
      "[Organisation Name] has meaningful AI capability in specific areas and a leadership team that understands the strategic importance of AI readiness. The diagnostic has identified targeted gaps - primarily in governance, measurement, and systematic adoption - that are preventing the organisation from realising the full value of its existing AI investment."
  },
  {
    min: 76,
    max: 100,
    label: "AI Proficient",
    description:
      "[Organisation Name] demonstrates strong AI readiness across most dimensions. The diagnostic has identified specific advanced capability gaps that - if addressed - will move the organisation from AI proficiency to AI leadership in its sector. At this level, the focus shifts from building foundational capability to building competitive differentiation through AI."
  }
];

export const DIMENSION_RECOMMENDATIONS: Record<DimensionKey, string> = {
  aiLiteracy:
    "Run role-based AI literacy development that helps staff understand tool use, output quality, and safe escalation or override decisions.",
  dataReadiness:
    "Strengthen data quality, governance, interoperability, and practical analytics capability before scaling AI deeper into operations.",
  aiStrategy:
    "Identify the highest-value processes for AI integration, formalise workflow redesign, and measure outcomes from each deployment.",
  workflowAdoption:
    "Anchor AI adoption in leadership behaviour, documented strategy, budget commitment, and a clear competitive capability roadmap.",
  ethicsCompliance:
    "Operationalise responsible AI controls with documented risk review paths, bias and incident checks, staff training, and stakeholder-ready transparency."
};
