import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

import { getQuestionsForFirmType } from "../../shared/questions";
import { env } from "../config/env";
import {
  DIMENSION_LABELS,
  DIMENSION_RECOMMENDATIONS,
  QUESTION_DIMENSIONS
} from "../constants/assessment";
import { OrganisationModel } from "../models/organisation";
import { SubmissionModel } from "../models/submission";
import { OrganisationReport } from "../reports/OrganisationReport";
import { RespondentReport } from "../reports/RespondentReport";
import type {
  AggregateScores,
  DimensionInsight,
  DimensionKey,
  DimensionScores,
  FirmType,
  ReadinessLevel,
  ReportContactDetails,
  ReportData,
  ReportDimensionSection,
  ReportDistributionBand,
  ReportNextSteps,
  ReportPriorityGap,
  ReportQuestionAnalysis,
  ReportRespondentScore,
  RespondentReportData,
  ReportSectorBenchmark,
  ScoredAnswerRecord
} from "../types/assessment";
import { HttpError } from "../utils/httpError";
import { roundToOneDecimal } from "../utils/rounding";
import { getReadinessDescription, getReadinessLevel } from "./scoringService";

const DIMENSION_KEYS = Object.keys(DIMENSION_LABELS) as DimensionKey[];

const SCORE_BANDS: Array<{ label: string; min: number; max: number }> = [
  { label: "0-25", min: 0, max: 25 },
  { label: "26-50", min: 26, max: 50 },
  { label: "51-75", min: 51, max: 75 },
  { label: "76-100", min: 76, max: 100 }
];

const QUESTION_LABELS: Record<number, string> = {
  1: "Operational AI Interpretation",
  2: "Team AI Literacy",
  3: "AI Regulatory Compliance Awareness",
  4: "AI Tool Adoption Breadth",
  5: "Leadership Learning Currency",
  6: "Data Quality Assurance",
  7: "AI Data Governance Policy",
  8: "System Interoperability",
  9: "AI Vendor Evaluation",
  10: "Data Analysis Capability",
  11: "Workflow AI Opportunity Review",
  12: "Change Adoption Discipline",
  13: "AI Approval Governance",
  14: "AI Outcome Measurement",
  15: "Cross-Functional AI Governance",
  16: "Executive AI Leadership",
  17: "Documented AI Strategy",
  18: "AI Capability Investment",
  19: "Competitive AI Intelligence",
  20: "AI-Driven Talent Retention",
  21: "AI Bias Detection Readiness",
  22: "AI Incident Response Planning",
  23: "Third-Party AI Monitoring",
  24: "AI Transparency Policy",
  25: "AI Ethics Training Coverage"
};

interface SectorProfile {
  industryLabel: string;
  industryPlural: string;
  peerGroupLabel: string;
  localAverageLabel: string;
  localAverageScoreFallback: number;
  globalAverageLabel: string;
  globalAverageScore: number;
  benchmarkNarrative: string;
  valueOutcome: string;
  riskOutcome: string;
  stakeholderLabel: string;
  regulatorLabel: string;
  programmeEmphasis: string;
}

const SECTOR_PROFILES: Record<FirmType, SectorProfile> = {
  "financial-services": {
    industryLabel: "Banking",
    industryPlural: "banking organisations",
    peerGroupLabel: "Nigerian banking organisations assessed by Elite Global AI",
    localAverageLabel: "Average banking AI readiness score",
    localAverageScoreFallback: 38,
    globalAverageLabel: "Average UK banking sector equivalent",
    globalAverageScore: 68,
    benchmarkNarrative:
      "Financial institutions that fall below the sector average AI readiness score face increasing competitive pressure from both international banks with established AI operations and from fintechs whose AI-native architecture gives them structural operational advantages in customer acquisition, credit assessment speed, and fraud detection accuracy. The organisations that close their AI readiness gap in 2025-2026 will have a structural advantage that competitors who delay will spend 3-5 years recovering.",
    valueOutcome: "extract value from AI investment",
    riskOutcome: "regulatory and customer-decision exposure remain materially elevated",
    stakeholderLabel: "customers, auditors, or supervisors",
    regulatorLabel: "CBN AI guidelines and NDPA obligations",
    programmeEmphasis:
      "leadership briefing, governance policy design, workflow redesign, and role-based enablement for risk, operations, data, and compliance leaders"
  },
  healthcare: {
    industryLabel: "Healthcare",
    industryPlural: "healthcare organisations",
    peerGroupLabel: "healthcare organisations assessed by Elite Global AI",
    localAverageLabel: "Average healthcare organisation AI readiness score",
    localAverageScoreFallback: 27,
    globalAverageLabel:
      "Average WHO recommended minimum for AI-deploying health systems",
    globalAverageScore: 60,
    benchmarkNarrative:
      "Healthcare providers that sit below the current sector average AI readiness level face growing pressure from better-instrumented health systems that can deploy AI safely across diagnostics, scheduling, triage, and operational planning. The organisations that close their AI readiness gap early will improve both patient experience and operational resilience while reducing the risk of unsafe or poorly governed AI deployment.",
    valueOutcome: "convert AI adoption into safe clinical and operational improvement",
    riskOutcome: "patient-safety and governance exposure remain material",
    stakeholderLabel: "patients, clinical auditors, or regulators",
    regulatorLabel: "patient-safety, privacy, and clinical governance obligations",
    programmeEmphasis:
      "clinical governance design, patient-data controls, vendor review discipline, and cross-functional training for clinical, IT, and compliance leaders"
  },
  "consulting-firms": {
    industryLabel: "Consulting",
    industryPlural: "consulting firms",
    peerGroupLabel: "consulting firms assessed by Elite Global AI",
    localAverageLabel: "Average consulting firm AI readiness score",
    localAverageScoreFallback: 42,
    globalAverageLabel: "Average Big 4 global equivalent",
    globalAverageScore: 71,
    benchmarkNarrative:
      "Professional services firms that remain below the current sector AI readiness average are exposed to margin pressure, slower delivery cycles, and growing client expectations around AI-assisted work quality and transparency. The firms that close this readiness gap earliest will be better positioned to defend premium pricing, improve delivery efficiency, and retain high-performing staff who expect modern AI-enabled ways of working.",
    valueOutcome: "turn AI usage into faster, higher-quality client delivery",
    riskOutcome: "quality assurance and professional-liability exposure remain material",
    stakeholderLabel: "clients, reviewers, or regulators",
    regulatorLabel:
      "professional standards, client confidentiality obligations, and liability expectations",
    programmeEmphasis:
      "engagement-methodology design, partner enablement, AI QA controls, and client disclosure policy work"
  },
  smes: {
    industryLabel: "SME",
    industryPlural: "small and medium enterprises",
    peerGroupLabel: "SMEs assessed by Elite Global AI",
    localAverageLabel: "Average SME AI readiness score",
    localAverageScoreFallback: env.reportBenchmarkLocal,
    globalAverageLabel: "Average digitally mature SME equivalent",
    globalAverageScore: env.reportBenchmarkGlobal,
    benchmarkNarrative:
      "SMEs that delay structured AI capability development risk falling behind better-instrumented competitors that can use AI to improve responsiveness, automate routine work, and make better commercial decisions with leaner teams. The businesses that move from ad hoc AI usage to governed operational adoption earliest will create a durable efficiency advantage that is difficult for slower competitors to close.",
    valueOutcome: "convert early AI usage into measurable productivity and customer value",
    riskOutcome: "commercial, customer, and continuity exposure remain elevated",
    stakeholderLabel: "customers, partners, or regulators",
    regulatorLabel: "privacy, customer, and business-continuity obligations",
    programmeEmphasis:
      "practical workflow redesign, leadership planning, responsible-use controls, and team enablement across core business processes"
  }
};

const DIMENSION_IMPACT: Record<DimensionKey, (profile: SectorProfile) => string> = {
  aiLiteracy: (profile) =>
    `This slows confident decision-making in AI-enabled work and increases the risk of poor human override judgement in situations affected by ${profile.regulatorLabel}.`,
  dataReadiness: () =>
    "This limits safe scaling of AI because data quality, integration, or vendor-control weaknesses will surface as performance and audit issues as adoption expands.",
  aiStrategy: () =>
    "This reduces the odds that AI deployments deliver measurable value because use cases are not being prioritised, governed, and measured with enough operational discipline.",
  workflowAdoption: () =>
    "This weakens execution speed and competitive positioning because leadership direction, investment, and talent signals are not yet strong enough to sustain organisational change.",
  ethicsCompliance: (profile) =>
    `This creates direct exposure when AI-supported decisions need to be explained or defended to ${profile.stakeholderLabel}.`
};

const DIMENSION_REQUIREMENT: Record<
  DimensionKey,
  (profile: SectorProfile, gapLabel: string) => string
> = {
  aiLiteracy: (_profile, gapLabel) =>
    `Role-based enablement, practical decision training, and clearer operating standards targeted at ${gapLabel.toLowerCase()}.`,
  dataReadiness: (_profile, gapLabel) =>
    `Structured data governance, tighter system controls, and formal operating ownership for ${gapLabel.toLowerCase()}.`,
  aiStrategy: (_profile, gapLabel) =>
    `Workflow review, approval gates, and KPI-based measurement targeted at ${gapLabel.toLowerCase()}.`,
  workflowAdoption: (_profile, gapLabel) =>
    `A named executive sponsor, approved targets, budget visibility, and a cross-functional change plan focused on ${gapLabel.toLowerCase()}.`,
  ethicsCompliance: (_profile, gapLabel) =>
    `Documented policy, escalation paths, monitoring controls, and staff training focused on ${gapLabel.toLowerCase()}.`
};

const QUESTION_IMPACT_OVERRIDES: Partial<Record<number, (profile: SectorProfile) => string>> = {
  3: (profile) =>
    `This gap increases direct exposure under ${profile.regulatorLabel} because the organisation may be unable to evidence what its AI obligations are or how they are being met.`,
  7: () =>
    "This weakens control over how sensitive data is used, shared, and audited in AI-enabled workflows.",
  9: () =>
    "This exposes the organisation to vendor-related performance, bias, and compliance failures that may not be detected before they affect live operations.",
  13: () =>
    "This leaves high-impact AI deployments without a defensible approval trail, which creates avoidable governance risk when outcomes are challenged.",
  14: () =>
    "This makes it difficult to prove whether AI investments are improving speed, quality, cost, or risk outcomes, which slows executive decision-making and budget justification.",
  17: () =>
    "This keeps AI activity fragmented across teams and weakens the organisation's ability to prioritise investment against competitive risk.",
  21: (profile) =>
    `This gap creates direct exposure if biased AI outputs affect stakeholders and the organisation cannot detect, explain, or remediate the issue before it reaches ${profile.stakeholderLabel}.`,
  22: () =>
    "This increases operational and governance risk because AI-related failures may escalate without a tested response path.",
  24: (profile) =>
    `This gap creates direct regulatory and reputational exposure when AI-influenced decisions need to be explained to ${profile.stakeholderLabel}.`,
  25: () =>
    "This leaves staff vulnerable to avoidable AI misuse, weak judgement, and escalation failures in live operations."
};

const QUESTION_REQUIREMENT_OVERRIDES: Partial<
  Record<number, (profile: SectorProfile) => string>
> = {
  3: (profile) =>
    `A structured compliance review against ${profile.regulatorLabel}, backed by policy updates and leadership communication.`,
  7: () =>
    "A documented AI data-use policy, defined ownership, and routine control reviews covering data handling, storage, and auditability.",
  9: () =>
    "A formal vendor evaluation and monitoring framework with clear approval criteria, evidence requirements, and review cadence.",
  13: () =>
    "A defined AI approval process with named sign-off authority, evidence thresholds, and documented governance checkpoints.",
  14: () =>
    "A standard measurement framework that links each AI deployment to operational, financial, or risk KPIs and reviews them on a regular cadence.",
  17: () =>
    "A board- or leadership-approved AI strategy with measurable targets, ownership, and funding aligned to business priorities.",
  21: () =>
    "Bias monitoring controls, escalation procedures, and routine assurance activity for AI outputs that can materially affect stakeholders.",
  22: () =>
    "A documented and tested AI incident response plan integrated with existing operational or safety escalation procedures.",
  24: (profile) =>
    `A documented AI transparency policy, reviewer training, and clear rules for when AI involvement must be disclosed to ${profile.stakeholderLabel}.`,
  25: () =>
    "Role-appropriate ethics and responsible-use training with documented completion, refresh cycles, and escalation guidance."
};

interface SubmissionProjection {
  respondentName: string;
  respondentRole: ReportRespondentScore["respondentRole"];
  respondentDept: string | null;
  totalScore: number;
  answers: ScoredAnswerRecord[];
}

interface SectorOrganisationProjection {
  domain: string;
  orgName: string;
  aggregatedScores: AggregateScores;
}

interface QuestionStatAccumulator {
  scoreTotal: number;
  count: number;
  optionCounts: Map<string, number>;
  selectionCounts: Map<string, number>;
}

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

function buildRespondentScores(submissions: SubmissionProjection[]): ReportRespondentScore[] {
  return [...submissions]
    .sort(
      (left, right) =>
        left.respondentName.localeCompare(right.respondentName, "en", {
          sensitivity: "base"
        }) || right.totalScore - left.totalScore
    )
    .map((submission) => ({
      respondentName: submission.respondentName,
      respondentRole: submission.respondentRole,
      respondentDept: submission.respondentDept,
      totalScore: submission.totalScore,
      readinessLevel: getReadinessLevel(submission.totalScore)
    }));
}

function formatList(items: string[]): string {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function ordinalize(value: number): string {
  const remainderTen = value % 10;
  const remainderHundred = value % 100;

  if (remainderTen === 1 && remainderHundred !== 11) {
    return `${value}st`;
  }

  if (remainderTen === 2 && remainderHundred !== 12) {
    return `${value}nd`;
  }

  if (remainderTen === 3 && remainderHundred !== 13) {
    return `${value}rd`;
  }

  return `${value}th`;
}

function compareToBenchmark(score: number, benchmarkScore: number): "above" | "at" | "below" {
  const difference = score - benchmarkScore;

  if (Math.abs(difference) <= 0.3) {
    return "at";
  }

  return difference > 0 ? "above" : "below";
}

function buildEvenDimensionScores(totalScore: number): DimensionScores {
  const perDimensionScore = roundToOneDecimal(totalScore / DIMENSION_KEYS.length);

  return {
    aiLiteracy: perDimensionScore,
    dataReadiness: perDimensionScore,
    aiStrategy: perDimensionScore,
    workflowAdoption: perDimensionScore,
    ethicsCompliance: perDimensionScore
  };
}

function normalizeObservationText(text: string): string {
  return text
    .trim()
    .replace(/\.$/, "")
    .replace(/^We are\b/i, "the organisation is")
    .replace(/^We have\b/i, "the organisation has")
    .replace(/^We do not\b/i, "the organisation does not")
    .replace(/^We don't\b/i, "the organisation does not")
    .replace(/^We can\b/i, "the organisation can")
    .replace(/^We would\b/i, "the organisation would")
    .replace(/^We rely\b/i, "the organisation relies")
    .replace(/^We review\b/i, "the organisation reviews")
    .replace(/^We conduct\b/i, "the organisation conducts")
    .replace(/^We believe\b/i, "leadership believes")
    .replace(/^We suspect\b/i, "leadership suspects")
    .replace(/^We know\b/i, "leadership knows")
    .replace(/^We make\b/i, "the organisation makes")
    .replace(/^We use\b/i, "the organisation uses")
    .replace(/^We keep\b/i, "the organisation keeps")
    .replace(/^Our /i, "the organisation's ")
    .replace(/^I /i, "the organisation leader ")
    .replace(/\bour organisation\b/gi, "the organisation")
    .replace(/\bour firm\b/gi, "the firm")
    .replace(/\bour business\b/gi, "the business")
    .replace(/\bmy business\b/gi, "the business");
}

function ensureSentence(text: string): string {
  const trimmed = text.trim();

  if (!trimmed) {
    return "";
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function createEmptyQuestionStat(): QuestionStatAccumulator {
  return {
    scoreTotal: 0,
    count: 0,
    optionCounts: new Map<string, number>(),
    selectionCounts: new Map<string, number>()
  };
}

function getTopEntries(counts: Map<string, number>, limit: number): string[] {
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

function getSectorProfile(firmType: FirmType): SectorProfile {
  return SECTOR_PROFILES[firmType] || SECTOR_PROFILES.smes;
}

function buildObservedAnswerLabel(
  question: ReturnType<typeof getQuestionsForFirmType>[number],
  stat: QuestionStatAccumulator
): string | null {
  if (stat.count === 0) {
    return null;
  }

  if (question.multiSelect) {
    const noneSelectedCount = stat.selectionCounts.get("none-of-the-above") || 0;

    if (noneSelectedCount >= Math.ceil(stat.count / 2)) {
      return "many respondents report that no AI tools or capabilities are currently in active use";
    }

    const topSelections = getTopEntries(
      new Map(
        [...stat.selectionCounts.entries()].filter(
          ([value]) => value !== "none-of-the-above"
        )
      ),
      3
    )
      .map((value) => question.options.find((option) => option.value === value)?.label)
      .filter((label): label is string => Boolean(label));

    if (topSelections.length === 0) {
      return "AI tool usage breadth is still very limited across submitted responses";
    }

    return `the most frequently reported active capabilities are ${formatList(topSelections)}`;
  }

  const topOptionValue = getTopEntries(stat.optionCounts, 1)[0];
  const optionLabel = question.options.find((option) => option.value === topOptionValue)?.label;

  return optionLabel ? normalizeObservationText(optionLabel) : null;
}

function buildQuestionFinding(
  averageScore: number,
  observedAnswerLabel: string | null
): string {
  if (!observedAnswerLabel) {
    return `This capability averaged ${averageScore.toFixed(1)}/4 across submitted responses.`;
  }

  return ensureSentence(
    `This capability averaged ${averageScore.toFixed(1)}/4, and submitted responses most often indicate the following: ${observedAnswerLabel}`
  );
}

function buildQuestionAnalyses(params: {
  firmType: FirmType;
  submissions: SubmissionProjection[];
}): ReportQuestionAnalysis[] {
  const questions = getQuestionsForFirmType(params.firmType);
  const stats = new Map<number, QuestionStatAccumulator>();

  questions.forEach((question) => {
    stats.set(question.id, createEmptyQuestionStat());
  });

  for (const submission of params.submissions) {
    for (const answer of submission.answers) {
      const stat = stats.get(answer.questionId);

      if (!stat) {
        continue;
      }

      stat.scoreTotal += answer.score;
      stat.count += 1;

      if (answer.selectedOption) {
        stat.optionCounts.set(
          answer.selectedOption,
          (stat.optionCounts.get(answer.selectedOption) || 0) + 1
        );
      }

      if (answer.selectedOptions) {
        for (const selectedValue of answer.selectedOptions) {
          stat.selectionCounts.set(
            selectedValue,
            (stat.selectionCounts.get(selectedValue) || 0) + 1
          );
        }
      }
    }
  }

  return questions.map((question) => {
    const stat = stats.get(question.id) || createEmptyQuestionStat();
    const averageScore = stat.count ? roundToOneDecimal(stat.scoreTotal / stat.count) : 0;
    const observedAnswerLabel = buildObservedAnswerLabel(question, stat);

    return {
      questionId: question.id,
      label: QUESTION_LABELS[question.id] || `Question ${question.id}`,
      averageScore,
      maxScore: 4,
      observedAnswerLabel,
      finding: buildQuestionFinding(averageScore, observedAnswerLabel)
    };
  });
}

function buildSectorBenchmark(params: {
  firmType: FirmType;
  organisationScore: number;
  sectorOrganisations: SectorOrganisationProjection[];
}): ReportSectorBenchmark {
  const profile = getSectorProfile(params.firmType);
  const scorePool = params.sectorOrganisations.map(
    (organisation) => organisation.aggregatedScores.total
  );
  const localAverageScore = params.sectorOrganisations.length
    ? roundToOneDecimal(
        scorePool.reduce((total, score) => total + score, 0) /
          params.sectorOrganisations.length
      )
    : profile.localAverageScoreFallback;

  const dimensionBenchmarkScores = params.sectorOrganisations.length
    ? {
        aiLiteracy: roundToOneDecimal(
          params.sectorOrganisations.reduce(
            (total, organisation) => total + organisation.aggregatedScores.aiLiteracy,
            0
          ) / params.sectorOrganisations.length
        ),
        dataReadiness: roundToOneDecimal(
          params.sectorOrganisations.reduce(
            (total, organisation) => total + organisation.aggregatedScores.dataReadiness,
            0
          ) / params.sectorOrganisations.length
        ),
        aiStrategy: roundToOneDecimal(
          params.sectorOrganisations.reduce(
            (total, organisation) => total + organisation.aggregatedScores.aiStrategy,
            0
          ) / params.sectorOrganisations.length
        ),
        workflowAdoption: roundToOneDecimal(
          params.sectorOrganisations.reduce(
            (total, organisation) =>
              total + organisation.aggregatedScores.workflowAdoption,
            0
          ) / params.sectorOrganisations.length
        ),
        ethicsCompliance: roundToOneDecimal(
          params.sectorOrganisations.reduce(
            (total, organisation) =>
              total + organisation.aggregatedScores.ethicsCompliance,
            0
          ) / params.sectorOrganisations.length
        )
      }
    : buildEvenDimensionScores(localAverageScore);

  const percentile = scorePool.length
    ? Math.max(
        1,
        Math.round(
          (scorePool.filter((score) => score <= params.organisationScore).length /
            scorePool.length) *
            100
        )
      )
    : 0;

  const distributionBands: ReportDistributionBand[] = SCORE_BANDS.map((band) => {
    const count = scorePool.filter(
      (score) => score >= band.min && score <= band.max
    ).length;

    return {
      label: band.label,
      min: band.min,
      max: band.max,
      count,
      percentage: scorePool.length ? roundToOneDecimal((count / scorePool.length) * 100) : 0,
      containsOrganisation:
        params.organisationScore >= band.min && params.organisationScore <= band.max
    };
  });

  return {
    industryLabel: profile.industryLabel,
    industryPlural: profile.industryPlural,
    peerGroupLabel: profile.peerGroupLabel,
    localAverageLabel: profile.localAverageLabel,
    localAverageScore,
    globalAverageLabel: profile.globalAverageLabel,
    globalAverageScore: profile.globalAverageScore,
    globalGap: roundToOneDecimal(profile.globalAverageScore - localAverageScore),
    percentile,
    percentileLabel: ordinalize(percentile),
    peerOrganisationCount: params.sectorOrganisations.length,
    dimensionBenchmarkScores,
    distributionBands,
    benchmarkNarrative: profile.benchmarkNarrative
  };
}

function buildDimensionSections(params: {
  aggregatedScores: AggregateScores;
  benchmarkScores: DimensionScores;
  questionAnalyses: ReportQuestionAnalysis[];
}): ReportDimensionSection[] {
  return DIMENSION_KEYS.map((key) => {
    const benchmarkScore = params.benchmarkScores[key];
    const findings = params.questionAnalyses
      .filter((analysis) => QUESTION_DIMENSIONS[analysis.questionId] === key)
      .sort((left, right) => left.averageScore - right.averageScore)
      .slice(0, 3);

    return {
      key,
      label: DIMENSION_LABELS[key],
      score: params.aggregatedScores[key],
      benchmarkScore,
      comparison: compareToBenchmark(params.aggregatedScores[key], benchmarkScore),
      findings
    };
  });
}

function buildPriorityGaps(params: {
  questionAnalyses: ReportQuestionAnalysis[];
  firmType: FirmType;
}): ReportPriorityGap[] {
  const profile = getSectorProfile(params.firmType);

  return [...params.questionAnalyses]
    .sort((left, right) => left.averageScore - right.averageScore || left.questionId - right.questionId)
    .slice(0, 3)
    .map((analysis) => {
      const dimensionKey = QUESTION_DIMENSIONS[analysis.questionId];
      const baseImpact = QUESTION_IMPACT_OVERRIDES[analysis.questionId];
      const baseRequirement = QUESTION_REQUIREMENT_OVERRIDES[analysis.questionId];
      const descriptionIntro = analysis.observedAnswerLabel
        ? ensureSentence(analysis.observedAnswerLabel)
        : "Submitted responses indicate a persistent capability weakness in this area.";

      return {
        questionId: analysis.questionId,
        label: analysis.label,
        averageScore: analysis.averageScore,
        priority:
          analysis.averageScore <= 1.1
            ? "CRITICAL"
            : analysis.averageScore <= 2.1
              ? "HIGH"
              : "MEDIUM",
        description:
          `${descriptionIntro} This item averaged ${analysis.averageScore.toFixed(1)}/4 across submitted responses, making it one of the weakest capability indicators in the assessment.`,
        businessImpact: (baseImpact || DIMENSION_IMPACT[dimensionKey])(profile),
        requirement: (baseRequirement || DIMENSION_REQUIREMENT[dimensionKey])(
          profile,
          analysis.label
        )
      };
    });
}

function buildExecutiveSummary(params: {
  orgName: string;
  totalScore: number;
  readinessLevel: ReadinessLevel;
  localAverageScore: number;
  firmType: FirmType;
  weakestDimensions: DimensionInsight[];
}): string {
  const profile = getSectorProfile(params.firmType);
  const comparisonText =
    Math.abs(params.totalScore - params.localAverageScore) <= 0.4
      ? `in line with the average score of ${params.localAverageScore}`
      : params.totalScore > params.localAverageScore
        ? `above the average score of ${params.localAverageScore}`
        : `below the average score of ${params.localAverageScore}`;
  const weakestAreas = formatList(
    params.weakestDimensions.map((dimension) => dimension.label)
  );

  const bandNarrative: Record<ReadinessLevel, string> = {
    "AI Unaware": `foundational AI capability is not yet established across the organisation, and major gaps across ${weakestAreas} are constraining reliable AI deployment`,
    "AI Exploring": `foundational AI awareness exists within the organisation, but significant capability gaps across ${weakestAreas} are still limiting the organisation's ability to ${profile.valueOutcome}`,
    "AI Developing": `meaningful AI capability exists, but targeted gaps across ${weakestAreas} are preventing the organisation from scaling AI confidently across priority workflows`,
    "AI Proficient": `the organisation is operating from a position of relative strength, but remaining gaps across ${weakestAreas} are still material to sustaining leadership in the sector`
  };

  return `${params.orgName}'s AI Readiness Score of ${params.totalScore} places the organisation in the ${params.readinessLevel} stage - ${comparisonText} recorded across ${profile.peerGroupLabel}. This score indicates that ${bandNarrative[params.readinessLevel]} and ${profile.riskOutcome}. The Priority Gap Analysis on Page 4 identifies the three capability areas where focused development would generate the most immediate operational and compliance value.`;
}

function buildNextSteps(params: {
  firmType: FirmType;
  readinessLevel: ReadinessLevel;
  priorityGaps: ReportPriorityGap[];
}): ReportNextSteps {
  const profile = getSectorProfile(params.firmType);
  const gapLabels = params.priorityGaps.map((gap) => gap.label).slice(0, 3);
  const gapFocus = gapLabels.length ? formatList(gapLabels) : "the priority gaps identified in this report";

  return {
    briefingTitle: "Confirm Your Results (This Week)",
    briefingDescription:
      "Elite Global AI offers a complimentary 90-minute AI Readiness Briefing for organisations that complete this assessment. In this session, our practitioner team will walk your leadership through your specific results, answer questions about your priority gaps, and present a tailored capability development plan. There is no obligation to proceed beyond this briefing.",
    briefingUrl: env.reportCalendlyUrl,
    programmeTitle: "Address Your Priority Gaps (Next 30 Days)",
    programmeDescription:
      `For an organisation currently at the ${params.readinessLevel} stage, the Elite Global AI 30-Day AI Capability Development Programme should focus first on ${gapFocus}. The recommended programme combines ${profile.programmeEmphasis} so leadership can close the highest-exposure issues identified in Page 4 and create a measurable improvement path within 30 days.`,
    measurementTitle: "Measure Your Progress (30 Days After Programme)",
    measurementDescription:
      "At the end of every Elite Global AI programme, participants complete the Organisational AI Readiness Assessment again. The improvement in your organisation's score - compared to today's baseline - is the documented evidence of your team's capability development that you present to your board, your auditors, and your regulators."
  };
}

function buildContactDetails(): ReportContactDetails {
  return {
    name: env.reportContactName,
    role: env.reportContactRole,
    email: env.reportContactEmail,
    phone: env.reportContactPhone,
    linkedin: env.reportContactLinkedin,
    website: env.reportContactWebsite
  };
}

async function resolveRespondentSubmission(params: {
  organisationId: string;
  recipientEmail: string;
  submissionId?: string;
}) {
  const organisation = await OrganisationModel.findById(params.organisationId).select({ domain: 1 });

  if (!organisation) {
    throw new HttpError(404, "Organisation not found.");
  }

  const submissionQuery = params.submissionId
    ? {
        _id: params.submissionId,
        orgDomain: organisation.domain,
        respondentEmail: params.recipientEmail
      }
    : {
        orgDomain: organisation.domain,
        respondentEmail: params.recipientEmail
      };

  const submission = await SubmissionModel.findOne(submissionQuery)
    .sort(params.submissionId ? undefined : { submittedAt: -1 })
    .select({
      orgDomain: 1,
      firmType: 1,
      orgName: 1,
      respondentEmail: 1,
      respondentName: 1,
      respondentRole: 1,
      respondentDept: 1,
      dimensionScores: 1,
      totalScore: 1,
      submittedAt: 1
    });

  if (!submission) {
    throw new HttpError(404, "Respondent report not found.");
  }

  return {
    organisationId: organisation.id,
    submission
  };
}

function buildRespondentPersonalSummary(params: {
  respondentName: string;
  readinessLevel: ReadinessLevel;
  strongestDimension: DimensionInsight;
  weakestDimension: DimensionInsight;
}): string {
  return `${params.respondentName}, your submission places you in the ${params.readinessLevel} stage. Your strongest area is ${params.strongestDimension.label}, while ${params.weakestDimension.label} is the clearest development priority in your current response pattern.`;
}

export async function buildRespondentReportData(params: {
  organisationId: string;
  recipientEmail: string;
  submissionId?: string;
}): Promise<RespondentReportData> {
  const { organisationId, submission } = await resolveRespondentSubmission(params);
  const readinessLevel = getReadinessLevel(submission.totalScore);
  const readinessDescription = getReadinessDescription(submission.totalScore).replace(
    /\[Organisation Name\]/g,
    submission.orgName
  );
  const dimensionInsights = buildDimensionInsights({
    ...submission.dimensionScores,
    total: submission.totalScore
  });
  const strongestDimension = [...dimensionInsights].sort(
    (left, right) => right.score - left.score
  )[0];
  const weakestDimension = [...dimensionInsights].sort(
    (left, right) => left.score - right.score
  )[0];

  return {
    submissionId: submission.id,
    organisationId,
    organisationKey: submission.orgDomain,
    orgName: submission.orgName,
    firmType: submission.firmType,
    respondentEmail: submission.respondentEmail,
    respondentName: submission.respondentName,
    respondentRole: submission.respondentRole,
    respondentDept: submission.respondentDept,
    submittedAt: submission.submittedAt.toISOString(),
    generatedAt: new Date().toISOString(),
    totalScore: submission.totalScore,
    readinessLevel,
    readinessDescription,
    personalSummary: buildRespondentPersonalSummary({
      respondentName: submission.respondentName,
      readinessLevel,
      strongestDimension,
      weakestDimension
    }),
    dimensionScores: submission.dimensionScores,
    dimensionInsights,
    strongestDimension,
    weakestDimension,
    contact: buildContactDetails()
  };
}

export async function buildReportData(orgId: string): Promise<ReportData> {
  const organisation = await OrganisationModel.findById(orgId);

  if (!organisation) {
    throw new HttpError(404, "Organisation not found.");
  }

  const firmType = organisation.firmType || "financial-services";
  const submissions = await SubmissionModel.find({
    orgDomain: organisation.domain
  })
    .select({
      respondentName: 1,
      respondentRole: 1,
      respondentDept: 1,
      totalScore: 1,
      answers: 1
    })
    .lean<SubmissionProjection[]>();

  const submittedRespondents = submissions.length;

  if (submittedRespondents === 0) {
    throw new HttpError(400, "A report cannot be generated before responses exist.");
  }

  const activeDomains = await SubmissionModel.distinct("orgDomain", {
    firmType
  });
  const sectorOrganisations = await OrganisationModel.find({
    firmType,
    domain: { $in: activeDomains }
  })
    .select({
      domain: 1,
      orgName: 1,
      aggregatedScores: 1
    })
    .lean<SectorOrganisationProjection[]>();

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
  const sectorBenchmark = buildSectorBenchmark({
    firmType,
    organisationScore: organisation.aggregatedScores.total,
    sectorOrganisations
  });
  const questionAnalyses = buildQuestionAnalyses({
    firmType,
    submissions
  });
  const dimensionSections = buildDimensionSections({
    aggregatedScores: organisation.aggregatedScores,
    benchmarkScores: sectorBenchmark.dimensionBenchmarkScores,
    questionAnalyses
  });
  const priorityGaps = buildPriorityGaps({
    questionAnalyses,
    firmType
  });
  const executiveSummary = buildExecutiveSummary({
    orgName: organisation.orgName,
    totalScore: organisation.aggregatedScores.total,
    readinessLevel,
    localAverageScore: sectorBenchmark.localAverageScore,
    firmType,
    weakestDimensions
  });
  const nextSteps = buildNextSteps({
    firmType,
    readinessLevel,
    priorityGaps
  });

  return {
    organisationId: organisation.id,
    orgName: organisation.orgName,
    organisationKey: organisation.domain,
    firmType,
    directorEmail: organisation.directorEmail,
    status: organisation.status,
    submittedRespondents,
    expectedRespondents: organisation.expectedRespondents,
    generatedAt: new Date().toISOString(),
    aggregatedScores: organisation.aggregatedScores,
    readinessLevel,
    readinessDescription,
    executiveSummary,
    benchmarkLocal: sectorBenchmark.localAverageScore,
    benchmarkGlobal: sectorBenchmark.globalAverageScore,
    benchmarkGapLocal: roundToOneDecimal(
      organisation.aggregatedScores.total - sectorBenchmark.localAverageScore
    ),
    benchmarkGapGlobal: roundToOneDecimal(
      organisation.aggregatedScores.total - sectorBenchmark.globalAverageScore
    ),
    strongestDimension,
    weakestDimensions,
    dimensionSections,
    priorityGaps,
    sectorBenchmark,
    nextSteps,
    contact: buildContactDetails(),
    respondents: buildRespondentScores(submissions)
  };
}

export async function generateOrganisationReportPdf(orgId: string): Promise<{
  filename: string;
  buffer: Buffer;
  reportData: ReportData;
}> {
  const reportData = await buildReportData(orgId);
  const filename = `${slugify(reportData.orgName)}-ai-readiness-report.pdf`;
  const reportDocument = createElement(
    OrganisationReport,
    { data: reportData }
  ) as unknown as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(
    reportDocument
  );

  return {
    filename,
    buffer,
    reportData
  };
}

export async function generateRespondentReportPdf(params: {
  organisationId: string;
  recipientEmail: string;
  submissionId?: string;
}): Promise<{
  filename: string;
  buffer: Buffer;
  reportData: RespondentReportData;
}> {
  const reportData = await buildRespondentReportData(params);
  const filename = `${slugify(reportData.orgName)}-${slugify(reportData.respondentName)}-personal-ai-readiness-report.pdf`;
  const reportDocument = createElement(
    RespondentReport,
    { data: reportData }
  ) as unknown as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(reportDocument);

  return {
    filename,
    buffer,
    reportData
  };
}