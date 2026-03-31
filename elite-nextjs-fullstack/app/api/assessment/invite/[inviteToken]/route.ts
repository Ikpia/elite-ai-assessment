import { NextResponse } from "next/server";

import { getAssessmentInvitePrefillByOrganisationId } from "@/lib/server/services/organisationService";
import { verifyAssessmentInviteToken } from "@/lib/server/utils/assessmentInvite";
import {
  ensureServerInitialized,
  handleRouteError
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ inviteToken: string }> }
) {
  try {
    await ensureServerInitialized();
    const params = await context.params;
    const inviteToken = params.inviteToken;
    const payload = verifyAssessmentInviteToken(inviteToken);
    const organisation = await getAssessmentInvitePrefillByOrganisationId(
      payload.organisationId
    );

    return NextResponse.json(organisation);
  } catch (error) {
    return handleRouteError(error);
  }
}
