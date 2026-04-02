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

export interface SubmissionAnswer {
  questionId: number;
  value: string | string[];
}

export interface SubmissionDraft {
  firmType: FirmType | "";
  orgName: string;
  email: string;
  name: string;
  role: RoleLevel | "";
  dept: string;
  phone: string;
  consentAccepted: boolean;
}

export interface AssessmentSubmissionPayload {
  firmType: FirmType;
  orgName: string;
  respondentEmail: string;
  respondentName: string;
  respondentRole: RoleLevel;
  respondentDept?: string | null;
  respondentPhone?: string | null;
  attributionSource?: string | null;
  consentAccepted: true;
  answers: SubmissionAnswer[];
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
  consentAccepted: true;
  answers: SubmissionAnswer[];
}

export interface DirectorOnboardingPayload {
  firmType: FirmType;
  orgName: string;
  directorEmail: string;
  directorName: string;
  directorDept: string;
  consentAccepted: true;
}

export interface ValidateEmailResponse {
  valid: boolean;
  blocked: boolean;
  normalizedEmail: string | null;
  domain: string | null;
  reason: string | null;
}

export interface DirectorOnboardingResponse {
  message: string;
  organisationId: string;
  organisationKey: string;
  firmType: FirmType;
  orgName: string;
  shareUrl: string;
  deliveryMode: "mock" | "live";
  messageId: string | null;
}

export interface AssessmentInvitePrefillResponse {
  organisationId: string;
  organisationKey: string;
  firmType: FirmType;
  orgName: string;
}

export interface ResolvedOrganisationResponse {
  organisationId: string;
  organisationKey: string;
  firmType: FirmType;
  orgName: string;
}

export interface AggregateScores {
  aiLiteracy: number;
  dataReadiness: number;
  aiStrategy: number;
  workflowAdoption: number;
  ethicsCompliance: number;
  total: number;
}

export interface Organisation {
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

export interface OrganisationStatusResponse {
  organisationId: string;
  organisationKey: string;
  firmType: FirmType;
  orgName: string;
  directorEmail: string | null;
  expectedRespondents: number | null;
  status: OrganisationStatus;
  aggregatedScores: AggregateScores;
  submissionCount: number;
  reportSentAt: string | null;
}

export interface PublicDashboardOrganisation {
  id: string;
  orgName: string;
  firmType: FirmType;
  submissionCount: number;
  averageScore: number;
  createdAt: string;
}

export interface PublicDashboardSector {
  firmType: FirmType;
  organisationCount: number;
  totalSubmissions: number;
  averageScore: number;
}

export interface PublicDashboardSummary {
  participatingFirms: number;
  totalSubmissions: number;
  averageScore: number;
  highestAverageScore: number | null;
}

export interface PublicDashboardBenchmarks {
  localScore: number;
  globalScore: number;
}

export interface PublicDashboardResponse {
  summary: PublicDashboardSummary;
  benchmarks: PublicDashboardBenchmarks;
  sectors: PublicDashboardSector[];
  organisations: PublicDashboardOrganisation[];
  generatedAt: string;
}

export interface AssessmentCompleteResponse {
  message: string;
  submissionId: string;
  organisationId: string;
  organisationKey: string;
  firmType: FirmType;
  respondentScore: {
    totalScore: number;
    dimensionScores: {
      aiLiteracy: number;
      dataReadiness: number;
      aiStrategy: number;
      workflowAdoption: number;
      ethicsCompliance: number;
    };
    readinessLevel: string;
  };
  organisationStatus: {
    status: OrganisationStatus;
    submissionCount: number;
    expectedRespondents: number | null;
    aggregatedScores: AggregateScores;
  };
  reportDelivery: {
    recipientEmail: string;
    deliveryMode: "mock" | "live";
    messageId: string | null;
    viewUrl: string;
    generatedAt: string;
  };
}

export interface QuestionOption {
  label: string;
  score: number;
  value: string;
}

export interface Question {
  id: number;
  dimension: string;
  text: string;
  options: QuestionOption[];
  multiSelect?: boolean;
}
