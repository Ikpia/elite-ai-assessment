import { NextResponse } from "next/server";

import { SubmissionModel } from "@/lib/server/models/submission";
import {
  ensureOrganisationExists,
  refreshOrganisationAggregation
} from "@/lib/server/services/organisationService";
import { parseSubmissionPayload } from "@/lib/server/services/payloadValidators";
import { scoreAssessment } from "@/lib/server/services/scoringService";
import {
  extractEmailDomain,
  validateCompanyEmail
} from "@/lib/server/services/emailValidationService";
import { HttpError } from "@/lib/server/utils/httpError";
import {
  buildOrganisationKey,
  normalizeOrganisationName
} from "@/lib/server/utils/organisationIdentity";
import {
  ensureServerInitialized,
  handleRouteError
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureServerInitialized();

    const body = await request.json();
    const payload = parseSubmissionPayload(body);
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
      respondentDept: payload.respondentDept,
      consentAcceptedAt: new Date(),
      answers: scoredAssessment.answers,
      dimensionScores: scoredAssessment.dimensionScores,
      totalScore: scoredAssessment.totalScore,
      submittedAt: new Date()
    });

    const organisation = await refreshOrganisationAggregation(organisationKey);

    return NextResponse.json(
      {
        message: "Assessment submitted successfully.",
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
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
