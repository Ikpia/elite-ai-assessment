import type { AssessmentCompleteResponse } from "@/lib/shared/types";

import { SubmissionModel } from "../models/submission";
import { createReportAccessToken } from "../utils/reportAccess";
import { HttpError } from "../utils/httpError";
import {
  buildOrganisationKey,
  normalizeOrganisationName
} from "../utils/organisationIdentity";
import type { SubmissionPayload } from "../types/assessment";
import {
  extractEmailDomain,
  validateCompanyEmail
} from "./emailValidationService";
import { sendRespondentReportEmail } from "./emailService";
import {
  ensureOrganisationExists,
  refreshOrganisationAggregation
} from "./organisationService";
import { generateRespondentReportPdf } from "./reportService";
import { scoreAssessment } from "./scoringService";

export async function submitAssessmentAndGenerateImmediateReport(params: {
  payload: SubmissionPayload;
  requestUrl: string;
}): Promise<AssessmentCompleteResponse> {
  const { payload, requestUrl } = params;
  const emailValidation = validateCompanyEmail(payload.respondentEmail);

  if (!emailValidation.valid || !emailValidation.normalizedEmail) {
    throw new HttpError(
      400,
      emailValidation.reason || "A valid email address is required."
    );
  }

  const scoredAssessment = scoreAssessment(payload.answers);
  const normalizedOrgName = normalizeOrganisationName(payload.orgName);
  const organisationKey = buildOrganisationKey(normalizedOrgName);
  const respondentEmailDomain = extractEmailDomain(emailValidation.normalizedEmail);

  await ensureOrganisationExists(
    organisationKey,
    normalizedOrgName,
    payload.firmType
  );

  const submission = await SubmissionModel.create({
    orgDomain: organisationKey,
    firmType: payload.firmType,
    orgName: normalizedOrgName,
    respondentEmailDomain,
    respondentEmail: emailValidation.normalizedEmail,
    respondentName: payload.respondentName,
    respondentRole: payload.respondentRole,
    respondentDept: payload.respondentDept || null,
    respondentPhone: payload.respondentPhone || null,
    attributionSource: payload.attributionSource || null,
    consentAcceptedAt: new Date(),
    answers: scoredAssessment.answers,
    dimensionScores: scoredAssessment.dimensionScores,
    totalScore: scoredAssessment.totalScore,
    submittedAt: new Date()
  });

  const organisation = await refreshOrganisationAggregation(organisationKey);
  const reportAccessToken = createReportAccessToken({
    organisationId: organisation.organisationId,
    recipientEmail: emailValidation.normalizedEmail,
    submissionId: submission.id
  });
  const reportViewUrl = new URL(
    `/api/report/respondent/${reportAccessToken}`,
    requestUrl
  ).toString();
  const { filename, buffer, reportData } = await generateRespondentReportPdf({
    organisationId: organisation.organisationId,
    recipientEmail: emailValidation.normalizedEmail,
    submissionId: submission.id
  });
  const delivery = await sendRespondentReportEmail({
    respondentEmail: emailValidation.normalizedEmail,
    filename,
    pdfBuffer: buffer,
    reportData,
    viewUrl: reportViewUrl
  });

  return {
    message: "Assessment completed and report generated successfully.",
    submissionId: submission.id,
    organisationId: organisation.organisationId,
    organisationKey: organisation.organisationKey,
    firmType: organisation.firmType,
    respondentScore: {
      totalScore: scoredAssessment.totalScore,
      dimensionScores: scoredAssessment.dimensionScores,
      readinessLevel: scoredAssessment.readinessLevel
    },
    organisationStatus: {
      status: organisation.status,
      submissionCount: organisation.submissionCount,
      expectedRespondents: organisation.expectedRespondents,
      aggregatedScores: organisation.aggregatedScores
    },
    reportDelivery: {
      recipientEmail: emailValidation.normalizedEmail,
      deliveryMode: delivery.mode,
      messageId: delivery.messageId,
      viewUrl: reportViewUrl,
      generatedAt: reportData.generatedAt
    }
  };
}