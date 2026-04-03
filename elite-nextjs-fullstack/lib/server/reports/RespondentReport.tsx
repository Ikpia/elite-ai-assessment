import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";

import type { RespondentReportData, RoleLevel } from "../types/assessment";

const COLORS = {
  navy: "#1A3C6E",
  blue: "#2563EB",
  lightBlue: "#DBEAFE",
  lighterBlue: "#EFF6FF",
  slate: "#475569",
  dark: "#0F172A",
  line: "#CBD5E1",
  white: "#FFFFFF"
} as const;

const MAX_DIMENSION_SCORE = 20;

function resolveReportLogo(): string | null {
  const logoPath = join(process.cwd(), "public", "brand", "elite-global-ai-icon.png");

  if (!existsSync(logoPath)) {
    return null;
  }

  const logoBase64 = readFileSync(logoPath).toString("base64");
  return `data:image/png;base64,${logoBase64}`;
}

function formatRole(role: RoleLevel): string {
  return role
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingRight: 34,
    paddingBottom: 34,
    paddingLeft: 34,
    backgroundColor: COLORS.white,
    color: COLORS.dark,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  logoWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    overflow: "hidden"
  },
  logo: {
    width: 34,
    height: 34,
    objectFit: "cover"
  },
  brandTextWrap: {
    marginLeft: 10
  },
  brandText: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  brandSubText: {
    marginTop: 2,
    color: COLORS.slate,
    fontSize: 8.8,
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.lightBlue,
    backgroundColor: COLORS.lighterBlue,
    paddingTop: 6,
    paddingRight: 12,
    paddingBottom: 6,
    paddingLeft: 12,
    color: COLORS.blue,
    fontSize: 9.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  title: {
    marginTop: 24,
    color: COLORS.dark,
    fontSize: 25,
    fontWeight: 700,
    lineHeight: 1.15
  },
  subtitle: {
    marginTop: 8,
    color: COLORS.slate,
    fontSize: 11,
    lineHeight: 1.6
  },
  summaryCard: {
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightBlue,
    backgroundColor: COLORS.lighterBlue,
    paddingTop: 16,
    paddingRight: 18,
    paddingBottom: 16,
    paddingLeft: 18
  },
  summaryText: {
    color: COLORS.dark,
    fontSize: 11,
    lineHeight: 1.65
  },
  metricsGrid: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  metricCard: {
    width: "31.5%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    paddingTop: 14,
    paddingRight: 14,
    paddingBottom: 14,
    paddingLeft: 14
  },
  metricLabel: {
    color: COLORS.slate,
    fontSize: 8.8,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  metricValue: {
    marginTop: 6,
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.2
  },
  metricHint: {
    marginTop: 4,
    color: COLORS.slate,
    fontSize: 10,
    lineHeight: 1.4
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: 700
  },
  dimensionRow: {
    marginBottom: 12
  },
  dimensionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  dimensionLabel: {
    color: COLORS.dark,
    fontSize: 10.6,
    fontWeight: 700,
    maxWidth: "80%"
  },
  dimensionValue: {
    color: COLORS.slate,
    fontSize: 9.5,
    fontWeight: 700
  },
  dimensionTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.lightBlue,
    overflow: "hidden"
  },
  dimensionFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.blue
  },
  dimensionRecommendation: {
    marginTop: 4,
    color: COLORS.slate,
    fontSize: 9.5,
    lineHeight: 1.5
  },
  footer: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.line
  },
  footerText: {
    color: COLORS.slate,
    fontSize: 9.6,
    lineHeight: 1.55
  }
});

export function RespondentReport({ data }: { data: RespondentReportData }) {
  const logo = resolveReportLogo();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            {logo ? (
              <View style={styles.logoWrap}>
                <Image src={logo} style={styles.logo} />
              </View>
            ) : null}
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandText}>Elite Global AI</Text>
              <Text style={styles.brandSubText}>Respondent Report</Text>
            </View>
          </View>

          <Text style={styles.badge}>Personal Result</Text>
        </View>

        <Text style={styles.title}>Your AI Readiness Result</Text>
        <Text style={styles.subtitle}>
          This report reflects only your submitted responses for {data.orgName}. It does not include the organisation-wide summary or other respondents' results.
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{data.personalSummary}</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Your Score</Text>
            <Text style={styles.metricValue}>{data.totalScore}/100</Text>
            <Text style={styles.metricHint}>{data.readinessLevel}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Respondent</Text>
            <Text style={styles.metricValue}>{data.respondentName}</Text>
            <Text style={styles.metricHint}>
              {formatRole(data.respondentRole)}{data.respondentDept ? ` · ${data.respondentDept}` : ""}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Submitted</Text>
            <Text style={styles.metricValue}>{formatDate(data.submittedAt)}</Text>
            <Text style={styles.metricHint}>Generated {formatDate(data.generatedAt)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dimension Breakdown</Text>
        {data.dimensionInsights.map((dimension) => (
          <View key={dimension.key} style={styles.dimensionRow}>
            <View style={styles.dimensionHeader}>
              <Text style={styles.dimensionLabel}>{dimension.label}</Text>
              <Text style={styles.dimensionValue}>{dimension.score}/20</Text>
            </View>
            <View style={styles.dimensionTrack}>
              <View
                style={{
                  ...styles.dimensionFill,
                  width: `${(dimension.score / MAX_DIMENSION_SCORE) * 100}%`
                }}
              />
            </View>
            <Text style={styles.dimensionRecommendation}>{dimension.recommendation}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need help interpreting your personal result? Contact {data.contact.name} ({data.contact.role}) at {data.contact.email} or visit {data.contact.website}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}