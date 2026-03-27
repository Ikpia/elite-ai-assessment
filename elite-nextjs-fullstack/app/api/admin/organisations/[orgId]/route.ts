import { NextResponse } from "next/server";

import { updateOrganisationAdminSettings } from "@/lib/server/services/organisationService";
import { parseOrganisationUpdateBody } from "@/lib/server/services/payloadValidators";
import { validateCompanyEmail } from "@/lib/server/services/emailValidationService";
import { HttpError } from "@/lib/server/utils/httpError";
import { assertValidObjectId } from "@/lib/server/utils/objectId";
import {
  ensureServerInitialized,
  handleRouteError,
  requireAdmin
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    await ensureServerInitialized();
    requireAdmin(request.headers);

    const params = await context.params;
    const orgId = assertValidObjectId(params.orgId, "organisation id");
    const body = await request.json();
    const updates = parseOrganisationUpdateBody(body);

    if (updates.directorEmail) {
      const validation = validateCompanyEmail(updates.directorEmail);

      if (!validation.valid) {
        throw new HttpError(
          400,
          validation.reason || "directorEmail must be a valid email address."
        );
      }

      updates.directorEmail = validation.normalizedEmail || updates.directorEmail;
    }

    const organisation = await updateOrganisationAdminSettings(orgId, updates);

    return NextResponse.json({
      message: "Organisation settings updated.",
      organisation
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
