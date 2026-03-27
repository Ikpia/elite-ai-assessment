import { renderToBuffer } from "@react-pdf/renderer";

import { env } from "../config/env";
import {
  DIMENSION_LABELS,
  DIMENSION_RECOMMENDATIONS
} from "../constants/assessment";
import { OrganisationModel } from "../models/organisation";
import { SubmissionModel } from "../models/submission";
import { OrganisationReport } from "../reports/OrganisationReport";
import type {
  AggregateScores,
  DimensionInsight,
  DimensionKey,
  ReportData
} from "../types/assessment";
import { HttpError } from "../utils/httpError";
import { roundToOneDecimal } from "../utils/rounding";
import { getReadinessDescription, getReadinessLevel } from "./scoringService";

const DIMENSION_KEYS = Object.keys(DIMENSION_LABELS) as DimensionKey[];

function buildDimensionInsights(aggregatedScores: AggregateScores): DimensionInsight[] {
  return DIMENSION_KEYS.map((key) => ({
    key,
    label: DIMENSION_LABELS[key],
    score: aggregatedScores[key],
    recommendation: DIMENSION_RECOMMENDATIONS[key]
  }));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function buildReportData(orgId: string): Promise<ReportData> {
  const organisation = await OrganisationModel.findById(orgId);

  if (!organisation) {
    throw new HttpError(404, "Organisation not found.");
  }

  const submittedRespondents = await SubmissionModel.countDocuments({
    orgDomain: organisation.domain
  });

  if (submittedRespondents === 0) {
    throw new HttpError(400, "A report cannot be generated before responses exist.");
  }

  const readinessLevel = getReadinessLevel(organisation.aggregatedScores.total);
  const readinessDescription = getReadinessDescription(
    organisation.aggregatedScores.total
  ).replace(/\[Organisation Name\]/g, organisation.orgName);
  const dimensionInsights = buildDimensionInsights(organisation.aggregatedScores);
  const strongestDimension = [...dimensionInsights].sort(
    (left, right) => right.score - left.score
  )[0];
  const weakestDimensions = [...dimensionInsights]
    .sort((left, right) => left.score - right.score)
    .slice(0, 3);

  return {
    organisationId: organisation.id,
    orgName: organisation.orgName,
    organisationKey: organisation.domain,
    firmType: organisation.firmType || "financial-services",
    directorEmail: organisation.directorEmail,
    status: organisation.status,
    submittedRespondents,
    expectedRespondents: organisation.expectedRespondents,
    generatedAt: new Date().toISOString(),
    aggregatedScores: organisation.aggregatedScores,
    readinessLevel,
    readinessDescription,
    benchmarkLocal: env.reportBenchmarkLocal,
    benchmarkGlobal: env.reportBenchmarkGlobal,
    benchmarkGapLocal: roundToOneDecimal(
      organisation.aggregatedScores.total - env.reportBenchmarkLocal
    ),
    benchmarkGapGlobal: roundToOneDecimal(
      organisation.aggregatedScores.total - env.reportBenchmarkGlobal
    ),
    strongestDimension,
    weakestDimensions
  };
}

export async function generateOrganisationReportPdf(orgId: string): Promise<{
  filename: string;
  buffer: Buffer;
  reportData: ReportData;
}> {
  const reportData = await buildReportData(orgId);
  const filename = `${slugify(reportData.orgName)}-ai-readiness-report.pdf`;
  const buffer = await renderToBuffer(<OrganisationReport data={reportData} />);

  return {
    filename,
    buffer,
    reportData
  };
}
