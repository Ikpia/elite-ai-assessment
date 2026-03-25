export type RoleLevel = "c-suite" | "manager" | "ic";

export type OrganisationStatus = "collecting" | "ready" | "approved" | "sent";

export interface SubmissionAnswer {
  questionId: number;
  value: string | string[];
}

export interface SubmissionDraft {
  orgName: string;
  email: string;
  name: string;
  role: RoleLevel | "";
  dept: string;
  consentAccepted: boolean;
}

export interface AssessmentSubmissionPayload {
  orgName: string;
  respondentEmail: string;
  respondentName: string;
  respondentRole: RoleLevel;
  respondentDept: string;
  consentAccepted: true;
  answers: SubmissionAnswer[];
}

export interface ValidateEmailResponse {
  valid: boolean;
  blocked: boolean;
  normalizedEmail: string | null;
  domain: string | null;
  reason: string | null;
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

export interface OrganisationsResponse {
  organisations: Organisation[];
}

export interface OrganisationStatusResponse {
  organisationId: string;
  organisationKey: string;
  orgName: string;
  directorEmail: string | null;
  expectedRespondents: number | null;
  status: OrganisationStatus;
  aggregatedScores: AggregateScores;
  submissionCount: number;
  reportSentAt: string | null;
}
