import { OrganisationModel } from "../models/organisation.js";
import { SubmissionModel } from "../models/submission.js";
import { ZERO_AGGREGATE_SCORES } from "../constants/assessment.js";
import type {
  AggregateScores,
  OrganisationDashboardItem,
  OrganisationStatus
} from "../types/assessment.js";
import { HttpError } from "../utils/httpError.js";
import {
  buildOrganisationKey,
  normalizeOrganisationName
} from "../utils/organisationIdentity.js";
import { roundToOneDecimal } from "../utils/rounding.js";

interface AggregatePipelineResult {
  _id: string;
  submissionCount: number;
  aiLiteracy: number;
  dataReadiness: number;
  aiStrategy: number;
  workflowAdoption: number;
  ethicsCompliance: number;
  total: number;
}

function deriveStatus(
  currentStatus: OrganisationStatus,
  submissionCount: number,
  expectedRespondents: number | null | undefined
): OrganisationStatus {
  if (currentStatus === "sent") {
    return "sent";
  }

  if (currentStatus === "approved") {
    return "approved";
  }

  if (
    typeof expectedRespondents === "number" &&
    expectedRespondents > 0 &&
    submissionCount >= expectedRespondents
  ) {
    return "ready";
  }

  return "collecting";
}

function normalizeAggregate(
  aggregation: AggregatePipelineResult | null
): { submissionCount: number; aggregatedScores: AggregateScores } {
  if (!aggregation) {
    return {
      submissionCount: 0,
      aggregatedScores: { ...ZERO_AGGREGATE_SCORES }
    };
  }

  return {
    submissionCount: aggregation.submissionCount,
    aggregatedScores: {
      aiLiteracy: roundToOneDecimal(aggregation.aiLiteracy || 0),
      dataReadiness: roundToOneDecimal(aggregation.dataReadiness || 0),
      aiStrategy: roundToOneDecimal(aggregation.aiStrategy || 0),
      workflowAdoption: roundToOneDecimal(aggregation.workflowAdoption || 0),
      ethicsCompliance: roundToOneDecimal(aggregation.ethicsCompliance || 0),
      total: roundToOneDecimal(aggregation.total || 0)
    }
  };
}

async function aggregateForDomain(domain: string): Promise<{
  submissionCount: number;
  aggregatedScores: AggregateScores;
}> {
  const [aggregation] = await SubmissionModel.aggregate<AggregatePipelineResult>([
    {
      $match: { orgDomain: domain }
    },
    {
      $group: {
        _id: "$orgDomain",
        submissionCount: { $sum: 1 },
        aiLiteracy: { $avg: "$dimensionScores.aiLiteracy" },
        dataReadiness: { $avg: "$dimensionScores.dataReadiness" },
        aiStrategy: { $avg: "$dimensionScores.aiStrategy" },
        workflowAdoption: { $avg: "$dimensionScores.workflowAdoption" },
        ethicsCompliance: { $avg: "$dimensionScores.ethicsCompliance" },
        total: { $avg: "$totalScore" }
      }
    }
  ]);

  return normalizeAggregate(aggregation || null);
}

async function countSubmissionsByDomain(): Promise<Map<string, number>> {
  const results = await SubmissionModel.aggregate<{ _id: string; count: number }>([
    {
      $group: {
        _id: "$orgDomain",
        count: { $sum: 1 }
      }
    }
  ]);

  return new Map(results.map((result) => [result._id, result.count]));
}

function toDashboardItem(
  organisation: {
    _id: unknown;
    domain: string;
    orgName: string;
    directorEmail: string | null;
    expectedRespondents: number | null;
    status: OrganisationStatus;
    aggregatedScores: AggregateScores;
    reportSentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
  submissionCount: number
): OrganisationDashboardItem {
  return {
    id: String(organisation._id),
    organisationKey: organisation.domain,
    orgName: organisation.orgName,
    directorEmail: organisation.directorEmail,
    expectedRespondents: organisation.expectedRespondents,
    submissionCount,
    status: organisation.status,
    aggregatedScores: organisation.aggregatedScores,
    reportSentAt: organisation.reportSentAt
      ? organisation.reportSentAt.toISOString()
      : null,
    createdAt: organisation.createdAt.toISOString(),
    updatedAt: organisation.updatedAt.toISOString()
  };
}

export async function ensureOrganisationExists(
  organisationKey: string,
  orgName: string
): Promise<void> {
  await OrganisationModel.findOneAndUpdate(
    { domain: organisationKey },
    {
      $setOnInsert: {
        domain: organisationKey,
        status: "collecting",
        aggregatedScores: { ...ZERO_AGGREGATE_SCORES }
      },
      $set: {
        orgName: normalizeOrganisationName(orgName)
      }
    },
    {
      upsert: true,
      new: true
    }
  );
}

export async function refreshOrganisationAggregation(
  organisationKey: string
): Promise<{
  organisationId: string;
  organisationKey: string;
  orgName: string;
  status: OrganisationStatus;
  aggregatedScores: AggregateScores;
  submissionCount: number;
  expectedRespondents: number | null;
}> {
  const organisation = await OrganisationModel.findOne({ domain: organisationKey });

  if (!organisation) {
    throw new HttpError(404, "Organisation not found.");
  }

  const aggregate = await aggregateForDomain(organisationKey);

  organisation.aggregatedScores = aggregate.aggregatedScores;
  organisation.status = deriveStatus(
    organisation.status,
    aggregate.submissionCount,
    organisation.expectedRespondents
  );

  await organisation.save();

  return {
    organisationId: organisation.id,
    organisationKey: organisation.domain,
    orgName: organisation.orgName,
    status: organisation.status,
    aggregatedScores: organisation.aggregatedScores,
    submissionCount: aggregate.submissionCount,
    expectedRespondents: organisation.expectedRespondents
  };
}

export async function getOrganisationStatusById(orgId: string): Promise<{
  organisationId: string;
  organisationKey: string;
  orgName: string;
  directorEmail: string | null;
  expectedRespondents: number | null;
  status: OrganisationStatus;
  aggregatedScores: AggregateScores;
  submissionCount: number;
  reportSentAt: string | null;
}> {
  const organisation = await OrganisationModel.findById(orgId);

  if (!organisation) {
    throw new HttpError(404, "Organisation not found.");
  }

  const submissionCount = await SubmissionModel.countDocuments({
    orgDomain: organisation.domain
  });

  return {
    organisationId: organisation.id,
    organisationKey: organisation.domain,
    orgName: organisation.orgName,
    directorEmail: organisation.directorEmail,
    expectedRespondents: organisation.expectedRespondents,
    status: organisation.status,
    aggregatedScores: organisation.aggregatedScores,
    submissionCount,
    reportSentAt: organisation.reportSentAt
      ? organisation.reportSentAt.toISOString()
      : null
  };
}

export async function listOrganisationDashboards(): Promise<
  OrganisationDashboardItem[]
> {
  const organisations = await OrganisationModel.find().sort({ createdAt: -1 }).lean();
  const counts = await countSubmissionsByDomain();

  return organisations.map((organisation) =>
    toDashboardItem(organisation, counts.get(organisation.domain) || 0)
  );
}

export async function updateOrganisationAdminSettings(
  orgId: string,
  updates: {
    orgName?: string;
    directorEmail?: string;
    expectedRespondents?: number | null;
  }
): Promise<OrganisationDashboardItem> {
  const organisation = await OrganisationModel.findById(orgId);

  if (!organisation) {
    throw new HttpError(404, "Organisation not found.");
  }

  if (updates.orgName !== undefined) {
    const normalizedOrgName = normalizeOrganisationName(updates.orgName);
    const nextOrganisationKey = buildOrganisationKey(normalizedOrgName);

    if (nextOrganisationKey !== organisation.domain) {
      const conflictingOrganisation = await OrganisationModel.findOne({
        domain: nextOrganisationKey,
        _id: { $ne: organisation._id }
      });

      if (conflictingOrganisation) {
        throw new HttpError(
          409,
          "Another organisation already uses that normalised organisation name."
        );
      }

      await SubmissionModel.updateMany(
        { orgDomain: organisation.domain },
        {
          $set: {
            orgDomain: nextOrganisationKey,
            orgName: normalizedOrgName
          }
        }
      );

      organisation.domain = nextOrganisationKey;
    } else {
      await SubmissionModel.updateMany(
        { orgDomain: organisation.domain },
        {
          $set: {
            orgName: normalizedOrgName
          }
        }
      );
    }

    organisation.orgName = normalizedOrgName;
  }

  if (updates.directorEmail !== undefined) {
    organisation.directorEmail = updates.directorEmail.toLowerCase();
  }

  if (updates.expectedRespondents !== undefined) {
    organisation.expectedRespondents = updates.expectedRespondents;
  }

  const submissionCount = await SubmissionModel.countDocuments({
    orgDomain: organisation.domain
  });

  organisation.status = deriveStatus(
    organisation.status,
    submissionCount,
    organisation.expectedRespondents
  );

  await organisation.save();

  return toDashboardItem(organisation.toObject(), submissionCount);
}

export async function markOrganisationApproved(orgId: string): Promise<void> {
  const organisation = await OrganisationModel.findById(orgId);

  if (!organisation) {
    throw new HttpError(404, "Organisation not found.");
  }

  if (organisation.status !== "sent") {
    organisation.status = "approved";
    await organisation.save();
  }
}

export async function markOrganisationSent(
  orgId: string,
  directorEmail: string
): Promise<void> {
  const organisation = await OrganisationModel.findById(orgId);

  if (!organisation) {
    throw new HttpError(404, "Organisation not found.");
  }

  organisation.directorEmail = directorEmail.toLowerCase();
  organisation.status = "sent";
  organisation.reportSentAt = new Date();
  await organisation.save();
}
