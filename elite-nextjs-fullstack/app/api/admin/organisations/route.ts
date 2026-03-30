import { NextResponse } from "next/server";

import {
  createOrganisationAdminRecord,
  getOrganisationDashboardById,
  listOrganisationDashboards
} from "@/lib/server/services/organisationService";
import { parseOrganisationCreateBody } from "@/lib/server/services/payloadValidators";
import { validateCompanyEmail } from "@/lib/server/services/emailValidationService";
import { HttpError } from "@/lib/server/utils/httpError";
import {
  ensureServerInitialized,
  handleRouteError,
  requireAdmin
} from "@/lib/server/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureServerInitialized();
    const access = await requireAdmin(request.headers);
    const organisations =
      access.type === "super-admin"
        ? await listOrganisationDashboards()
        : [await getOrganisationDashboardById(access.organisationId)];

    return NextResponse.json({
      organisations,
      accessScope: access.type,
      organisationId: access.type === "organisation-admin" ? access.organisationId : null,
      directorEmail: access.type === "organisation-admin" ? access.directorEmail : null
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await ensureServerInitialized();
    const access = await requireAdmin(request.headers);

    if (access.type !== "super-admin") {
      throw new HttpError(403, "Only Elite Global AI admins can create firms.");
    }

    const body = await request.json();
    const payload = parseOrganisationCreateBody(body);
    const validation = validateCompanyEmail(payload.directorEmail);

    if (!validation.valid || !validation.normalizedEmail) {
      throw new HttpError(
        400,
        validation.reason || "directorEmail must be a valid email address."
      );
    }

    const organisation = await createOrganisationAdminRecord({
      ...payload,
      directorEmail: validation.normalizedEmail
    });

    return NextResponse.json(
      {
        message: "Firm admin onboarded successfully.",
        organisation
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
