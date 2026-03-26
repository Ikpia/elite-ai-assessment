import { app } from "./app.js";
import { connectToDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { backfillFirmTypes } from "./services/firmTypeMigrationService.js";
import { syncOrganisationIdentityFromNames } from "./services/organisationIdentityMigrationService.js";
import { purgeExpiredSubmissions, startRetentionSweeper } from "./services/retentionService.js";

async function bootstrap(): Promise<void> {
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

  await purgeExpiredSubmissions();
  startRetentionSweeper();

  app.listen(env.port, () => {
    console.log(
      `Elite Global AI backend listening on port ${env.port} in ${env.nodeEnv} mode.`
    );
  });
}

void bootstrap().catch((error: unknown) => {
  console.error("Failed to start server.", error);
  process.exit(1);
});
