import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  Document,
  Font,
  Image,
  Link,
  Page,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View
} from "@react-pdf/renderer";

import { DIMENSION_LABELS } from "../constants/assessment";
import type { DimensionKey, ReadinessLevel, ReportData } from "../types/assessment";

const COLORS = {
  navy: "#1A3C6E",
  electricBlue: "#2563EB",
  white: "#FFFFFF",
  slate: "#475569",
  dark: "#0F172A",
  line: "#CBD5E1",
  lightBlue: "#DBEAFE",
  lightSlate: "#F8FAFC",
  grey: "#94A3B8",
  red: "#DC2626",
  redBg: "#DC2626",
  orange: "#EA580C",
  orangeBg: "#EA580C",
  yellow: "#EAB308",
  yellowBg: "#FDE68A",
  green: "#16A34A",
  greenBg: "#16A34A"
} as const;

const DIMENSION_KEYS = Object.keys(DIMENSION_LABELS) as DimensionKey[];
const MAX_DIMENSION_SCORE = 20;
const RADAR_SIZE = 408;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = 144;
const RADAR_CANVAS_WIDTH = 488;
const RADAR_CANVAS_HEIGHT = 468;
const RADAR_X_OFFSET = (RADAR_CANVAS_WIDTH - RADAR_SIZE) / 2;
const RADAR_Y_OFFSET = 22;
const RADAR_LABEL_WIDTH = 116;
const RADAR_POINT_LABEL_WIDTH = 52;
const READING_WIDTH = 474;
const DISTRIBUTION_WIDTH = 472;

function findExistingFontPath(paths: string[]): string | null {
  for (const path of paths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

function registerReportFont(): string {
  const regularPath = findExistingFontPath([
    "C:\\Windows\\Fonts\\arial.ttf",
    "/mnt/c/Windows/Fonts/arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf"
  ]);
  const boldPath = findExistingFontPath([
    "C:\\Windows\\Fonts\\arialbd.ttf",
    "/mnt/c/Windows/Fonts/arialbd.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
  ]);

  if (!regularPath) {
    return "Helvetica";
  }

  Font.register({
    family: "Arial",
    fonts: [
      { src: regularPath, fontWeight: 400 },
      ...(boldPath ? [{ src: boldPath, fontWeight: 700 as const }] : [])
    ]
  });

  return "Arial";
}

const REPORT_FONT_FAMILY = registerReportFont();

function resolveReportLogo(): string | null {
  const logoPath = join(process.cwd(), "public", "brand", "elite-global-ai-icon.png");

  if (!existsSync(logoPath)) {
    return null;
  }

  const logoBase64 = readFileSync(logoPath).toString("base64");

  return `data:image/png;base64,${logoBase64}`;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingRight: 40,
    paddingBottom: 34,
    paddingLeft: 40,
    backgroundColor: COLORS.white,
    color: COLORS.dark,
    fontFamily: REPORT_FONT_FAMILY,
    fontSize: 11.2,
    lineHeight: 1.5
  },
  coverPage: {
    justifyContent: "space-between"
  },
  standardPage: {
    justifyContent: "space-between"
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  logoBadge: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    paddingTop: 8,
    paddingRight: 14,
    paddingBottom: 8,
    paddingLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 170
  },
  logoImage: {
    width: 34,
    height: 34,
    objectFit: "contain"
  },
  logoTextBlock: {
    marginLeft: 10,
    alignItems: "flex-start",
    justifyContent: "center"
  },
  logoTextLine: {
    width: 108,
    color: COLORS.white,
    fontSize: 11.2,
    fontWeight: 700,
    lineHeight: 1.02,
    textTransform: "uppercase",
    letterSpacing: 0.55,
    textAlign: "left"
  },
  wordmark: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  wordmarkSub: {
    marginTop: 2,
    color: COLORS.slate,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: "uppercase"
  },
  topMeta: {
    maxWidth: 220,
    alignItems: "flex-end"
  },
  topMetaLabel: {
    color: COLORS.slate,
    fontSize: 8.7,
    textTransform: "uppercase",
    letterSpacing: 0.9
  },
  topMetaValue: {
    marginTop: 2,
    color: COLORS.navy,
    fontSize: 12.8,
    fontWeight: 700,
    lineHeight: 1.3,
    textAlign: "right"
  },
  topMetaSubValue: {
    marginTop: 4,
    color: COLORS.slate,
    fontSize: 10.1,
    lineHeight: 1.35,
    textAlign: "right"
  },
  coverCenter: {
    alignItems: "center",
    paddingTop: 30,
    paddingRight: 18,
    paddingBottom: 28,
    paddingLeft: 18
  },
  coverOrgName: {
    color: COLORS.navy,
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.12,
    maxWidth: 480,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.7
  },
  coverTitle: {
    marginTop: 10,
    color: COLORS.dark,
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.18,
    textAlign: "center",
    letterSpacing: 0.4
  },
  coverSubtitle: {
    marginTop: 12,
    color: COLORS.slate,
    fontSize: 11.2,
    lineHeight: 1.45,
    maxWidth: 470,
    textAlign: "center"
  },
  scoreBlock: {
    alignItems: "center",
    marginTop: 28
  },
  scoreValue: {
    color: COLORS.electricBlue,
    fontSize: 88,
    fontWeight: 700,
    lineHeight: 1,
    textAlign: "center"
  },
  scoreDenominator: {
    marginTop: 8,
    color: COLORS.slate,
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 1,
    textAlign: "center"
  },
  coverReadinessBadge: {
    marginTop: 12
  },
  badge: {
    borderRadius: 999,
    paddingTop: 6,
    paddingRight: 16,
    paddingBottom: 6,
    paddingLeft: 16
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.9
  },
  executiveSummary: {
    width: READING_WIDTH,
    marginTop: 24,
    color: COLORS.slate,
    fontSize: 11.2,
    lineHeight: 1.62,
    textAlign: "justify"
  },
  coverFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 12
  },
  coverFooterText: {
    color: COLORS.slate,
    fontSize: 9.3,
    lineHeight: 1.45,
    textAlign: "center"
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  pageNumber: {
    color: COLORS.slate,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  pageTitle: {
    marginTop: 16,
    color: COLORS.navy,
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.18,
    maxWidth: 480
  },
  pageSubtitle: {
    marginTop: 8,
    color: COLORS.slate,
    fontSize: 11.2,
    lineHeight: 1.55,
    maxWidth: 470
  },
  footerRow: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  footerText: {
    color: COLORS.slate,
    fontSize: 8.9
  },
  radarPageBody: {
    marginTop: 20,
    flexGrow: 1
  },
  radarSectionTitle: {
    color: COLORS.dark,
    fontSize: 12.2,
    fontWeight: 700,
    marginBottom: 8
  },
  radarWrap: {
    alignItems: "center",
    paddingTop: 4,
    marginBottom: 18
  },
  radarCanvas: {
    position: "relative",
    width: RADAR_CANVAS_WIDTH,
    height: RADAR_CANVAS_HEIGHT,
    alignItems: "center"
  },
  radarSvgWrap: {
    marginTop: RADAR_Y_OFFSET,
    width: RADAR_SIZE,
    height: RADAR_SIZE
  },
  axisLabelWrap: {
    position: "absolute",
    width: RADAR_LABEL_WIDTH
  },
  axisLabel: {
    color: COLORS.navy,
    fontSize: 8.6,
    fontWeight: 700,
    lineHeight: 1.3,
    textAlign: "center"
  },
  pointLabelWrap: {
    position: "absolute",
    width: RADAR_POINT_LABEL_WIDTH,
    alignItems: "center"
  },
  pointLabel: {
    color: COLORS.navy,
    fontSize: 8.4,
    fontWeight: 700,
    lineHeight: 1.25,
    textAlign: "center"
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18
  },
  legendSwatch: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.electricBlue,
    marginRight: 8
  },
  legendLabel: {
    color: COLORS.slate,
    fontSize: 9.3
  },
  legendSvg: {
    width: 22,
    height: 10,
    marginRight: 8
  },
  dimensionBarsWrap: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.line
  },
  dimensionBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  dimensionBarLabel: {
    width: 168,
    color: COLORS.dark,
    fontSize: 9.7,
    fontWeight: 700,
    lineHeight: 1.3,
    paddingRight: 10
  },
  dimensionBarTrack: {
    flexGrow: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: COLORS.lightSlate,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: "hidden"
  },
  dimensionBarFill: {
    height: "100%",
    borderRadius: 999
  },
  dimensionBarValue: {
    width: 58,
    color: COLORS.navy,
    fontSize: 10,
    fontWeight: 700,
    textAlign: "right",
    paddingLeft: 10
  },
  dimensionPageBody: {
    marginTop: 16,
    flexGrow: 1
  },
  dimensionCard: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingTop: 12,
    paddingRight: 14,
    paddingBottom: 12,
    paddingLeft: 14,
    marginBottom: 9
  },
  dimensionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  dimensionCardTitle: {
    color: COLORS.navy,
    fontSize: 11.7,
    fontWeight: 700,
    flexGrow: 1,
    flexShrink: 1,
    lineHeight: 1.26,
    paddingRight: 12
  },
  scoreBadge: {
    borderRadius: 999,
    paddingTop: 4,
    paddingRight: 10,
    paddingBottom: 4,
    paddingLeft: 10
  },
  scoreBadgeText: {
    fontSize: 9.4,
    fontWeight: 700
  },
  benchmarkText: {
    marginTop: 6,
    color: COLORS.slate,
    fontSize: 9.1,
    lineHeight: 1.5
  },
  findingsWrap: {
    marginTop: 9
  },
  findingLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6
  },
  findingLabel: {
    color: COLORS.navy,
    fontSize: 9.2,
    fontWeight: 700,
    lineHeight: 1.35,
    width: 54
  },
  findingText: {
    color: COLORS.dark,
    fontSize: 9.1,
    lineHeight: 1.48,
    width: 390,
    flexGrow: 1,
    flexShrink: 1
  },
  gapPageBody: {
    marginTop: 16,
    flexGrow: 1
  },
  gapCard: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingTop: 12,
    paddingRight: 14,
    paddingBottom: 12,
    paddingLeft: 14,
    marginBottom: 10,
    backgroundColor: COLORS.white
  },
  gapTitle: {
    marginTop: 10,
    color: COLORS.navy,
    fontSize: 13.6,
    fontWeight: 700,
    lineHeight: 1.2
  },
  gapDescription: {
    marginTop: 6,
    color: COLORS.dark,
    fontSize: 10.1,
    lineHeight: 1.55
  },
  metaTitle: {
    marginTop: 8,
    color: COLORS.slate,
    fontSize: 8.9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  metaText: {
    marginTop: 3,
    color: COLORS.dark,
    fontSize: 9.7,
    lineHeight: 1.5
  },
  benchmarkPageBody: {
    marginTop: 16,
    flexGrow: 1
  },
  distributionWrap: {
    marginTop: 14,
    alignItems: "center"
  },
  distributionChart: {
    position: "relative",
    width: DISTRIBUTION_WIDTH,
    height: 100
  },
  distributionBarRow: {
    flexDirection: "row",
    width: DISTRIBUTION_WIDTH,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.line
  },
  distributionSegment: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: COLORS.white
  },
  distributionSegmentLast: {
    borderRightWidth: 0
  },
  distributionPercent: {
    color: COLORS.dark,
    fontSize: 11.2,
    fontWeight: 700
  },
  distributionLabelRow: {
    flexDirection: "row",
    width: DISTRIBUTION_WIDTH,
    marginTop: 9
  },
  distributionBandLabelWrap: {
    width: DISTRIBUTION_WIDTH / 4,
    alignItems: "center"
  },
  distributionBandLabel: {
    color: COLORS.slate,
    fontSize: 9.2
  },
  distributionMarker: {
    position: "absolute",
    top: -4,
    width: 2,
    height: 58,
    backgroundColor: COLORS.navy
  },
  distributionMarkerTag: {
    position: "absolute",
    top: -22,
    marginLeft: -32,
    width: 66,
    alignItems: "center"
  },
  distributionMarkerText: {
    color: COLORS.navy,
    fontSize: 8.6,
    fontWeight: 700,
    textAlign: "center"
  },
  caption: {
    marginTop: 16,
    color: COLORS.slate,
    fontSize: 10,
    lineHeight: 1.5,
    maxWidth: 470,
    textAlign: "center"
  },
  benchmarkStatRow: {
    flexDirection: "column",
    marginTop: 18
  },
  benchmarkStatCard: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingTop: 12,
    paddingRight: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    marginBottom: 10
  },
  benchmarkStatCardLast: {
    marginBottom: 0
  },
  benchmarkStatTitle: {
    color: COLORS.slate,
    fontSize: 9,
    lineHeight: 1.35,
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  benchmarkStatValue: {
    marginTop: 6,
    color: COLORS.navy,
    fontSize: 19,
    fontWeight: 700
  },
  benchmarkStatSubValue: {
    marginTop: 6,
    color: COLORS.dark,
    fontSize: 9.7,
    lineHeight: 1.48
  },
  benchmarkNarrative: {
    marginTop: 10,
    color: COLORS.slate,
    fontSize: 10.5,
    lineHeight: 1.58
  },
  nextStepsBody: {
    marginTop: 16,
    flexGrow: 1
  },
  stepCard: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    paddingTop: 12,
    paddingRight: 14,
    paddingBottom: 12,
    paddingLeft: 14,
    marginBottom: 10
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    marginRight: 10
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 9.5,
    fontWeight: 700
  },
  stepTitle: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.25,
    flexGrow: 1,
    flexShrink: 1
  },
  stepDescription: {
    marginTop: 8,
    color: COLORS.dark,
    fontSize: 10.1,
    lineHeight: 1.55
  },
  stepLink: {
    marginTop: 12,
    paddingTop: 8,
    paddingRight: 14,
    paddingBottom: 8,
    paddingLeft: 14,
    borderRadius: 999,
    backgroundColor: COLORS.electricBlue,
    color: COLORS.white,
    fontSize: 9.6,
    fontWeight: 700,
    textDecoration: "none",
    alignSelf: "flex-start"
  },
  contactPanel: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 12
  },
  contactTitle: {
    color: COLORS.navy,
    fontSize: 11.6,
    fontWeight: 700
  },
  contactSubTitle: {
    marginTop: 3,
    color: COLORS.slate,
    fontSize: 10
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8
  },
  contactItem: {
    width: "50%",
    paddingRight: 12,
    marginBottom: 8
  },
  contactLabel: {
    color: COLORS.slate,
    fontSize: 8.7,
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  contactValue: {
    marginTop: 2,
    color: COLORS.dark,
    fontSize: 9.9,
    lineHeight: 1.45
  },
  contactLink: {
    marginTop: 2,
    color: COLORS.electricBlue,
    fontSize: 9.9,
    lineHeight: 1.45,
    textDecoration: "none"
  },
  finalLine: {
    marginTop: 8,
    color: COLORS.slate,
    fontSize: 9.1,
    lineHeight: 1.4,
    textAlign: "center"
  }
});

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getBandColor(score: number): string {
  if (score <= 5.9) {
    return COLORS.red;
  }

  if (score <= 10.9) {
    return COLORS.orange;
  }

  if (score <= 15.9) {
    return COLORS.yellow;
  }

  return COLORS.green;
}

function getReadinessBadgeColors(level: ReadinessLevel): {
  backgroundColor: string;
  color: string;
} {
  if (level === "AI Unaware") {
    return {
      backgroundColor: COLORS.redBg,
      color: COLORS.white
    };
  }

  if (level === "AI Exploring") {
    return {
      backgroundColor: COLORS.orangeBg,
      color: COLORS.white
    };
  }

  if (level === "AI Developing") {
    return {
      backgroundColor: COLORS.yellowBg,
      color: COLORS.dark
    };
  }

  return {
    backgroundColor: COLORS.greenBg,
    color: COLORS.white
  };
}

function polarToCartesian(index: number, radius: number): { x: number; y: number } {
  const angle = ((-90 + index * (360 / DIMENSION_KEYS.length)) * Math.PI) / 180;

  return {
    x: RADAR_CENTER + radius * Math.cos(angle),
    y: RADAR_CENTER + radius * Math.sin(angle)
  };
}

function buildPolygonPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return "";
  }

  const [firstPoint, ...restPoints] = points;

  return [
    `M ${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)}`,
    ...restPoints.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
    "Z"
  ].join(" ");
}

function buildScorePolygon(values: number[]): string {
  return buildPolygonPath(
    values.map((value, index) =>
      polarToCartesian(index, (Math.max(0, Math.min(MAX_DIMENSION_SCORE, value)) / MAX_DIMENSION_SCORE) * RADAR_RADIUS)
    )
  );
}

function Wordmark() {
  const reportLogoSrc = resolveReportLogo();

  if (reportLogoSrc) {
    return (
      <View style={styles.logoBadge}>
        <Image src={reportLogoSrc} style={styles.logoImage} />
        <View style={styles.logoTextBlock}>
          <Text style={styles.logoTextLine}>Elite Global</Text>
          <Text style={styles.logoTextLine}>Intelligence</Text>
          <Text style={styles.logoTextLine}>Technologies</Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.wordmark}>Elite Global AI</Text>
      <Text style={styles.wordmarkSub}>AI Readiness Assessment</Text>
    </View>
  );
}

function PageHeader(props: {
  title: string;
  subtitle: string;
  pageNumber: number;
}) {
  return (
    <View>
      <View style={styles.headerRow}>
        <Wordmark />
        <Text style={styles.pageNumber}>Page {props.pageNumber} of 6</Text>
      </View>
      <Text style={styles.pageTitle}>{props.title}</Text>
      <Text style={styles.pageSubtitle}>{props.subtitle}</Text>
    </View>
  );
}

function PageFooter(props: {
  orgName: string;
  generatedAt: string;
  pageLabel: string;
}) {
  return (
    <View style={styles.footerRow}>
      <Text style={styles.footerText}>Confidential | {props.orgName}</Text>
      <Text style={styles.footerText}>{props.pageLabel} | {formatDate(props.generatedAt)}</Text>
    </View>
  );
}

function ReadinessBadge(props: { level: ReadinessLevel }) {
  const colors = getReadinessBadgeColors(props.level);

  return (
    <View style={[styles.badge, { backgroundColor: colors.backgroundColor }]}>
      <Text style={[styles.badgeText, { color: colors.color }]}>{props.level}</Text>
    </View>
  );
}

function ScoreBadge(props: { score: number }) {
  const colors = getReadinessBadgeColors(
    props.score <= 25
      ? "AI Unaware"
      : props.score <= 50
        ? "AI Exploring"
        : props.score <= 75
          ? "AI Developing"
          : "AI Proficient"
  );

  return (
    <View style={[styles.scoreBadge, { backgroundColor: colors.backgroundColor }]}>
      <Text style={[styles.scoreBadgeText, { color: colors.color }]}>
        {formatScore(props.score)}/20
      </Text>
    </View>
  );
}

function RadarLegend() {
  return (
    <View style={styles.legendRow}>
      <View style={styles.legendItem}>
        <View style={styles.legendSwatch} />
        <Text style={styles.legendLabel}>Organisation score</Text>
      </View>
      <View style={styles.legendItem}>
        <Svg style={styles.legendSvg} viewBox="0 0 22 10">
          <Path d="M 0 5 L 22 5" stroke={COLORS.grey} strokeWidth={1.8} strokeDasharray="6 4" />
        </Svg>
        <Text style={styles.legendLabel}>Sector benchmark</Text>
      </View>
    </View>
  );
}

function RadarChart(props: { data: ReportData }) {
  const organisationValues = DIMENSION_KEYS.map(
    (key) => props.data.aggregatedScores[key]
  );
  const benchmarkValues = DIMENSION_KEYS.map(
    (key) => props.data.sectorBenchmark.dimensionBenchmarkScores[key]
  );
  const axisPoints = DIMENSION_KEYS.map((_, index) => polarToCartesian(index, RADAR_RADIUS));
  const labelPoints = DIMENSION_KEYS.map((_, index) => polarToCartesian(index, RADAR_RADIUS + 68));
  const scorePoints = organisationValues.map((value, index) =>
    polarToCartesian(index, (value / MAX_DIMENSION_SCORE) * RADAR_RADIUS)
  );

  return (
    <View style={styles.radarWrap}>
      <View style={styles.radarCanvas}>
        <View style={styles.radarSvgWrap}>
          <Svg width={RADAR_SIZE} height={RADAR_SIZE} viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}>
            {[4, 8, 12, 16, 20].map((level) => (
              <Path
                key={`grid-${level}`}
                d={buildScorePolygon(DIMENSION_KEYS.map(() => level))}
                stroke={level === 20 ? COLORS.line : COLORS.lightBlue}
                strokeWidth={level === 20 ? 1.4 : 1}
                fill="none"
              />
            ))}

            {axisPoints.map((point, index) => (
              <Path
                key={`axis-${DIMENSION_KEYS[index]}`}
                d={`M ${RADAR_CENTER} ${RADAR_CENTER} L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`}
                stroke={COLORS.line}
                strokeWidth={1}
                fill="none"
              />
            ))}

            <Path
              d={buildScorePolygon(benchmarkValues)}
              stroke={COLORS.grey}
              strokeWidth={2}
              strokeDasharray="7 5"
              fill="none"
            />
            <Path
              d={buildScorePolygon(organisationValues)}
              stroke={COLORS.electricBlue}
              strokeWidth={2.5}
              fill={COLORS.electricBlue}
              fillOpacity={0.18}
            />
            <Rect
              x={RADAR_CENTER - 2}
              y={RADAR_CENTER - 2}
              width={4}
              height={4}
              fill={COLORS.navy}
            />
          </Svg>
        </View>

        {labelPoints.map((point, index) => (
          <View
            key={`label-${DIMENSION_KEYS[index]}`}
            style={[
              styles.axisLabelWrap,
              {
                left: point.x + RADAR_X_OFFSET - RADAR_LABEL_WIDTH / 2,
                top: point.y + RADAR_Y_OFFSET - 17
              }
            ]}
          >
            <Text style={styles.axisLabel}>{DIMENSION_LABELS[DIMENSION_KEYS[index]]}</Text>
          </View>
        ))}

        {scorePoints.map((point, index) => (
          <View
            key={`score-${DIMENSION_KEYS[index]}`}
            style={[
              styles.pointLabelWrap,
              {
                left: point.x + RADAR_X_OFFSET - RADAR_POINT_LABEL_WIDTH / 2,
                top: point.y + RADAR_Y_OFFSET - 9
              }
            ]}
          >
            <Text style={styles.pointLabel}>
              {formatScore(organisationValues[index])}/20
            </Text>
          </View>
        ))}
      </View>

      <RadarLegend />
    </View>
  );
}

function DimensionBars(props: { data: ReportData }) {
  return (
    <View style={styles.dimensionBarsWrap}>
      <Text style={styles.radarSectionTitle}>Dimension score bars</Text>
      {DIMENSION_KEYS.map((key) => {
        const score = props.data.aggregatedScores[key];

        return (
          <View key={key} style={styles.dimensionBarRow}>
            <Text style={styles.dimensionBarLabel}>{DIMENSION_LABELS[key]}</Text>
            <View style={styles.dimensionBarTrack}>
              <View
                style={[
                  styles.dimensionBarFill,
                  {
                    width: `${(Math.max(0, Math.min(MAX_DIMENSION_SCORE, score)) / MAX_DIMENSION_SCORE) * 100}%`,
                    backgroundColor: getBandColor(score)
                  }
                ]}
              />
            </View>
            <Text style={styles.dimensionBarValue}>{formatScore(score)}/20</Text>
          </View>
        );
      })}
    </View>
  );
}

function DistributionChart(props: { data: ReportData }) {
  const markerLeft = Math.max(
    0,
    Math.min(DISTRIBUTION_WIDTH, (props.data.aggregatedScores.total / 100) * DISTRIBUTION_WIDTH)
  );

  return (
    <View style={styles.distributionWrap}>
      <View style={styles.distributionChart}>
        <View style={styles.distributionBarRow}>
          {props.data.sectorBenchmark.distributionBands.map((band, index) => (
            <View
              key={band.label}
              style={[
                styles.distributionSegment,
                {
                  backgroundColor: band.containsOrganisation ? COLORS.lightBlue : COLORS.lightSlate,
                  borderRightWidth:
                    index === props.data.sectorBenchmark.distributionBands.length - 1
                      ? 0
                      : 1
                }
              ]}
            >
              <Text style={styles.distributionPercent}>{band.percentage}%</Text>
            </View>
          ))}
        </View>

        <View style={[styles.distributionMarker, { left: markerLeft }]} />
        <View style={[styles.distributionMarkerTag, { left: markerLeft }]}>
          <Text style={styles.distributionMarkerText}>
            {props.data.aggregatedScores.total}/100
          </Text>
        </View>

        <View style={styles.distributionLabelRow}>
          {props.data.sectorBenchmark.distributionBands.map((band) => (
            <View key={band.label} style={styles.distributionBandLabelWrap}>
              <Text style={styles.distributionBandLabel}>{band.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function BenchmarkStatCards(props: { data: ReportData }) {
  const stats = [
    {
      title: props.data.sectorBenchmark.localAverageLabel,
      value: `${formatScore(props.data.sectorBenchmark.localAverageScore)}/100`,
      meta: `${props.data.sectorBenchmark.peerGroupLabel}.`
    },
    {
      title: props.data.sectorBenchmark.globalAverageLabel,
      value: `${formatScore(props.data.sectorBenchmark.globalAverageScore)}/100`,
      meta: `Gap: ${formatScore(props.data.sectorBenchmark.globalGap)} points.`
    },
    {
      title: `${props.data.orgName} percentile`,
      value: props.data.sectorBenchmark.percentileLabel,
      meta: `${props.data.orgName}'s score places the organisation in the ${props.data.sectorBenchmark.percentileLabel} percentile of assessed institutions.`
    }
  ];

  return (
    <View style={styles.benchmarkStatRow}>
      {stats.map((stat, index) => (
        <View
          key={stat.title}
          style={[
            styles.benchmarkStatCard,
            {
              marginBottom: index === stats.length - 1 ? 0 : 10
            }
          ]}
        >
          <Text style={styles.benchmarkStatTitle}>{stat.title}</Text>
          <Text style={styles.benchmarkStatValue}>{stat.value}</Text>
          <Text style={styles.benchmarkStatSubValue}>{stat.meta}</Text>
        </View>
      ))}
    </View>
  );
}

function ContactItem(props: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <View style={styles.contactItem}>
      <Text style={styles.contactLabel}>{props.label}</Text>
      {props.href ? (
        <Link style={styles.contactLink} src={props.href}>
          {props.value}
        </Link>
      ) : (
        <Text style={styles.contactValue}>{props.value}</Text>
      )}
    </View>
  );
}

export function OrganisationReport(props: { data: ReportData }) {
  const { data } = props;

  return (
    <Document>
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <View>
          <View style={styles.topRow}>
            <Wordmark />
            <View style={styles.topMeta}>
              <Text style={styles.topMetaLabel}>Organisation</Text>
              <Text style={styles.topMetaValue}>{data.orgName}</Text>
              <Text style={styles.topMetaSubValue}>{formatDate(data.generatedAt)}</Text>
            </View>
          </View>

          <View style={styles.coverCenter}>
            <Text style={styles.coverOrgName}>{data.orgName}</Text>
            <Text style={styles.coverTitle}>AI READINESS ASSESSMENT REPORT</Text>
            <Text style={styles.coverSubtitle}>
              Prepared exclusively for {data.orgName} | {formatDate(data.generatedAt)} | Confidential
            </Text>

            <View style={styles.scoreBlock}>
              <Text style={styles.scoreValue}>{formatScore(data.aggregatedScores.total)}</Text>
              <Text style={styles.scoreDenominator}>/100</Text>
              <View style={styles.coverReadinessBadge}>
                <ReadinessBadge level={data.readinessLevel} />
              </View>
            </View>

            <Text style={styles.executiveSummary}>{data.executiveSummary}</Text>
          </View>
        </View>

        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>
            This report contains 6 pages. Contents: Executive Summary | Pentagon Score Visualisation | Dimension Analysis | Priority Gap Analysis | Competitive Benchmark | Recommended Next Steps
          </Text>
        </View>
      </Page>

      <Page size="A4" style={[styles.page, styles.standardPage]}>
        <View>
          <PageHeader
            pageNumber={2}
            title="Your Organisation's AI Readiness Profile"
            subtitle="The pentagon shows your scores across all five dimensions simultaneously. The gap between your polygon and the sector benchmark polygon represents your current competitive AI capability distance."
          />

          <View style={styles.radarPageBody}>
            <RadarChart data={data} />
            <DimensionBars data={data} />
          </View>
        </View>

        <PageFooter orgName={data.orgName} generatedAt={data.generatedAt} pageLabel="Pentagon Score Visualisation" />
      </Page>

      <Page size="A4" style={[styles.page, styles.standardPage]}>
        <View>
          <PageHeader
            pageNumber={3}
            title="Dimension Analysis"
            subtitle="Each section compares your organisation against the current sector benchmark and highlights the strongest answer-level signals identified in that dimension."
          />

          <View style={styles.dimensionPageBody}>
            {data.dimensionSections.map((section) => (
              <View key={section.key} style={styles.dimensionCard} wrap={false}>
                <View style={styles.dimensionCardHeader}>
                  <Text style={styles.dimensionCardTitle}>{section.label}</Text>
                  <ScoreBadge score={section.score} />
                </View>
                <Text style={styles.benchmarkText}>
                  {data.sectorBenchmark.industryLabel} organisations assessed by Elite Global AI score an average of {formatScore(section.benchmarkScore)}/20 on {section.label}.
                </Text>
                <Text style={styles.benchmarkText}>
                  Your organisation's score of {formatScore(section.score)}/20 places you {section.comparison} the sector average.
                </Text>

                <View style={styles.findingsWrap}>
                  {section.findings.map((finding, index) => (
                    <View key={`${section.key}-${finding.questionId}`} style={styles.findingLine}>
                      <Text style={styles.findingLabel}>Finding {index + 1}:</Text>
                      <Text style={styles.findingText}>{finding.finding}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        <PageFooter orgName={data.orgName} generatedAt={data.generatedAt} pageLabel="Dimension Analysis" />
      </Page>

      <Page size="A4" style={[styles.page, styles.standardPage]}>
        <View>
          <PageHeader
            pageNumber={4}
            title="Your Three Most Critical AI Capability Gaps"
            subtitle="These gaps represent the highest-priority capability development areas identified by your assessment. They are ranked by the combination of their current severity and their potential impact on your organisation's operational performance and regulatory position."
          />

          <View style={styles.gapPageBody}>
            {data.priorityGaps.map((gap) => {
              const colors =
                gap.priority === "CRITICAL"
                  ? { backgroundColor: COLORS.redBg, color: COLORS.white }
                  : gap.priority === "HIGH"
                    ? { backgroundColor: COLORS.orangeBg, color: COLORS.white }
                    : { backgroundColor: COLORS.yellowBg, color: COLORS.dark };

              return (
                <View key={gap.questionId} style={styles.gapCard} wrap={false}>
                  <View style={[styles.badge, { backgroundColor: colors.backgroundColor, marginTop: 0, alignSelf: "flex-start" }]}>
                    <Text style={[styles.badgeText, { color: colors.color }]}>{gap.priority}</Text>
                  </View>
                  <Text style={styles.gapTitle}>{gap.label}</Text>
                  <Text style={styles.gapDescription}>{gap.description}</Text>

                  <Text style={styles.metaTitle}>Business impact</Text>
                  <Text style={styles.metaText}>{gap.businessImpact}</Text>

                  <Text style={styles.metaTitle}>What addressing it requires</Text>
                  <Text style={styles.metaText}>{gap.requirement}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <PageFooter orgName={data.orgName} generatedAt={data.generatedAt} pageLabel="Priority Gap Analysis" />
      </Page>

      <Page size="A4" style={[styles.page, styles.standardPage]}>
        <View>
          <PageHeader
            pageNumber={5}
            title={`Where ${data.orgName} Stands in the ${data.sectorBenchmark.industryLabel} AI Readiness Landscape`}
            subtitle="This page contextualises your score against the current sector benchmark distribution and benchmark equivalents."
          />

          <View style={styles.benchmarkPageBody}>
            <DistributionChart data={data} />
            <Text style={styles.caption}>
              Based on assessments completed across {data.sectorBenchmark.industryPlural}. {data.orgName}'s score of {formatScore(data.aggregatedScores.total)} places the organisation in the {data.sectorBenchmark.percentileLabel} percentile of assessed institutions.
            </Text>

            <BenchmarkStatCards data={data} />

            <Text style={styles.benchmarkNarrative}>{data.sectorBenchmark.benchmarkNarrative}</Text>
          </View>
        </View>

        <PageFooter orgName={data.orgName} generatedAt={data.generatedAt} pageLabel="Competitive Benchmark" />
      </Page>

      <Page size="A4" style={[styles.page, styles.standardPage]}>
        <View>
          <PageHeader
            pageNumber={6}
            title="Your Recommended Path to AI Proficiency"
            subtitle="This page is designed as a professional recommendation summary that turns your current assessment into a clear next-step sequence."
          />

          <View style={styles.nextStepsBody}>
            <View style={styles.stepCard} wrap={false}>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>Step 1 - {data.nextSteps.briefingTitle}</Text>
              </View>
              <Text style={styles.stepDescription}>{data.nextSteps.briefingDescription}</Text>
              <Link style={styles.stepLink} src={data.nextSteps.briefingUrl}>
                Schedule Your Briefing Call
              </Link>
            </View>

            <View style={styles.stepCard} wrap={false}>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Step 2 - {data.nextSteps.programmeTitle}</Text>
              </View>
              <Text style={styles.stepDescription}>{data.nextSteps.programmeDescription}</Text>
            </View>

            <View style={styles.stepCard} wrap={false}>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepTitle}>Step 3 - {data.nextSteps.measurementTitle}</Text>
              </View>
              <Text style={styles.stepDescription}>{data.nextSteps.measurementDescription}</Text>
            </View>

            <View style={styles.contactPanel}>
              <Text style={styles.contactTitle}>{data.contact.name}</Text>
              <Text style={styles.contactSubTitle}>{data.contact.role}</Text>

              <View style={styles.contactGrid}>
                <ContactItem label="Email" value={data.contact.email} href={`mailto:${data.contact.email}`} />
                <ContactItem label="Phone" value={data.contact.phone} />
                <ContactItem label="LinkedIn" value={data.contact.linkedin} href={data.contact.linkedin} />
                <ContactItem label="Website" value={data.contact.website} href={data.contact.website} />
              </View>
            </View>

            <Text style={styles.finalLine}>
              This report was generated by the Elite Global AI Readiness Assessment System.
            </Text>
          </View>
        </View>

        <PageFooter orgName={data.orgName} generatedAt={data.generatedAt} pageLabel="Recommended Next Steps" />
      </Page>
    </Document>
  );
}