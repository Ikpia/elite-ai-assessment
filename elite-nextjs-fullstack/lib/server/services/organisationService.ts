import { OrganisationModel } from "../models/organisation";
import { SubmissionModel } from "../models/submission";
import { ZERO_AGGREGATE_SCORES } from "../constants/assessment";
import { env } from "../config/env";
import type {
  AggregateScores,
  FirmType,
  OrganisationDashboardItem,
  OrganisationStatus
} from "../types/assessment";
import { HttpError } from "../utils/httpError";
import {
  buildOrganisationKey,
  normalizeOrganisationName
} from "../utils/organisationIdentity";
import { roundToOneDecimal } from "../utils/rounding";

interface PublicDashboardSnapshot {
  summary: {
    participatingFirms: number;
    totalSubmissions: number;
    averageScore: number;
    highestAverageScore: number | null;
  };
  benchmarks: {
    localScore: number;
    globalScore: number;
  };
  sectors: Array<{
    firmType: FirmType;
    organisationCount: number;
    totalSubmissions: number;
    averageScore: number;
  }>;
  organisations: Array<{
    id: string;
    orgName: string;
    firmType: FirmType;
    submissionCount: number;
    averageScore: number;
    createdAt: string;
  }>;
  generatedAt: string;
}

export type AdminAccessTarget =
  | { type: "super-admin"; email: string }
  | {
      type: "organisation-admin";
      organisationId: string;
      orgName: string;
      directorEmail: string;
    };

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

function isDuplicateKeyError(error: unknown): error is {
  code: number;
  keyPattern?: Record<string, unknown>;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function toOrganisationDuplicateHttpError(error: unknown): HttpError {
  const keyPattern =
    isDuplicateKeyError(error) && error.keyPattern ? error.keyPattern : {};

  if ("directorEmail" in keyPattern) {
    return new HttpError(409, "Another organisation already uses that director email.");
  }

  if ("domain" in keyPattern) {
    return new HttpError(
      409,
      "An organisation already uses that normalised organisation name."
    );
  }

  return new HttpError(409, "Another organisation already uses that organisation name or director email.");
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
    firmType?: FirmType;
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
    firmType: organisation.firmType || "financial-services",
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

const PUBLIC_DASHBOARD_FIRM_TYPES: FirmType[] = [
  "financial-services",
  "healthcare",
  "consulting-firms",
  "smes"
];
const PUBLIC_DASHBOARD_CACHE_TTL_MS = 30_000;

let publicDashboardSnapshotCache:
  | { expiresAt: number; snapshot: PublicDashboardSnapshot }
  | null = null;
let publicDashboardSnapshotPromise: Promise<PublicDashboardSnapshot> | null = null;
// Bump this on invalidation so stale in-flight reads cannot repopulate the cache.
let publicDashboardSnapshotGeneration = 0;

export function invalidatePublicDashboardSnapshotCache(): void {
  publicDashboardSnapshotCache = null;
  publicDashboardSnapshotGeneration += 1;
  publicDashboardSnapshotPromise = null;
}

export async function ensureOrganisationExists(
  organisationKey: string,
  orgName: string,
  firmType: FirmType
): Promise<void> {
  const existingOrganisation = await OrganisationModel.findOne({ domain: organisationKey });

  if (existingOrganisation && !existingOrganisation.firmType) {
    existingOrganisation.firmType = firmType;
    await existingOrganisation.save();
  } else if (existingOrganisation && existingOrganisation.firmType !== firmType) {
    throw new HttpError(
      409,
      `This organisation is already linked to the ${existingOrganisation.firmType} questionnaire.`
    );
  }

  await OrganisationModel.findOneAndUpdate(
    { domain: organisationKey },
    {
      $setOnInsert: {
        domain: organisationKey,
        firmType,
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
  firmType: FirmType;
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
  invalidatePublicDashboardSnapshotCache();

  return {
    organisationId: organisation.id,
    organisationKey: organisation.domain,
    firmType: organisation.firmType || "financial-services",
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
  firmType: FirmType;
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
    firmType: organisation.firmType || "financial-services",
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
  const [organisations, counts] = await Promise.all([
    OrganisationModel.find(
      {},
      {
        domain: 1,
        firmType: 1,
        orgName: 1,
        directorEmail: 1,
        expectedRespondents: 1,
        status: 1,
        aggregatedScores: 1,
        reportSentAt: 1,
        createdAt: 1,
        updatedAt: 1
      }
    )
      .sort({ createdAt: -1 })
      .lean(),
    countSubmissionsByDomain()
  ]);

  return organisations.map((organisation) =>
    toDashboardItem(organisation, counts.get(organisation.domain) || 0)
  );
}

export async function getOrganisationDashboardById(
  orgId: string
): Promise<OrganisationDashboardItem> {
  const organisation = await OrganisationModel.findById(
    orgId,
    {
      domain: 1,
      firmType: 1,
      orgName: 1,
      directorEmail: 1,
      expectedRespondents: 1,
      status: 1,
      aggregatedScores: 1,
      reportSentAt: 1,
      createdAt: 1,
      updatedAt: 1
    }
  ).lean();

  if (!organisation) {
    throw new HttpError(404, "Organisation not found.");
  }

  const submissionCount = await SubmissionModel.countDocuments({
    orgDomain: organisation.domain
  });

  return toDashboardItem(organisation, submissionCount);
}

export async function registerDirectorAdminForOrganisation(input: {
  orgName: string;
  directorEmail: string;
  firmType: FirmType;
}): Promise<{
  organisationId: string;
  organisationKey: string;
  firmType: FirmType;
  orgName: string;
}> {
  const normalizedOrgName = normalizeOrganisationName(input.orgName);
  const organisationKey = buildOrganisationKey(normalizedOrgName);
  const normalizedDirectorEmail = input.directorEmail.toLowerCase();

  if (env.superAdminEmails.includes(normalizedDirectorEmail)) {
    throw new HttpError(
      409,
      "That email is reserved for Elite Global AI superadmin access."
    );
  }

  const [organisationByKey, organisationByDirectorEmail] = await Promise.all([
    OrganisationModel.findOne({ domain: organisationKey }),
    OrganisationModel.findOne({ directorEmail: normalizedDirectorEmail })
  ]);

  if (
    organisationByDirectorEmail &&
    (!organisationByKey ||
      String(organisationByDirectorEmail._id) !== String(organisationByKey._id))
  ) {
    throw new HttpError(409, "Another organisation already uses that director email.");
  }

  if (!organisationByKey) {
    try {
      const organisation = await OrganisationModel.create({
        domain: organisationKey,
        firmType: input.firmType,
        orgName: normalizedOrgName,
        directorEmail: normalizedDirectorEmail,
        expectedRespondents: null,
        status: "collecting",
        aggregatedScores: { ...ZERO_AGGREGATE_SCORES }
      });

      invalidatePublicDashboardSnapshotCache();

      return {
        organisationId: organisation.id,
        organisationKey: organisation.domain,
        firmType: organisation.firmType || "financial-services",
        orgName: organisation.orgName
      };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw toOrganisationDuplicateHttpError(error);
      }

      throw error;
    }
  }

  if (organisationByKey.firmType !== input.firmType) {
    throw new HttpError(
      409,
      `This organisation is already linked to the ${organisationByKey.firmType} questionnaire.`
    );
  }

  if (
    organisationByKey.directorEmail &&
    organisationByKey.directorEmail !== normalizedDirectorEmail
  ) {
    throw new HttpError(
      409,
      "This organisation already has a different director email configured."
    );
  }

  organisationByKey.orgName = normalizedOrgName;
  organisationByKey.directorEmail = normalizedDirectorEmail;

  try {
    await organisationByKey.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw toOrganisationDuplicateHttpError(error);
    }

    throw error;
  }

  invalidatePublicDashboardSnapshotCache();

  return {
    organisationId: organisationByKey.id,
    organisationKey: organisationByKey.domain,
    firmType: organisationByKey.firmType || "financial-services",
    orgName: organisationByKey.orgName
  };
}

export async function createOrganisationAdminRecord(input: {
  orgName: string;
  directorEmail: string;
  firmType: FirmType;
  expectedRespondents?: number | null;
}): Promise<OrganisationDashboardItem> {
  const normalizedOrgName = normalizeOrganisationName(input.orgName);
  const organisationKey = buildOrganisationKey(normalizedOrgName);
  const normalizedDirectorEmail = input.directorEmail.toLowerCase();

  if (env.superAdminEmails.includes(normalizedDirectorEmail)) {
    throw new HttpError(
      409,
      "That email is reserved for Elite Global AI superadmin access."
    );
  }

  const [existingOrganisation, conflictingOrganisation] = await Promise.all([
    OrganisationModel.findOne({ domain: organisationKey }),
    OrganisationModel.findOne({ directorEmail: normalizedDirectorEmail })
  ]);

  if (existingOrganisation) {
    throw new HttpError(
      409,
      "An organisation already uses that normalised organisation name."
    );
  }

  if (conflictingOrganisation) {
    throw new HttpError(409, "Another organisation already uses that director email.");
  }

  try {
    const organisation = await OrganisationModel.create({
      domain: organisationKey,
      firmType: input.firmType,
      orgName: normalizedOrgName,
      directorEmail: normalizedDirectorEmail,
      expectedRespondents:
        input.expectedRespondents === undefined ? null : input.expectedRespondents,
      status: "collecting",
      aggregatedScores: { ...ZERO_AGGREGATE_SCORES }
    });
    invalidatePublicDashboardSnapshotCache();
    return toDashboardItem(organisation.toObject(), 0);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw toOrganisationDuplicateHttpError(error);
    }

    throw error;
  }
}

export async function resolveAdminAccessTargetByEmail(
  email: string
): Promise<AdminAccessTarget> {
  const normalizedEmail = email.toLowerCase();

  if (env.superAdminEmails.includes(normalizedEmail)) {
    return {
      type: "super-admin",
      email: normalizedEmail
    };
  }

  const organisations = await OrganisationModel.find(
    { directorEmail: normalizedEmail },
    { orgName: 1, directorEmail: 1 }
  )
    .limit(2)
    .lean();

  if (organisations.length === 0) {
    throw new HttpError(404, "No organisation is configured for this director email.");
  }

  if (organisations.length > 1) {
    throw new HttpError(
      409,
      "This director email is linked to multiple organisations. Contact support."
    );
  }

  return {
    type: "organisation-admin",
    organisationId: String(organisations[0]._id),
    orgName: organisations[0].orgName,
    directorEmail: organisations[0].directorEmail || normalizedEmail
  };
}

export async function getAssessmentInvitePrefillByOrganisationId(
  organisationId: string
): Promise<{
  organisationId: string;
  organisationKey: string;
  firmType: FirmType;
  orgName: string;
}> {
  const organisation = await OrganisationModel.findById(
    organisationId,
    {
      domain: 1,
      firmType: 1,
      orgName: 1
    }
  ).lean();

  if (!organisation) {
    throw new HttpError(404, "Assessment invite is no longer valid.");
  }

  return {
    organisationId: String(organisation._id),
    organisationKey: organisation.domain,
    firmType: organisation.firmType || "financial-services",
    orgName: organisation.orgName
  };
}

export async function getPublicDashboardSnapshot(): Promise<PublicDashboardSnapshot> {
  const organisations = await listOrganisationDashboards();
  const participatingOrganisations = organisations
    .filter((organisation) => organisation.submissionCount > 0)
    .map((organisation) => ({
      id: organisation.id,
      orgName: organisation.orgName,
      firmType: organisation.firmType,
      submissionCount: organisation.submissionCount,
      averageScore: roundToOneDecimal(organisation.aggregatedScores.total),
      createdAt: organisation.createdAt
    }))
    .sort((left, right) => {
      if (right.averageScore !== left.averageScore) {
        return right.averageScore - left.averageScore;
      }

      if (right.submissionCount !== left.submissionCount) {
        return right.submissionCount - left.submissionCount;
      }

      return left.orgName.localeCompare(right.orgName);
    });

  const totalSubmissions = participatingOrganisations.reduce(
    (total, organisation) => total + organisation.submissionCount,
    0
  );
  const averageScore = participatingOrganisations.length
    ? roundToOneDecimal(
        participatingOrganisations.reduce(
          (total, organisation) => total + organisation.averageScore,
          0
        ) / participatingOrganisations.length
      )
    : 0;
  const highestAverageScore = participatingOrganisations.length
    ? participatingOrganisations[0].averageScore
    : null;

  const sectors = PUBLIC_DASHBOARD_FIRM_TYPES.map((firmType) => {
    const organisationsForSector = participatingOrganisations.filter(
      (organisation) => organisation.firmType === firmType
    );

    const sectorAverageScore = organisationsForSector.length
      ? roundToOneDecimal(
          organisationsForSector.reduce(
            (total, organisation) => total + organisation.averageScore,
            0
          ) / organisationsForSector.length
        )
      : 0;

    return {
      firmType,
      organisationCount: organisationsForSector.length,
      totalSubmissions: organisationsForSector.reduce(
        (total, organisation) => total + organisation.submissionCount,
        0
      ),
      averageScore: sectorAverageScore
    };
  });

  return {
    summary: {
      participatingFirms: participatingOrganisations.length,
      totalSubmissions,
      averageScore,
      highestAverageScore
    },
    benchmarks: {
      localScore: env.reportBenchmarkLocal,
      globalScore: env.reportBenchmarkGlobal
    },
    sectors,
    organisations: participatingOrganisations,
    generatedAt: new Date().toISOString()
  };
}

export async function getCachedPublicDashboardSnapshot(): Promise<PublicDashboardSnapshot> {
  const now = Date.now();

  if (publicDashboardSnapshotCache && publicDashboardSnapshotCache.expiresAt > now) {
    return publicDashboardSnapshotCache.snapshot;
  }

  if (publicDashboardSnapshotPromise) {
    return publicDashboardSnapshotPromise;
  }

  const generation = publicDashboardSnapshotGeneration;
  const promise = (async () => {
    const snapshot = await getPublicDashboardSnapshot();

    if (generation === publicDashboardSnapshotGeneration) {
      publicDashboardSnapshotCache = {
        snapshot,
        expiresAt: Date.now() + PUBLIC_DASHBOARD_CACHE_TTL_MS
      };
    }

    return snapshot;
  })();
  publicDashboardSnapshotPromise = promise;

  try {
    return await promise;
  } finally {
    if (publicDashboardSnapshotPromise === promise) {
      publicDashboardSnapshotPromise = null;
    }
  }
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
    const normalizedDirectorEmail = updates.directorEmail.toLowerCase();

    if (env.superAdminEmails.includes(normalizedDirectorEmail)) {
      throw new HttpError(
        409,
        "That email is reserved for Elite Global AI superadmin access."
      );
    }

    const conflictingOrganisation = await OrganisationModel.findOne({
      directorEmail: normalizedDirectorEmail,
      _id: { $ne: organisation._id }
    });

    if (conflictingOrganisation) {
      throw new HttpError(
        409,
        "Another organisation already uses that director email."
      );
    }

    organisation.directorEmail = normalizedDirectorEmail;
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

  try {
    await organisation.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw toOrganisationDuplicateHttpError(error);
    }

    throw error;
  }
  invalidatePublicDashboardSnapshotCache();

  return toDashboardItem(organisation.toObject(), submissionCount);
}

export async function deleteOrganisationAndSubmissions(orgId: string): Promise<{
  organisationId: string;
  orgName: string;
}> {
  const organisation = await OrganisationModel.findById(orgId);

  if (!organisation) {
    throw new HttpError(404, "Organisation not found.");
  }

  await SubmissionModel.deleteMany({ orgDomain: organisation.domain });
  await OrganisationModel.deleteOne({ _id: organisation._id });
  invalidatePublicDashboardSnapshotCache();

  return {
    organisationId: String(organisation._id),
    orgName: organisation.orgName
  };
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
