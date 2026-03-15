import {
  View, Text, ScrollView, StyleSheet, StatusBar, Dimensions,
} from "react-native";
import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { useRecords } from "../../hooks/useRecords";
import { last30Days, formatNum, avg } from "../../lib/stats";
import { format, parseISO } from "date-fns";
import Svg, { Polyline, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, Polygon } from "react-native-svg";

const SCREEN_W = Dimensions.get("window").width;
const CHART_W  = SCREEN_W - 32;

// ── Line chart (used for all metrics) ─────────────────────
function LineChart({
  data, color, height = 180, unit = "",
}: {
  data: { label: string; value: number | null }[];
  color: string;
  height?: number;
  unit?: string;
}) {
  const { colors } = useTheme();
  const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
  const W = CHART_W - 8;
  const cW = W - PAD.left - PAD.right;
  const cH = height - PAD.top - PAD.bottom;

  const defined = data.filter(d => d.value != null);
  if (defined.length < 2) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.text2, fontFamily: "SpaceMono", fontSize: 11 }}>
          // need at least 2 data points
        </Text>
      </View>
    );
  }

  const values = defined.map(d => d.value as number);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range  = maxVal - minVal || 1;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * cW;
  const toY = (v: number)  => PAD.top  + cH - ((v - minVal) / range) * cH;

  // Split into continuous segments at nulls
  const segments: string[][] = [];
  let cur: string[] = [];
  data.forEach((d, i) => {
    if (d.value != null) {
      cur.push(`${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`);
    } else {
      if (cur.length > 1) segments.push(cur);
      cur = [];
    }
  });
  if (cur.length > 1) segments.push(cur);

  // Area fill points (close polygon below the line)
  const areaSegments = segments.map(pts => {
    const first = pts[0];
    const last  = pts[pts.length - 1];
    const [fx]  = first.split(",");
    const [lx]  = last.split(",");
    const base  = (PAD.top + cH).toFixed(1);
    return [...pts, `${lx},${base}`, `${fx},${base}`].join(" ");
  });

  const showEvery = data.length > 20 ? 7 : data.length > 10 ? 4 : 2;
  const gradId    = `grad_${color.replace("#","")}`;

  return (
    <Svg width={W} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.25" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {[0, 0.5, 1].map(pct => {
        const y = PAD.top + cH * (1 - pct);
        const v = minVal + range * pct;
        return (
          <View key={pct}>
            <Line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke={colors.surface2} strokeWidth={1} strokeDasharray="3,4" />
            <SvgText x={PAD.left - 4} y={y + 4} fontSize={8}
              fill={colors.text2} textAnchor="end" fontFamily="SpaceMono">
              {Math.round(v).toLocaleString()}
            </SvgText>
          </View>
        );
      })}

      {/* Area fills */}
      {areaSegments.map((pts, i) => (
        <Polygon key={i} points={pts} fill={`url(#${gradId})`} stroke="none" />
      ))}

      {/* Lines */}
      {segments.map((pts, i) => (
        <Polyline key={i} points={pts.join(" ")}
          fill="none" stroke={color} strokeWidth={2.5}
          strokeLinecap="round" strokeLinejoin="round" />
      ))}

      {/* Dots at each defined point */}
      {data.map((d, i) =>
        d.value != null ? (
          <Circle key={i} cx={toX(i)} cy={toY(d.value)} r={3}
            fill={color} stroke={colors.border} strokeWidth={1.5} />
        ) : null
      )}

      {/* X-axis labels */}
      {data.map((d, i) =>
        i % showEvery === 0 ? (
          <SvgText key={i} x={toX(i)} y={height - 6}
            fontSize={8} fill={colors.text2} textAnchor="middle" fontFamily="SpaceMono">
            {d.label}
          </SvgText>
        ) : null
      )}
    </Svg>
  );
}

// ── Chart card wrapper ─────────────────────────────────────
function ChartCard({
  color, title, subtitle, children, stats,
}: {
  color: string; title: string; subtitle: string;
  children: React.ReactNode;
  stats?: { label: string; value: string }[];
}) {
  const { colors } = useTheme();
  return (
    <View style={[cc.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[cc.header, { borderBottomColor: colors.border }]}>
        <View style={[cc.dot, { backgroundColor: color, borderColor: colors.border }]} />
        <View>
          <Text style={[cc.title, { color: colors.text2 }]}>{title.toUpperCase()}</Text>
          <Text style={[cc.sub, { color: colors.text2 }]}>{subtitle}</Text>
        </View>
      </View>
      <View style={cc.chartArea}>{children}</View>
      {stats && stats.length > 0 && (
        <View style={[cc.statsRow, { borderTopColor: colors.border, backgroundColor: colors.surface2 }]}>
          {stats.map(({ label, value }, i) => (
            <View key={label} style={[cc.statItem, i > 0 && { borderLeftColor: colors.border, borderLeftWidth: 2 }]}>
              <Text style={[cc.statLbl, { color: colors.text2 }]}>{label}</Text>
              <Text style={[cc.statVal, { color: color }]}>{value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const cc = StyleSheet.create({
  card: { borderWidth: 2, overflow: "hidden", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderBottomWidth: 2 },
  dot: { width: 12, height: 12, borderWidth: 2 },
  title: { fontFamily: "SpaceMono", fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  sub: { fontFamily: "SpaceMono", fontSize: 9, marginTop: 1 },
  chartArea: { paddingVertical: 10, paddingLeft: 4, paddingRight: 10 },
  statsRow: { flexDirection: "row", borderTopWidth: 2 },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  statLbl: { fontFamily: "SpaceMono", fontSize: 9, letterSpacing: 1 },
  statVal: { fontFamily: "BebasNeue", fontSize: 22, lineHeight: 24 },
});

// ── Main screen ────────────────────────────────────────────
export default function ChartsScreen() {
  const { colors, scheme } = useTheme();
  const { records, loading, refresh } = useRecords();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const recent = last30Days(records);

  const mkData = (key: "calories" | "steps" | "weight") =>
    recent.map(r => ({
      label: format(parseISO(r.date), "d"),
      value: r[key] != null ? Number(r[key]) : null,
    }));

  const calData    = mkData("calories");
  const stepsData  = mkData("steps");
  const weightData = mkData("weight");

  const avgCals   = avg(recent.map(r => r.calories));
  const avgSteps  = avg(recent.map(r => r.steps));
  const weights   = recent.filter(r => r.weight != null).map(r => Number(r.weight));
  const minW      = weights.length ? Math.min(...weights) : null;
  const maxW      = weights.length ? Math.max(...weights) : null;

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />

      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.text }]}>CHARTS</Text>
        <View style={[s.badge, { backgroundColor: colors.accent2, borderColor: colors.border }]}>
          <Text style={s.badgeText}>{recent.length} PTS · 30D</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <Text style={[s.bigMsg, { color: colors.text2 }]}>LOADING…</Text>
        </View>
      ) : recent.length < 2 ? (
        <View style={s.center}>
          <Text style={[s.bigMsg, { color: colors.text2 }]}>NOT ENOUGH DATA</Text>
          <Text style={[s.smallMsg, { color: colors.text2 }]}>// log at least 2 entries</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>

          <ChartCard
            color={colors.accent} title="Calories" subtitle="kcal / day · last 30 days"
            stats={[
              { label: "AVG", value: `${formatNum(avgCals)} kcal` },
              { label: "DAYS LOGGED", value: calData.filter(d => d.value).length.toString() },
            ]}
          >
            <LineChart data={calData} color={colors.accent} />
          </ChartCard>

          <ChartCard
            color={colors.accent3} title="Steps" subtitle="steps / day · last 30 days"
            stats={[
              { label: "AVG", value: formatNum(avgSteps) },
              { label: "DAYS LOGGED", value: stepsData.filter(d => d.value).length.toString() },
            ]}
          >
            <LineChart data={stepsData} color={colors.accent3} />
          </ChartCard>

          <ChartCard
            color={colors.accent2} title="Weight" subtitle="kg · last 30 days"
            stats={weights.length >= 2 ? [
              { label: "MIN", value: `${minW?.toFixed(1)} kg` },
              { label: "MAX", value: `${maxW?.toFixed(1)} kg` },
              { label: "CHANGE", value: `${((maxW ?? 0) - (minW ?? 0)).toFixed(1)} kg` },
            ] : []}
          >
            <LineChart data={weightData} color={colors.accent2} />
          </ChartCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 3,
  },
  title: { fontFamily: "BebasNeue", fontSize: 32, letterSpacing: 2 },
  badge: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: "SpaceMono", fontSize: 10, fontWeight: "700", color: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  bigMsg: { fontFamily: "BebasNeue", fontSize: 28, letterSpacing: 2 },
  smallMsg: { fontFamily: "SpaceMono", fontSize: 11 },
  scroll: { padding: 16 },
});
