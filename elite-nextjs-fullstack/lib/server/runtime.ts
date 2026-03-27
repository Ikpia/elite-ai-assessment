import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { env } from "@/lib/server/config/env";
import { connectToDatabase } from "@/lib/server/config/db";
import { HttpError } from "@/lib/server/utils/httpError";
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

export function requireAdmin(headers: Headers): void {
  const authorizationHeader = headers.get("authorization");
  const bearerSecret = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : null;
  const headerSecret = headers.get("x-admin-secret")?.trim() || null;
  const providedSecret = bearerSecret || headerSecret;

  if (!providedSecret || providedSecret !== env.adminSecret) {
    throw new HttpError(401, "Admin authentication failed.");
  }
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
