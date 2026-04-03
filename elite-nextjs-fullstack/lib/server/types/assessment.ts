export type RoleLevel =
  | "director"
  | "c-suite"
  | "senior-manager"
  | "manager"
  | "specialist"
  | "ic";
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
  respondentDept?: string | null;
  respondentPhone?: string | null;
  attributionSource?: string | null;
  consentAccepted: boolean;
  answers: AssessmentAnswerInput[];
}

export interface AssessmentCompletionPayload {
  firmType: FirmType;
  orgName: string;
  respondentEmail: string;
  respondentName: string;
  respondentRole: RoleLevel;
  respondentDept?: string | null;
  respondentPhone?: string | null;
  attributionSource?: string | null;
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

export interface ReportQuestionAnalysis {
  questionId: number;
  label: string;
  averageScore: number;
  maxScore: number;
  observedAnswerLabel: string | null;
  finding: string;
}

export interface ReportDimensionSection {
  key: DimensionKey;
  label: string;
  score: number;
  benchmarkScore: number;
  comparison: "above" | "at" | "below";
  findings: ReportQuestionAnalysis[];
}

export interface ReportPriorityGap {
  questionId: number;
  label: string;
  averageScore: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  description: string;
  businessImpact: string;
  requirement: string;
}

export interface ReportDistributionBand {
  label: string;
  min: number;
  max: number;
  percentage: number;
  count: number;
  containsOrganisation: boolean;
}

export interface ReportSectorBenchmark {
  industryLabel: string;
  industryPlural: string;
  peerGroupLabel: string;
  localAverageLabel: string;
  localAverageScore: number;
  globalAverageLabel: string;
  globalAverageScore: number;
  globalGap: number;
  percentile: number;
  percentileLabel: string;
  peerOrganisationCount: number;
  dimensionBenchmarkScores: DimensionScores;
  distributionBands: ReportDistributionBand[];
  benchmarkNarrative: string;
}

export interface ReportNextSteps {
  briefingTitle: string;
  briefingDescription: string;
  briefingUrl: string;
  programmeTitle: string;
  programmeDescription: string;
  measurementTitle: string;
  measurementDescription: string;
}

export interface ReportContactDetails {
  name: string;
  role: string;
  email: string;
  phone: string;
  linkedin: string;
  website: string;
}

export interface ReportRespondentScore {
  respondentName: string;
  respondentRole: RoleLevel;
  respondentDept: string | null;
  totalScore: number;
  readinessLevel: ReadinessLevel;
}

export interface RespondentReportData {
  submissionId: string;
  organisationId: string;
  organisationKey: string;
  orgName: string;
  firmType: FirmType;
  respondentEmail: string;
  respondentName: string;
  respondentRole: RoleLevel;
  respondentDept: string | null;
  submittedAt: string;
  generatedAt: string;
  totalScore: number;
  readinessLevel: ReadinessLevel;
  readinessDescription: string;
  personalSummary: string;
  dimensionScores: DimensionScores;
  dimensionInsights: DimensionInsight[];
  strongestDimension: DimensionInsight;
  weakestDimension: DimensionInsight;
  contact: ReportContactDetails;
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
  executiveSummary: string;
  benchmarkLocal: number;
  benchmarkGlobal: number;
  benchmarkGapLocal: number;
  benchmarkGapGlobal: number;
  strongestDimension: DimensionInsight;
  weakestDimensions: DimensionInsight[];
  dimensionSections: ReportDimensionSection[];
  priorityGaps: ReportPriorityGap[];
  sectorBenchmark: ReportSectorBenchmark;
  nextSteps: ReportNextSteps;
  contact: ReportContactDetails;
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
