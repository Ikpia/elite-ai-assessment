import { OrganisationModel } from "../models/organisation";
import { SubmissionModel } from "../models/submission";

const DEFAULT_FIRM_TYPE = "financial-services";

export async function backfillFirmTypes(): Promise<{
  updatedOrganisations: number;
  updatedSubmissions: number;
}> {
  const [organisationResult, submissionResult] = await Promise.all([
    OrganisationModel.updateMany(
      {
        $or: [{ firmType: { $exists: false } }, { firmType: null }]
      },
      {
        $set: {
          firmType: DEFAULT_FIRM_TYPE
        }
      }
    ),
    SubmissionModel.updateMany(
      {
        $or: [{ firmType: { $exists: false } }, { firmType: null }]
      },
      {
        $set: {
          firmType: DEFAULT_FIRM_TYPE
        }
      }
    )
  ]);

  return {
    updatedOrganisations: organisationResult.modifiedCount,
    updatedSubmissions: submissionResult.modifiedCount
  };
}
