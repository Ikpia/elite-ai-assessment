import { Router } from "express";

import { SubmissionModel } from "../models/submission.js";
import {
  ensureOrganisationExists,
  getOrganisationStatusById,
  refreshOrganisationAggregation
} from "../services/organisationService.js";
import {
  parseSubmissionPayload,
  parseValidateEmailBody
} from "../services/payloadValidators.js";
import { scoreAssessment } from "../services/scoringService.js";
import {
  extractEmailDomain,
  validateCompanyEmail
} from "../services/emailValidationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { assertValidObjectId } from "../utils/objectId.js";
import {
  buildOrganisationKey,
  normalizeOrganisationName
} from "../utils/organisationIdentity.js";

const assessmentRouter = Router();

assessmentRouter.post(
  "/validate-email",
  asyncHandler(async (req, res) => {
    const { email } = parseValidateEmailBody(req.body);
    const validation = validateCompanyEmail(email);

    res.json(validation);
  })
);

assessmentRouter.post(
  "/submit",
  asyncHandler(async (req, res) => {
    const payload = parseSubmissionPayload(req.body);
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

    await ensureOrganisationExists(organisationKey, normalizedOrgName);

    const submission = await SubmissionModel.create({
      orgDomain: organisationKey,
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

    res.status(201).json({
      message: "Assessment submitted successfully.",
      submissionId: submission.id,
      organisationId: organisation.organisationId,
      organisationKey: organisation.organisationKey,
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
    });
  })
);

assessmentRouter.get(
  "/status/:orgId",
  asyncHandler(async (req, res) => {
    const orgId = assertValidObjectId(req.params.orgId, "organisation id");
    const organisation = await getOrganisationStatusById(orgId);

    res.json(organisation);
  })
);

export { assessmentRouter };
