import {
  apiBlobRequest,
  apiRequest,
  getAdminHeaders,
  type AdminAuthCredential
} from "@/lib/api";
import type {
  AssessmentCompleteResponse,
  AssessmentCompletionPayload,
  AssessmentInvitePrefillResponse,
  AssessmentSubmissionPayload,
  DirectorOnboardingPayload,
  DirectorOnboardingResponse,
  Organisation,
  OrganisationStatusResponse,
  PublicDashboardResponse,
  ResolvedOrganisationResponse,
  ValidateEmailResponse
} from "@/lib/shared/types";

export const BACKEND_ENDPOINTS = {
  health: {
    check: "/api/health"
  },
  assessment: {
    validateEmail: "/api/assessment/validate-email",
    resolveOrganisation: "/api/assessment/resolve-organisation",
    directorOnboard: "/api/assessment/director-onboard",
    invite: (inviteToken: string) => `/api/assessment/invite/${inviteToken}`,
    complete: "/api/assessment/complete",
    submit: "/api/assessment/submit",
    status: (organisationId: string) => `/api/assessment/status/${organisationId}`
  },
  admin: {
    access: {
      request: "/api/admin/access/request"
    },
    organisations: {
      list: "/api/admin/organisations",
      create: "/api/admin/organisations",
      update: (organisationId: string) => `/api/admin/organisations/${organisationId}`,
      delete: (organisationId: string) => `/api/admin/organisations/${organisationId}`
    }
  },
  public: {
    dashboard: "/api/public/dashboard"
  },
  report: {
    generate: (organisationId: string) => `/api/report/generate/${organisationId}`,
    send: (organisationId: string) => `/api/report/send/${organisationId}`
  }
} as const;

export interface HealthResponse {
  status: "ok";
  service: string;
  environment: string;
}

export interface AssessmentSubmitResponse {
  message: AssessmentCompleteResponse["message"];
  submissionId: AssessmentCompleteResponse["submissionId"];
  organisationId: AssessmentCompleteResponse["organisationId"];
  organisationKey: AssessmentCompleteResponse["organisationKey"];
  firmType: Organisation["firmType"];
  respondentScore: AssessmentCompleteResponse["respondentScore"];
  organisationStatus: AssessmentCompleteResponse["organisationStatus"];
  reportDelivery: AssessmentCompleteResponse["reportDelivery"];
}

export interface OrganisationsListResponse {
  organisations: Organisation[];
  accessScope: "super-admin" | "organisation-admin";
  organisationId: string | null;
  directorEmail: string | null;
}

export interface UpdateOrganisationPayload {
  orgName?: string;
  directorEmail?: string;
  expectedRespondents?: number | null;
}

export interface CreateOrganisationPayload {
  orgName: string;
  directorEmail: string;
  firmType: Organisation["firmType"];
  expectedRespondents?: number | null;
}

export interface UpdateOrganisationResponse {
  message: string;
  organisation: Organisation;
}

export interface CreateOrganisationResponse {
  message: string;
  organisation: Organisation;
}

export interface DeleteOrganisationResponse {
  message: string;
  organisationId: string;
}

export interface SendReportPayload {
  directorEmail?: string;
}

export interface SendReportResponse {
  message: string;
  deliveryMode: "mock" | "live";
  messageId: string | null;
  directorEmail: string;
  organisationId: string;
}

export interface AdminAccessRequestResponse {
  message: string;
  sessionToken: string;
  email: string;
  organisationId: string | null;
  accessScope: "super-admin" | "organisation-admin";
  expiresInHours: number;
}

function withAdminHeaders(auth: AdminAuthCredential): HeadersInit {
  return {
    ...getAdminHeaders(auth)
  };
}

export const backendApi = {
  health: {
    check: () => apiRequest<HealthResponse>(BACKEND_ENDPOINTS.health.check)
  },
  assessment: {
    validateEmail: (email: string) =>
      apiRequest<ValidateEmailResponse>(BACKEND_ENDPOINTS.assessment.validateEmail, {
        method: "POST",
        body: JSON.stringify({ email })
      }),
    resolveOrganisation: (orgName: string) =>
      apiRequest<ResolvedOrganisationResponse>(
        BACKEND_ENDPOINTS.assessment.resolveOrganisation,
        {
          method: "POST",
          body: JSON.stringify({ orgName })
        }
      ),
    directorOnboard: (payload: DirectorOnboardingPayload) =>
      apiRequest<DirectorOnboardingResponse>(BACKEND_ENDPOINTS.assessment.directorOnboard, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    invite: (inviteToken: string) =>
      apiRequest<AssessmentInvitePrefillResponse>(
        BACKEND_ENDPOINTS.assessment.invite(inviteToken)
      ),
    submit: (payload: AssessmentSubmissionPayload) =>
      apiRequest<AssessmentSubmitResponse>(BACKEND_ENDPOINTS.assessment.submit, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    complete: (payload: AssessmentCompletionPayload) =>
      apiRequest<AssessmentCompleteResponse>(BACKEND_ENDPOINTS.assessment.complete, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    status: (organisationId: string) =>
      apiRequest<OrganisationStatusResponse>(BACKEND_ENDPOINTS.assessment.status(organisationId))
  },
  admin: {
    access: {
      request: (email: string) =>
        apiRequest<AdminAccessRequestResponse>(BACKEND_ENDPOINTS.admin.access.request, {
          method: "POST",
          body: JSON.stringify({ email })
        })
    },
    organisations: {
      list: (auth: AdminAuthCredential) =>
        apiRequest<OrganisationsListResponse>(BACKEND_ENDPOINTS.admin.organisations.list, {
          headers: withAdminHeaders(auth)
        }),
      create: (auth: AdminAuthCredential, payload: CreateOrganisationPayload) =>
        apiRequest<CreateOrganisationResponse>(BACKEND_ENDPOINTS.admin.organisations.create, {
          method: "POST",
          headers: withAdminHeaders(auth),
          body: JSON.stringify(payload)
        }),
      update: (auth: AdminAuthCredential, organisationId: string, payload: UpdateOrganisationPayload) =>
        apiRequest<UpdateOrganisationResponse>(BACKEND_ENDPOINTS.admin.organisations.update(organisationId), {
          method: "PATCH",
          headers: withAdminHeaders(auth),
          body: JSON.stringify(payload)
        }),
      delete: (auth: AdminAuthCredential, organisationId: string) =>
        apiRequest<DeleteOrganisationResponse>(BACKEND_ENDPOINTS.admin.organisations.delete(organisationId), {
          method: "DELETE",
          headers: withAdminHeaders(auth)
        })
    }
  },
  public: {
    dashboard: () =>
      apiRequest<PublicDashboardResponse>(BACKEND_ENDPOINTS.public.dashboard)
  },
  report: {
    generate: (auth: AdminAuthCredential, organisationId: string) =>
      apiBlobRequest(BACKEND_ENDPOINTS.report.generate(organisationId), {
        method: "POST",
        headers: withAdminHeaders(auth)
      }),
    send: (auth: AdminAuthCredential, organisationId: string, payload?: SendReportPayload) =>
      apiRequest<SendReportResponse>(BACKEND_ENDPOINTS.report.send(organisationId), {
        method: "POST",
        headers: withAdminHeaders(auth),
        body: JSON.stringify(payload || {})
      })
  }
};
