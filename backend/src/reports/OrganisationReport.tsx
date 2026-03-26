import {
  Circle,
  Document,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View
} from "@react-pdf/renderer";

import { DIMENSION_LABELS } from "../constants/assessment.js";
import type { DimensionKey, ReportData } from "../types/assessment.js";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    color: "#0f172a",
    backgroundColor: "#f8fafc"
  },
  header: {
    marginBottom: 20
  },
  eyebrow: {
    fontSize: 10,
    color: "#b45309",
    marginBottom: 6,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6
  },
  subtitle: {
    fontSize: 12,
    color: "#334155"
  },
  statGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    border: "1 solid #dbeafe"
  },
  statLabel: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 6,
    textTransform: "uppercase"
  },
  statValue: {
    fontSize: 18,
    fontWeight: 700
  },
  section: {
    marginBottom: 18,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 14
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10
  },
  paragraph: {
    lineHeight: 1.5,
    color: "#334155"
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottom: "1 solid #e2e8f0"
  },
  scoreText: {
    fontWeight: 700
  },
  actionItem: {
    marginBottom: 8
  },
  actionTitle: {
    fontWeight: 700,
    marginBottom: 2
  },
  footer: {
    marginTop: 8,
    fontSize: 9,
    color: "#64748b"
  },
  chartPageHeader: {
    marginBottom: 18
  },
  chartCard: {
    marginBottom: 18,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 14
  },
  chartDescription: {
    color: "#475569",
    marginBottom: 12,
    lineHeight: 1.4
  },
  barGroup: {
    marginTop: 4
  },
  barRow: {
    marginBottom: 12
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  barLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1e293b",
    maxWidth: "72%"
  },
  barValue: {
    fontSize: 10,
    fontWeight: 700,
    color: "#334155"
  },
  barTrack: {
    width: "100%",
    height: 12,
    backgroundColor: "#e2e8f0",
    borderRadius: 999
  },
  barFill: {
    height: "100%",
    borderRadius: 999
  },
  pieSection: {
    flexDirection: "row",
    alignItems: "center"
  },
  pieWrap: {
    width: 210,
    alignItems: "center",
    justifyContent: "center"
  },
  pieLegend: {
    flex: 1,
    paddingLeft: 12
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8
  },
  legendTextWrap: {
    flex: 1
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1e293b"
  },
  legendMeta: {
    fontSize: 9,
    color: "#64748b"
  },
  chartFootnote: {
    marginTop: 10,
    fontSize: 9,
    color: "#64748b"
  }
});

const DIMENSION_KEYS = Object.keys(DIMENSION_LABELS) as DimensionKey[];
const DIMENSION_COLORS = ["#2563eb", "#0f766e", "#d97706", "#7c3aed", "#dc2626"];

interface DimensionChartItem {
  key: DimensionKey;
  label: string;
  score: number;
  color: string;
  percentage: number;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function buildDimensionChartData(data: ReportData): DimensionChartItem[] {
  const total = DIMENSION_KEYS.reduce(
    (sum, key) => sum + data.aggregatedScores[key],
    0
  );

  return DIMENSION_KEYS.map((key, index) => ({
    key,
    label: DIMENSION_LABELS[key],
    score: data.aggregatedScores[key],
    color: DIMENSION_COLORS[index],
    percentage: total > 0 ? (data.aggregatedScores[key] / total) * 100 : 0
  }));
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describePieSlice(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? "1" : "0";

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    "Z"
  ].join(" ");
}

function DimensionBarChart({
  items
}: {
  items: DimensionChartItem[];
}) {
  return (
    <View style={styles.barGroup}>
      {items.map((item) => (
        <View key={item.key} style={styles.barRow}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>{item.label}</Text>
            <Text style={styles.barValue}>{item.score.toFixed(1)}/20</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.max(0, Math.min(100, (item.score / 20) * 100))}%`,
                  backgroundColor: item.color
                }
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function DimensionPieChart({
  items
}: {
  items: DimensionChartItem[];
}) {
  const activeItems = items.filter((item) => item.score > 0);

  if (activeItems.length === 0) {
    return (
      <Svg viewBox="0 0 200 200" width={180} height={180}>
        <Circle cx="100" cy="100" r="72" fill="#e2e8f0" />
        <Circle cx="100" cy="100" r="34" fill="#ffffff" />
      </Svg>
    );
  }

  if (activeItems.length === 1) {
    return (
      <Svg viewBox="0 0 200 200" width={180} height={180}>
        <Circle cx="100" cy="100" r="72" fill={activeItems[0].color} />
        <Circle cx="100" cy="100" r="34" fill="#ffffff" />
      </Svg>
    );
  }

  let startAngle = 0;

  return (
    <Svg viewBox="0 0 200 200" width={180} height={180}>
      {activeItems.map((item) => {
        const sweepAngle = (item.percentage / 100) * 360;
        const endAngle = startAngle + sweepAngle;
        const path = describePieSlice(100, 100, 72, startAngle, endAngle);

        startAngle = endAngle;

        return <Path key={item.key} d={path} fill={item.color} />;
      })}
      <Circle cx="100" cy="100" r="34" fill="#ffffff" />
    </Svg>
  );
}

export function OrganisationReport({
  data
}: {
  data: ReportData;
}) {
  const chartItems = buildDimensionChartData(data);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Elite Global AI</Text>
          <Text style={styles.title}>AI Readiness Assessment Report</Text>
          <Text style={styles.subtitle}>
            {data.orgName} • Generated {formatDate(data.generatedAt)}
          </Text>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Overall Score</Text>
            <Text style={styles.statValue}>{data.aggregatedScores.total}/100</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Readiness</Text>
            <Text style={styles.statValue}>{data.readinessLevel}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Responses</Text>
            <Text style={styles.statValue}>{data.submittedRespondents}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.paragraph}>
            {data.readinessDescription}
          </Text>
          <Text style={styles.paragraph}>
            The strongest observed dimension is {data.strongestDimension.label} at{" "}
            {data.strongestDimension.score}/20.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benchmark Comparison</Text>
          <Text style={styles.paragraph}>
            Compared with the Nigeria baseline ({data.benchmarkLocal}/100), the current
            score is {data.benchmarkGapLocal >= 0 ? "+" : ""}
            {data.benchmarkGapLocal}. Compared with the comparable UK benchmark (
            {data.benchmarkGlobal}/100), the gap is {data.benchmarkGapGlobal >= 0 ? "+" : ""}
            {data.benchmarkGapGlobal}.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dimension Breakdown</Text>
          {DIMENSION_KEYS.map((key) => (
            <View key={key} style={styles.row}>
              <Text>{DIMENSION_LABELS[key]}</Text>
              <Text style={styles.scoreText}>{data.aggregatedScores[key]}/20</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Actions</Text>
          {data.weakestDimensions.map((dimension) => (
            <View key={dimension.key} style={styles.actionItem}>
              <Text style={styles.actionTitle}>
                {dimension.label} ({dimension.score}/20)
              </Text>
              <Text style={styles.paragraph}>{dimension.recommendation}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Recommended next step: schedule an Elite Global AI strategy and training call to
          convert the assessment findings into a delivery roadmap.
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.chartPageHeader}>
          <Text style={styles.eyebrow}>Elite Global AI</Text>
          <Text style={styles.title}>Visual Readiness Breakdown</Text>
          <Text style={styles.subtitle}>
            Charts generated from the aggregated dimension scores for {data.orgName}.
          </Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Bar Chart: Dimension Performance</Text>
          <Text style={styles.chartDescription}>
            This chart compares each readiness dimension against its maximum possible
            score of 20 points.
          </Text>
          <DimensionBarChart items={chartItems} />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Pie Chart: Score Composition</Text>
          <Text style={styles.chartDescription}>
            This chart shows how the current overall readiness score is distributed
            across the five assessment dimensions.
          </Text>

          <View style={styles.pieSection}>
            <View style={styles.pieWrap}>
              <DimensionPieChart items={chartItems} />
            </View>

            <View style={styles.pieLegend}>
              {chartItems.map((item) => (
                <View key={item.key} style={styles.legendRow}>
                  <View
                    style={[
                      styles.legendSwatch,
                      {
                        backgroundColor: item.color
                      }
                    ]}
                  />
                  <View style={styles.legendTextWrap}>
                    <Text style={styles.legendTitle}>{item.label}</Text>
                    <Text style={styles.legendMeta}>
                      {item.score.toFixed(1)}/20 • {item.percentage.toFixed(1)}% of current
                      score
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.chartFootnote}>
            Overall readiness score: {data.aggregatedScores.total}/100 across{" "}
            {data.submittedRespondents} submitted responses.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
