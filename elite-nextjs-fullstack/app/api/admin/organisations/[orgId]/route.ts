import { NextResponse } from "next/server";

import {
  deleteOrganisationAndSubmissions,
  updateOrganisationAdminSettings
} from "@/lib/server/services/organisationService";
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

    const params = await context.params;
    const orgId = assertValidObjectId(params.orgId, "organisation id");
    await requireAdmin(request.headers, { organisationId: orgId });
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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    await ensureServerInitialized();
    const access = await requireAdmin(request.headers);

    if (access.type !== "super-admin") {
      throw new HttpError(403, "Only Elite Global AI admins can delete firms.");
    }

    const params = await context.params;
    const orgId = assertValidObjectId(params.orgId, "organisation id");
    const deleted = await deleteOrganisationAndSubmissions(orgId);

    return NextResponse.json({
      message: `Deleted ${deleted.orgName} and its submissions.`,
      organisationId: deleted.organisationId
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
