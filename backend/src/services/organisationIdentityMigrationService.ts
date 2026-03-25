import { OrganisationModel } from "../models/organisation.js";
import {
  SubmissionModel,
  type SubmissionDocument
} from "../models/submission.js";
import type { AnyBulkWriteOperation } from "mongoose";
import {
  buildOrganisationKey,
  normalizeOrganisationName
} from "../utils/organisationIdentity.js";

export async function syncOrganisationIdentityFromNames(): Promise<{
  updatedOrganisations: number;
  updatedSubmissions: number;
  skippedOrganisations: number;
}> {
  let updatedOrganisations = 0;
  let skippedOrganisations = 0;

  const submissions = await SubmissionModel.find(
    {},
    { _id: 1, orgDomain: 1, orgName: 1 }
  ).lean();

  const submissionOperations: AnyBulkWriteOperation<SubmissionDocument>[] = [];

  for (const submission of submissions) {
    const normalizedOrgName = normalizeOrganisationName(submission.orgName);
    const nextOrganisationKey = buildOrganisationKey(normalizedOrgName);

    if (
      submission.orgDomain === nextOrganisationKey &&
      submission.orgName === normalizedOrgName
    ) {
      continue;
    }

    submissionOperations.push({
      updateOne: {
        filter: { _id: submission._id },
        update: {
          $set: {
            orgDomain: nextOrganisationKey,
            orgName: normalizedOrgName
          }
        }
      }
    });
  }

  if (submissionOperations.length > 0) {
    await SubmissionModel.bulkWrite(submissionOperations);
  }

  const organisations = await OrganisationModel.find(
    {},
    { _id: 1, domain: 1, orgName: 1 }
  ).lean();

  for (const organisation of organisations) {
    const normalizedOrgName = normalizeOrganisationName(organisation.orgName);
    const nextOrganisationKey = buildOrganisationKey(normalizedOrgName);

    if (
      organisation.domain === nextOrganisationKey &&
      organisation.orgName === normalizedOrgName
    ) {
      continue;
    }

    const conflictingOrganisation = await OrganisationModel.findOne({
      domain: nextOrganisationKey,
      _id: { $ne: organisation._id }
    }).select({ _id: 1 });

    if (conflictingOrganisation) {
      skippedOrganisations += 1;
      console.warn(
        `Organisation identity migration skipped for "${organisation.orgName}" because key "${nextOrganisationKey}" already exists.`
      );
      continue;
    }

    await OrganisationModel.updateOne(
      { _id: organisation._id },
      {
        $set: {
          domain: nextOrganisationKey,
          orgName: normalizedOrgName
        }
      }
    );

    updatedOrganisations += 1;
  }

  return {
    updatedOrganisations,
    updatedSubmissions: submissionOperations.length,
    skippedOrganisations
  };
}
