export type RoleLevel = "c-suite" | "manager" | "ic";

export type OrganisationStatus = "collecting" | "ready" | "approved" | "sent";

export type DimensionKey =
  | "aiLiteracy"
  | "dataReadiness"
  | "aiStrategy"
  | "workflowAdoption"
  | "ethicsCompliance";

export type SingleChoiceOption = "A" | "B" | "C" | "D";

export type MultiSelectToolOption =
  | "generative-ai-document-drafting"
  | "ai-assisted-data-analysis"
  | "automated-customer-communication"
  | "compliance-monitoring"
  | "ml-credit-scoring"
  | "llm-regulatory-analysis"
  | "none-of-the-above";

export type ReadinessLevel =
  | "Low"
  | "Developing"
  | "Moderate"
  | "Advanced"
  | "Leading";

export interface DimensionScores {
  aiLiteracy: number;
  dataReadiness: number;
  aiStrategy: number;
  workflowAdoption: number;
  ethicsCompliance: number;
}

export interface AggregateScores extends DimensionScores {
  total: number;
}

export interface AssessmentAnswerInput {
  questionId: number;
  value: SingleChoiceOption | MultiSelectToolOption[];
}

export interface ScoredAnswerRecord {
  questionId: number;
  score: number;
  selectedOption?: SingleChoiceOption;
  selectedOptions?: MultiSelectToolOption[];
}

export interface ScoredAssessment {
  answers: ScoredAnswerRecord[];
  dimensionScores: DimensionScores;
  totalScore: number;
  readinessLevel: ReadinessLevel;
}

export interface SubmissionPayload {
  orgName: string;
  respondentEmail: string;
  respondentName: string;
  respondentRole: RoleLevel;
  respondentDept: string;
  consentAccepted: boolean;
  answers: AssessmentAnswerInput[];
}

export interface ReadinessBand {
  min: number;
  max: number;
  label: ReadinessLevel;
  description: string;
}

export interface DimensionInsight {
  key: DimensionKey;
  label: string;
  score: number;
  recommendation: string;
}

export interface ReportData {
  organisationId: string;
  orgName: string;
  organisationKey: string;
  directorEmail: string | null;
  status: OrganisationStatus;
  submittedRespondents: number;
  expectedRespondents: number | null;
  generatedAt: string;
  aggregatedScores: AggregateScores;
  readinessLevel: ReadinessLevel;
  readinessDescription: string;
  benchmarkLocal: number;
  benchmarkGlobal: number;
  benchmarkGapLocal: number;
  benchmarkGapGlobal: number;
  strongestDimension: DimensionInsight;
  weakestDimensions: DimensionInsight[];
}

export interface OrganisationDashboardItem {
  id: string;
  organisationKey: string;
  orgName: string;
  directorEmail: string | null;
  expectedRespondents: number | null;
  submissionCount: number;
  status: OrganisationStatus;
  aggregatedScores: AggregateScores;
  reportSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}
