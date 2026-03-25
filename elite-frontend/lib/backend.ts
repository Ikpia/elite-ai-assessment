import { apiBlobRequest, apiRequest, getAdminHeaders } from './api';
import type {
  AssessmentSubmissionPayload,
  Organisation,
  OrganisationStatusResponse,
  ValidateEmailResponse
} from '../types';

export const BACKEND_ENDPOINTS = {
  health: {
    check: '/api/health'
  },
  assessment: {
    validateEmail: '/api/assessment/validate-email',
    submit: '/api/assessment/submit',
    status: (organisationId: string) => `/api/assessment/status/${organisationId}`
  },
  admin: {
    organisations: {
      list: '/api/admin/organisations',
      update: (organisationId: string) => `/api/admin/organisations/${organisationId}`
    }
  },
  report: {
    generate: (organisationId: string) => `/api/report/generate/${organisationId}`,
    send: (organisationId: string) => `/api/report/send/${organisationId}`
  }
} as const;

export interface HealthResponse {
  status: 'ok';
  service: string;
  environment: string;
}

export interface AssessmentSubmitResponse {
  message: string;
  submissionId: string;
  organisationId: string;
  organisationKey: string;
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
    status: Organisation['status'];
    submissionCount: number;
    expectedRespondents: number | null;
    aggregatedScores: Organisation['aggregatedScores'];
  };
}

export interface OrganisationsListResponse {
  organisations: Organisation[];
}

export interface UpdateOrganisationPayload {
  orgName?: string;
  directorEmail?: string;
  expectedRespondents?: number | null;
}

export interface UpdateOrganisationResponse {
  message: string;
  organisation: Organisation;
}

export interface SendReportPayload {
  directorEmail?: string;
}

export interface SendReportResponse {
  message: string;
  deliveryMode: 'mock' | 'live';
  messageId: string | null;
  directorEmail: string;
  organisationId: string;
}

function withAdminHeaders(secret: string): HeadersInit {
  return {
    ...getAdminHeaders(secret)
  };
}

export const backendApi = {
  health: {
    check: () => apiRequest<HealthResponse>(BACKEND_ENDPOINTS.health.check)
  },
  assessment: {
    validateEmail: (email: string) =>
      apiRequest<ValidateEmailResponse>(BACKEND_ENDPOINTS.assessment.validateEmail, {
        method: 'POST',
        body: JSON.stringify({ email })
      }),
    submit: (payload: AssessmentSubmissionPayload) =>
      apiRequest<AssessmentSubmitResponse>(BACKEND_ENDPOINTS.assessment.submit, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    status: (organisationId: string) =>
      apiRequest<OrganisationStatusResponse>(BACKEND_ENDPOINTS.assessment.status(organisationId))
  },
  admin: {
    organisations: {
      list: (secret: string) =>
        apiRequest<OrganisationsListResponse>(BACKEND_ENDPOINTS.admin.organisations.list, {
          headers: withAdminHeaders(secret)
        }),
      update: (secret: string, organisationId: string, payload: UpdateOrganisationPayload) =>
        apiRequest<UpdateOrganisationResponse>(BACKEND_ENDPOINTS.admin.organisations.update(organisationId), {
          method: 'PATCH',
          headers: withAdminHeaders(secret),
          body: JSON.stringify(payload)
        })
    }
  },
  report: {
    generate: (secret: string, organisationId: string) =>
      apiBlobRequest(BACKEND_ENDPOINTS.report.generate(organisationId), {
        method: 'POST',
        headers: withAdminHeaders(secret)
      }),
    send: (secret: string, organisationId: string, payload?: SendReportPayload) =>
      apiRequest<SendReportResponse>(BACKEND_ENDPOINTS.report.send(organisationId), {
        method: 'POST',
        headers: withAdminHeaders(secret),
        body: JSON.stringify(payload || {})
      })
  }
};
