import { NextResponse } from "next/server";

import {
  getOrganisationStatusById,
  markOrganisationSent
} from "@/lib/server/services/organisationService";
import { sendOrganisationReportEmail } from "@/lib/server/services/emailService";
import { parseSendReportBody } from "@/lib/server/services/payloadValidators";
import { validateCompanyEmail } from "@/lib/server/services/emailValidationService";
import { generateOrganisationReportPdf } from "@/lib/server/services/reportService";
import { HttpError } from "@/lib/server/utils/httpError";
import { assertValidObjectId } from "@/lib/server/utils/objectId";
import {
  ensureServerInitialized,
  handleRouteError,
  requireAdmin
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    await ensureServerInitialized();

    const params = await context.params;
    const orgId = assertValidObjectId(params.orgId, "organisation id");
    await requireAdmin(request.headers, { organisationId: orgId });
    const body = await request.json();
    const parsedBody = parseSendReportBody(body);
    const organisation = await getOrganisationStatusById(orgId);

    const resolvedDirectorEmail = parsedBody.directorEmail || organisation.directorEmail;

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

    return NextResponse.json({
      message: "Report processed for delivery.",
      deliveryMode: delivery.mode,
      messageId: delivery.messageId,
      directorEmail: emailValidation.normalizedEmail,
      organisationId: orgId
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
