import { NextResponse } from "next/server";

import { parseDirectorOnboardingBody } from "@/lib/server/services/payloadValidators";
import { validateCompanyEmail } from "@/lib/server/services/emailValidationService";
import { sendDirectorInviteEmail } from "@/lib/server/services/emailService";
import { registerDirectorAdminForOrganisation } from "@/lib/server/services/organisationService";
import { createAssessmentInviteToken } from "@/lib/server/utils/assessmentInvite";
import {
  ensureServerInitialized,
  handleRouteError
} from "@/lib/server/runtime";
import { HttpError } from "@/lib/server/utils/httpError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureServerInitialized();

    const body = await request.json();
    const payload = parseDirectorOnboardingBody(body);
    const emailValidation = validateCompanyEmail(payload.directorEmail);

    if (!emailValidation.valid || !emailValidation.normalizedEmail) {
      throw new HttpError(
        400,
        emailValidation.reason || "A valid email address is required."
      );
    }

    const organisation = await registerDirectorAdminForOrganisation({
      orgName: payload.orgName,
      directorEmail: emailValidation.normalizedEmail,
      firmType: payload.firmType
    });

    const inviteToken = createAssessmentInviteToken(organisation.organisationId);
    const shareUrl = new URL("/start", request.url);
    shareUrl.searchParams.set("invite", inviteToken);

    const delivery = await sendDirectorInviteEmail({
      directorEmail: emailValidation.normalizedEmail,
      directorName: payload.directorName,
      orgName: organisation.orgName,
      shareUrl: shareUrl.toString()
    });

    return NextResponse.json(
      {
        message: "Director onboarding completed successfully.",
        organisationId: organisation.organisationId,
        organisationKey: organisation.organisationKey,
        firmType: organisation.firmType,
        orgName: organisation.orgName,
        shareUrl: shareUrl.toString(),
        deliveryMode: delivery.mode,
        messageId: delivery.messageId
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
