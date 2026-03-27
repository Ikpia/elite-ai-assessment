import { OrganisationModel } from "../models/organisation";
import { SubmissionModel } from "../models/submission";

const RETENTION_DAYS = 90;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export async function purgeExpiredSubmissions(): Promise<{
  affectedOrganisations: number;
  deletedSubmissions: number;
}> {
  const retentionCutoff = new Date(Date.now() - RETENTION_DAYS * DAY_IN_MS);
  const expiredOrganisations = await OrganisationModel.find({
    reportSentAt: { $lte: retentionCutoff }
  }).select({ domain: 1 });

  const expiredDomains = expiredOrganisations.map((organisation) => organisation.domain);

  if (expiredDomains.length === 0) {
    return {
      affectedOrganisations: 0,
      deletedSubmissions: 0
    };
  }

  const deleteResult = await SubmissionModel.deleteMany({
    orgDomain: { $in: expiredDomains }
  });

  return {
    affectedOrganisations: expiredDomains.length,
    deletedSubmissions: deleteResult.deletedCount || 0
  };
}
