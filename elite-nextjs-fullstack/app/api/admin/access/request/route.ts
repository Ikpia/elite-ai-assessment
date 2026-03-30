import { NextResponse } from "next/server";

import { validateCompanyEmail } from "@/lib/server/services/emailValidationService";
import { resolveAdminAccessTargetByEmail } from "@/lib/server/services/organisationService";
import { parseAdminAccessRequestBody } from "@/lib/server/services/payloadValidators";
import {
  createOrganisationAdminSessionToken,
  createSuperAdminSessionToken,
  getAdminSessionTtlMs
} from "@/lib/server/utils/adminAccess";
import { ensureServerInitialized, handleRouteError } from "@/lib/server/runtime";
import { HttpError } from "@/lib/server/utils/httpError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureServerInitialized();

    const body = await request.json();
    const { email } = parseAdminAccessRequestBody(body);
    const validation = validateCompanyEmail(email);

    if (!validation.valid || !validation.normalizedEmail) {
      throw new HttpError(
        400,
        validation.reason || "Please use a valid organisation email."
      );
    }

    const accessTarget = await resolveAdminAccessTargetByEmail(validation.normalizedEmail);
    const expiresInMs = getAdminSessionTtlMs();
    const expiresInHours = Math.max(1, Math.round(expiresInMs / (60 * 60 * 1000)));
    const token =
      accessTarget.type === "super-admin"
        ? createSuperAdminSessionToken({
            email: accessTarget.email,
            expiresInMs
          })
        : createOrganisationAdminSessionToken({
            organisationId: accessTarget.organisationId,
            directorEmail: accessTarget.directorEmail,
            expiresInMs
          });
    return NextResponse.json({
      message: "Admin access granted.",
      sessionToken: token,
      email:
        accessTarget.type === "super-admin"
          ? accessTarget.email
          : accessTarget.directorEmail,
      organisationId:
        accessTarget.type === "super-admin" ? null : accessTarget.organisationId,
      accessScope: accessTarget.type,
      expiresInHours
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
