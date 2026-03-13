import {
  View, Text, ScrollView, StyleSheet, StatusBar, Dimensions,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useRecords } from "../../hooks/useRecords";
import { last30Days, formatNum, avg } from "../../lib/stats";
import { shadow } from "../../lib/theme";
import { format, parseISO } from "date-fns";
import Svg, { Rect, Polyline, Circle, Line, Text as SvgText } from "react-native-svg";

const SCREEN_W = Dimensions.get("window").width;
const CHART_W = SCREEN_W - 32; // 16px padding each side

// ── Reusable chart header ────────────────────────────────────
function ChartHeader({ color, title, subtitle }: { color: string; title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chartHeader, { borderBottomColor: colors.border }]}>
      <View style={[styles.colorDot, { backgroundColor: color, borderColor: colors.border }]} />
      <View>
        <Text style={[styles.chartTitle, { color: colors.text2 }]}>{title.toUpperCase()}</Text>
        {subtitle && <Text style={[styles.chartSubtitle, { color: colors.text2 }]}>{subtitle}</Text>}
      </View>
    </View>
  );
}

// ── Bar Chart ────────────────────────────────────────────────
function BarChart({
  data, color, height = 160,
}: {
  data: { label: string; value: number | null }[];
  color: string;
  height?: number;
}) {
  const { colors } = useTheme();
  const PAD = { top: 10, right: 12, bottom: 28, left: 38 };
  const chartW = CHART_W - PAD.left - PAD.right - 8;
  const chartH = height - PAD.top - PAD.bottom;

  const values = data.map(d => d.value ?? 0);
  const maxVal = Math.max(...values, 1);
  const barW = Math.max(3, chartW / data.length - 2);
  const gap = chartW / data.length;
  const showEvery = data.length > 20 ? 7 : data.length > 10 ? 4 : 2;

  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <Svg width={CHART_W - 8} height={height}>
      {/* Grid */}
      {gridLines.map(pct => {
        const y = PAD.top + chartH * (1 - pct);
        return (
          <Line key={pct} x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y}
            stroke={colors.surface2} strokeWidth={1} strokeDasharray="3,4" />
        );
      })}
      {/* Y labels */}
      {gridLines.map(pct => (
        <SvgText key={pct}
          x={PAD.left - 4} y={PAD.top + chartH * (1 - pct) + 4}
          fontSize={8} fill={colors.text2} textAnchor="end" fontFamily="SpaceMono"
        >
          {Math.round(maxVal * pct).toLocaleString()}
        </SvgText>
      ))}
      {/* Bars */}
      {data.map((d, i) => {
        const barH = d.value != null ? Math.max(2, (d.value / maxVal) * chartH) : 0;
        const x = PAD.left + i * gap + (gap - barW) / 2;
        const y = PAD.top + chartH - barH;
        return (
          <Rect key={i} x={x} y={y} width={barW} height={barH}
            fill={d.value != null ? color : "transparent"}
            stroke={d.value != null ? colors.border : "none"}
            strokeWidth={1} />
        );
      })}
      {/* X labels */}
      {data.map((d, i) =>
        i % showEvery === 0 ? (
          <SvgText key={i}
            x={PAD.left + i * gap + gap / 2} y={height - 6}
            fontSize={8} fill={colors.text2} textAnchor="middle" fontFamily="SpaceMono"
          >
            {d.label}
          </SvgText>
        ) : null
      )}
    </Svg>
  );
}

// ── Line Chart ───────────────────────────────────────────────
function LineChart({
  data, color, height = 160,
}: {
  data: { label: string; value: number | null }[];
  color: string;
  height?: number;
}) {
  const { colors } = useTheme();
  const PAD = { top: 14, right: 12, bottom: 28, left: 42 };
  const chartW = CHART_W - PAD.left - PAD.right - 8;
  const chartH = height - PAD.top - PAD.bottom;

  const defined = data.filter(d => d.value != null);
  if (defined.length < 2) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.text2, fontFamily: "SpaceMono", fontSize: 11 }}>
          // not enough data
        </Text>
      </View>
    );
  }

  const values = defined.map(d => d.value as number);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - minVal) / range) * chartH;

  // Build polyline points — skip nulls
  const segments: string[][] = [];
  let current: string[] = [];
  data.forEach((d, i) => {
    if (d.value != null) {
      current.push(`${toX(i)},${toY(d.value)}`);
    } else {
      if (current.length > 1) segments.push(current);
      current = [];
    }
  });
  if (current.length > 1) segments.push(current);

  const showEvery = data.length > 20 ? 7 : data.length > 10 ? 4 : 2;

  return (
    <Svg width={CHART_W - 8} height={height}>
      {/* Grid */}
      {[0, 0.5, 1].map(pct => {
        const y = PAD.top + chartH * (1 - pct);
        return (
          <Line key={pct} x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y}
            stroke={colors.surface2} strokeWidth={1} strokeDasharray="3,4" />
        );
      })}
      {/* Y labels */}
      {[0, 0.5, 1].map(pct => {
        const v = minVal + range * pct;
        return (
          <SvgText key={pct}
            x={PAD.left - 4} y={PAD.top + chartH * (1 - pct) + 4}
            fontSize={8} fill={colors.text2} textAnchor="end" fontFamily="SpaceMono"
          >
            {v.toFixed(1)}
          </SvgText>
        );
      })}
      {/* Lines */}
      {segments.map((pts, si) => (
        <Polyline key={si} points={pts.join(" ")}
          fill="none" stroke={color} strokeWidth={2.5}
          strokeLinecap="square" strokeLinejoin="miter" />
      ))}
      {/* Dots */}
      {data.map((d, i) =>
        d.value != null ? (
          <Circle key={i} cx={toX(i)} cy={toY(d.value)} r={3}
            fill={color} stroke={colors.border} strokeWidth={1.5} />
        ) : null
      )}
      {/* X labels */}
      {data.map((d, i) =>
        i % showEvery === 0 ? (
          <SvgText key={i}
            x={toX(i)} y={height - 6}
            fontSize={8} fill={colors.text2} textAnchor="middle" fontFamily="SpaceMono"
          >
            {d.label}
          </SvgText>
        ) : null
      )}
    </Svg>
  );
}

// ── Summary strip ────────────────────────────────────────────
function SummaryRow({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.summaryRow, { borderBottomColor: colors.surface2 }]}>
      <View style={[styles.summaryDot, { backgroundColor: color, borderColor: colors.border }]} />
      <Text style={[styles.summaryLabel, { color: colors.text2 }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────
export default function ChartsScreen() {
  const { colors, scheme } = useTheme();
  const { records, loading, refresh } = useRecords();

  // Refresh data whenever this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const recent = last30Days(records);

  const calData = recent.map(r => ({
    label: format(parseISO(r.date), "d"),
    value: r.calories,
  }));

  const stepsData = recent.map(r => ({
    label: format(parseISO(r.date), "d"),
    value: r.steps,
  }));

  const weightData = recent.map(r => ({
    label: format(parseISO(r.date), "d"),
    value: r.weight != null ? Number(r.weight) : null,
  }));

  // Stats for summary strip
  const avgCals  = avg(recent.map(r => r.calories));
  const avgSteps = avg(recent.map(r => r.steps));
  const weights  = recent.filter(r => r.weight != null).map(r => Number(r.weight));
  const minW = weights.length ? Math.min(...weights) : null;
  const maxW = weights.length ? Math.max(...weights) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>CHARTS</Text>
          <Text style={[styles.subtitle, { color: colors.text2 }]}>LAST 30 DAYS</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.accent2, borderColor: colors.border }]}>
          <Text style={styles.badgeText}>{recent.length} PTS</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <Text style={[styles.loadingText, { color: colors.text2 }]}>LOADING…</Text>
        </View>
      ) : recent.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyTitle, { color: colors.text2 }]}>NO DATA YET</Text>
          <Text style={[styles.emptyHint, { color: colors.text2 }]}>// log entries to see charts</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* ── Calories chart ────────────────────────── */}
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ChartHeader color={colors.accent} title="Daily Calories" subtitle="kcal / day" />
            <View style={styles.chartBody}>
              <BarChart data={calData} color={colors.accent} />
            </View>
            <View style={[styles.statStrip, { borderTopColor: colors.border, backgroundColor: colors.surface2 }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text2 }]}>AVG</Text>
                <Text style={[styles.statVal, { color: colors.accent }]}>{formatNum(avgCals)} kcal</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text2 }]}>DAYS</Text>
                <Text style={[styles.statVal, { color: colors.accent }]}>{calData.filter(d => d.value).length}</Text>
              </View>
            </View>
          </View>

          {/* ── Steps chart ───────────────────────────── */}
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ChartHeader color={colors.accent3} title="Daily Steps" subtitle="steps / day" />
            <View style={styles.chartBody}>
              <BarChart data={stepsData} color={colors.accent3} />
            </View>
            <View style={[styles.statStrip, { borderTopColor: colors.border, backgroundColor: colors.surface2 }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text2 }]}>AVG</Text>
                <Text style={[styles.statVal, { color: colors.accent3 }]}>{formatNum(avgSteps)}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.text2 }]}>DAYS</Text>
                <Text style={[styles.statVal, { color: colors.accent3 }]}>{stepsData.filter(d => d.value).length}</Text>
              </View>
            </View>
          </View>

          {/* ── Weight chart ──────────────────────────── */}
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ChartHeader color={colors.accent2} title="Weight Trend" subtitle="kg · connect-the-dots" />
            <View style={styles.chartBody}>
              <LineChart data={weightData} color={colors.accent2} />
            </View>
            {weights.length >= 2 && (
              <View style={[styles.statStrip, { borderTopColor: colors.border, backgroundColor: colors.surface2 }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.text2 }]}>MIN</Text>
                  <Text style={[styles.statVal, { color: colors.accent2 }]}>{minW?.toFixed(1)} kg</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.text2 }]}>MAX</Text>
                  <Text style={[styles.statVal, { color: colors.accent2 }]}>{maxW?.toFixed(1)} kg</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.text2 }]}>CHANGE</Text>
                  <Text style={[styles.statVal, { color: (maxW! - minW!) > 0 ? colors.danger : colors.success }]}>
                    {(maxW! - minW!).toFixed(1)} kg
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ── 30-day summary ───────────────────────── */}
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ChartHeader color={colors.text2} title="30-Day Summary" />
            <SummaryRow label="Avg Daily Calories" value={`${formatNum(avgCals)} kcal`} color={colors.accent} />
            <SummaryRow label="Avg Daily Steps" value={formatNum(avgSteps)} color={colors.accent3} />
            <SummaryRow label="Weight Min" value={minW ? `${minW.toFixed(1)} kg` : "—"} color={colors.accent2} />
            <SummaryRow label="Weight Max" value={maxW ? `${maxW.toFixed(1)} kg` : "—"} color={colors.accent2} />
            <SummaryRow label="Days Logged" value={String(recent.length)} color={colors.text2} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: 3,
  },
  title: { fontFamily: "BebasNeue", fontSize: 32, letterSpacing: 2, lineHeight: 34 },
  subtitle: { fontFamily: "SpaceMono", fontSize: 10, letterSpacing: 1 },
  badge: {
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: "SpaceMono", fontSize: 10, fontWeight: "700", color: "#000" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontFamily: "BebasNeue", fontSize: 28, letterSpacing: 2 },
  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle: { fontFamily: "BebasNeue", fontSize: 32 },
  emptyHint: { fontFamily: "SpaceMono", fontSize: 11 },
  scroll: { padding: 16 },
  chartCard: {
    borderWidth: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  colorDot: { width: 12, height: 12, borderWidth: 2 },
  chartTitle: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  chartSubtitle: { fontFamily: "SpaceMono", fontSize: 9, marginTop: 1 },
  chartBody: { padding: 10, paddingLeft: 4 },
  statStrip: {
    flexDirection: "row",
    borderTopWidth: 2,
    paddingVertical: 10,
  },
  statItem: { flex: 1, alignItems: "center" },
  statLabel: { fontFamily: "SpaceMono", fontSize: 9, letterSpacing: 1 },
  statVal: { fontFamily: "BebasNeue", fontSize: 20, lineHeight: 22 },
  statDivider: { width: 2 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  summaryDot: { width: 10, height: 10, borderWidth: 2 },
  summaryLabel: { fontFamily: "SpaceMono", fontSize: 10, flex: 1 },
  summaryValue: { fontFamily: "BebasNeue", fontSize: 18 },
});
