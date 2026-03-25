import { Router } from "express";

import { requireAdmin } from "../middleware/adminAuth.js";
import { getOrganisationStatusById, markOrganisationApproved, markOrganisationSent } from "../services/organisationService.js";
import { sendOrganisationReportEmail } from "../services/emailService.js";
import { parseSendReportBody } from "../services/payloadValidators.js";
import { validateCompanyEmail } from "../services/emailValidationService.js";
import { generateOrganisationReportPdf } from "../services/reportService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { assertValidObjectId } from "../utils/objectId.js";

const reportRouter = Router();

reportRouter.use(requireAdmin);

reportRouter.post(
  "/generate/:orgId",
  asyncHandler(async (req, res) => {
    const orgId = assertValidObjectId(req.params.orgId, "organisation id");
    const { filename, buffer } = await generateOrganisationReportPdf(orgId);

    await markOrganisationApproved(orgId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.send(buffer);
  })
);

reportRouter.post(
  "/send/:orgId",
  asyncHandler(async (req, res) => {
    const orgId = assertValidObjectId(req.params.orgId, "organisation id");
    const body = parseSendReportBody(req.body);
    const organisation = await getOrganisationStatusById(orgId);

    const resolvedDirectorEmail = body.directorEmail || organisation.directorEmail;

    if (!resolvedDirectorEmail) {
      throw new HttpError(
        400,
        "A directorEmail must be configured before sending the report."
      );
    }

    const emailValidation = validateCompanyEmail(resolvedDirectorEmail);

    if (!emailValidation.valid || !emailValidation.normalizedEmail) {
      throw new HttpError(
        400,
        emailValidation.reason || "directorEmail must be a valid email address."
      );
    }

    const { filename, buffer, reportData } = await generateOrganisationReportPdf(orgId);
    const delivery = await sendOrganisationReportEmail({
      directorEmail: emailValidation.normalizedEmail,
      filename,
      pdfBuffer: buffer,
      reportData
    });

    await markOrganisationSent(orgId, emailValidation.normalizedEmail);

    res.json({
      message: "Report processed for delivery.",
      deliveryMode: delivery.mode,
      messageId: delivery.messageId,
      directorEmail: emailValidation.normalizedEmail,
      organisationId: orgId
    });
  })
);

export { reportRouter };
