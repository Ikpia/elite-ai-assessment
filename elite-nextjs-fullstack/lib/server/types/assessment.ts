export type RoleLevel = "c-suite" | "manager" | "ic";
export type FirmType =
  | "financial-services"
  | "healthcare"
  | "consulting-firms"
  | "smes";

export type OrganisationStatus = "collecting" | "ready" | "approved" | "sent";

export type DimensionKey =
  | "aiLiteracy"
  | "dataReadiness"
  | "aiStrategy"
  | "workflowAdoption"
  | "ethicsCompliance";

export type SingleChoiceOption = "A" | "B" | "C" | "D";

export type MultiSelectToolOption =
  | "option-1"
  | "option-2"
  | "option-3"
  | "option-4"
  | "option-5"
  | "option-6"
  | "option-7"
  | "option-8"
  | "generative-ai-document-drafting"
  | "ai-assisted-data-analysis"
  | "automated-customer-communication"
  | "compliance-monitoring"
  | "ml-credit-scoring"
  | "llm-regulatory-analysis"
  | "none-of-the-above";

export type ReadinessLevel =
  | "AI Unaware"
  | "AI Exploring"
  | "AI Developing"
  | "AI Proficient";

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
  value: string | string[];
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
  firmType: FirmType;
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

export interface ReportRespondentScore {
  respondentName: string;
  respondentRole: RoleLevel;
  respondentDept: string;
  totalScore: number;
  readinessLevel: ReadinessLevel;
}

export interface ReportData {
  organisationId: string;
  orgName: string;
  organisationKey: string;
  firmType: FirmType;
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
  respondents: ReportRespondentScore[];
}

export interface OrganisationDashboardItem {
  id: string;
  organisationKey: string;
  firmType: FirmType;
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
