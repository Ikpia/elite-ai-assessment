import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { env } from "@/lib/server/config/env";
import { connectToDatabase } from "@/lib/server/config/db";
import { OrganisationModel } from "@/lib/server/models/organisation";
import { HttpError } from "@/lib/server/utils/httpError";
import { verifyAdminSessionToken } from "@/lib/server/utils/adminAccess";
import { backfillFirmTypes } from "@/lib/server/services/firmTypeMigrationService";
import { syncOrganisationIdentityFromNames } from "@/lib/server/services/organisationIdentityMigrationService";

declare global {
  // eslint-disable-next-line no-var
  var __eliteNextServerInitializedPromise__: Promise<void> | undefined;
}

export async function ensureServerInitialized(): Promise<void> {
  if (!globalThis.__eliteNextServerInitializedPromise__) {
    globalThis.__eliteNextServerInitializedPromise__ = (async () => {
      await connectToDatabase();

      const firmTypeMigrationResult = await backfillFirmTypes();
      if (
        firmTypeMigrationResult.updatedOrganisations > 0 ||
        firmTypeMigrationResult.updatedSubmissions > 0
      ) {
        console.log(
          `Firm type backfill complete: ${firmTypeMigrationResult.updatedOrganisations} organisations updated, ${firmTypeMigrationResult.updatedSubmissions} submissions updated.`
        );
      }

      const migrationResult = await syncOrganisationIdentityFromNames();
      if (
        migrationResult.updatedOrganisations > 0 ||
        migrationResult.updatedSubmissions > 0 ||
        migrationResult.skippedOrganisations > 0
      ) {
        console.log(
          `Organisation identity sync complete: ${migrationResult.updatedOrganisations} organisations updated, ${migrationResult.updatedSubmissions} submissions updated, ${migrationResult.skippedOrganisations} organisations skipped.`
        );
      }

    })().catch((error) => {
      globalThis.__eliteNextServerInitializedPromise__ = undefined;
      throw error;
    });
  }

  return globalThis.__eliteNextServerInitializedPromise__;
}

export type AdminAccessContext =
  | { type: "super-admin" }
  | { type: "organisation-admin"; organisationId: string; directorEmail: string };

export async function requireAdmin(
  headers: Headers,
  options: { organisationId?: string } = {}
): Promise<AdminAccessContext> {
  const authorizationHeader = headers.get("authorization");
  const bearerSecret = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : null;
  const headerSecret = headers.get("x-admin-secret")?.trim() || null;
  const providedSecret = bearerSecret || headerSecret;

  if (!providedSecret || providedSecret !== env.adminSecret) {
    const sessionToken = headers.get("x-admin-session")?.trim() || null;

    if (!sessionToken) {
      throw new HttpError(401, "Admin authentication failed.");
    }

    const payload = verifyAdminSessionToken(sessionToken);

    if (payload.scope === "super-admin") {
      if (!env.superAdminEmails.includes(payload.email.toLowerCase())) {
        throw new HttpError(401, "Admin authentication failed.");
      }

      return { type: "super-admin" };
    }

    const organisation = await OrganisationModel.findById(payload.organisationId, {
      directorEmail: 1
    }).lean();

    if (!organisation || !organisation.directorEmail) {
      throw new HttpError(401, "Firm admin authentication failed.");
    }

    if (organisation.directorEmail.toLowerCase() !== payload.directorEmail.toLowerCase()) {
      throw new HttpError(401, "Firm admin authentication failed.");
    }

    if (options.organisationId && String(organisation._id) !== options.organisationId) {
      throw new HttpError(403, "You can only access your own organisation.");
    }

    return {
      type: "organisation-admin",
      organisationId: String(organisation._id),
      directorEmail: organisation.directorEmail
    };
  }

  return { type: "super-admin" };
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details ?? null
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof mongoose.Error) {
    return NextResponse.json(
      {
        error: "Database validation failed.",
        details: error.message
      },
      { status: 400 }
    );
  }

  const fallbackMessage =
    error instanceof Error ? error.message : "Unexpected server error.";

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
