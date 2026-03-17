import {
  View, Text, ScrollView, StyleSheet, StatusBar, Dimensions,
} from "react-native";
import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { useRecords } from "../../hooks/useRecords";
import { useProfile } from "../../hooks/useProfile";
import { useLogData } from "../../hooks/useLogData";
import { calcDailyTarget } from "../../lib/bmr";
import { last30Days, formatNum, avg } from "../../lib/stats";
import { format, parseISO } from "date-fns";
import { radius, shadow, shadowSm } from "../../lib/theme";
import Svg, { Polyline, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, Polygon } from "react-native-svg";

const SCREEN_W = Dimensions.get("window").width;
const CHART_W = SCREEN_W - 40; // 20px padding each side

// ── Progress Ring ──────────────────────────────────────────
function ProgressRing({ value, goal, label, color, size = 130 }: {
  value: number; goal: number; label: string; color: string; size?: number;
}) {
  const { colors } = useTheme();
  const pct  = Math.min(value / Math.max(goal, 1), 1);
  const R    = (size - 24) / 2;
  const cx   = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * R;
  const dash = pct * circ;

  return (
    <View style={ring.wrap}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={R} fill="none" stroke={colors.surface2} strokeWidth={8} />
        {pct > 0 && (
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`} />
        )}
        <SvgText x={cx} y={cy - 10} textAnchor="middle" fontFamily="LoraBold" fontSize={20} fill={colors.text}>
          {value > 0 ? Math.round(value).toLocaleString() : "—"}
        </SvgText>
        <SvgText x={cx - 14} y={cy + 8} textAnchor="middle" fontFamily="Inter" fontSize={9} fill={colors.text2}>
          {"of"}
        </SvgText>
        <SvgText x={cx + 10} y={cy + 8} textAnchor="middle" fontFamily="Inter" fontSize={9} fill={colors.text2}>
          {Math.round(goal).toLocaleString()}
        </SvgText>
      </Svg>
      <Text style={[ring.label, { color: colors.text2 }]}>{label}</Text>
      <View style={[ring.badge, { backgroundColor: pct >= 1 ? colors.success + "22" : color + "22" }]}>
        <Text style={[ring.pct, { color: pct >= 1 ? colors.success : color }]}>{Math.round(pct * 100)}%</Text>
      </View>
    </View>
  );
}
const ring = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", gap: 6 },
  label: { fontFamily: "Inter", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  badge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  pct: { fontFamily: "InterMedium", fontSize: 12 },
});

// ── Line Chart ─────────────────────────────────────────────
function LineChart({ data, color, height = 180 }: {
  data: { label: string; value: number | null }[]; color: string; height?: number;
}) {
  const { colors } = useTheme();
  const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
  const W = CHART_W;
  const cW = W - PAD.left - PAD.right;
  const cH = height - PAD.top - PAD.bottom;

  const defined = data.filter(d => d.value != null);
  if (defined.length < 2) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.text2, fontFamily: "Inter", fontSize: 13, fontStyle: "italic" }}>
          Not enough data yet
        </Text>
      </View>
    );
  }

  const values = defined.map(d => d.value as number);
  const minVal = Math.min(...values), maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * cW;
  const toY = (v: number) => PAD.top + cH - ((v - minVal) / range) * cH;

  const segments: string[][] = [];
  let cur: string[] = [];
  data.forEach((d, i) => {
    if (d.value != null) { cur.push(`${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`); }
    else { if (cur.length > 1) segments.push(cur); cur = []; }
  });
  if (cur.length > 1) segments.push(cur);

  const areaSegs = segments.map(pts => {
    const [fx] = pts[0].split(",");
    const [lx] = pts[pts.length - 1].split(",");
    const base = (PAD.top + cH).toFixed(1);
    return [...pts, `${lx},${base}`, `${fx},${base}`].join(" ");
  });

  const showEvery = data.length > 20 ? 7 : data.length > 10 ? 4 : 2;
  const gradId = `g_${color.replace("#", "")}`;

  return (
    <Svg width={W} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.2" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {[0, 0.5, 1].map(pct => {
        const y = PAD.top + cH * (1 - pct);
        return (
          <View key={pct}>
            <Line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke={colors.surface2} strokeWidth={1} strokeDasharray="4,4" />
            <SvgText x={PAD.left - 6} y={y + 4} fontSize={9} fill={colors.text2} textAnchor="end" fontFamily="Inter">
              {Math.round(minVal + range * pct).toLocaleString()}
            </SvgText>
          </View>
        );
      })}
      {areaSegs.map((pts, i) => <Polygon key={i} points={pts} fill={`url(#${gradId})`} stroke="none" />)}
      {segments.map((pts, i) => (
        <Polyline key={i} points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {data.map((d, i) => d.value != null
        ? <Circle key={i} cx={toX(i)} cy={toY(d.value)} r={3} fill={colors.surface} stroke={color} strokeWidth={2} />
        : null
      )}
      {data.map((d, i) => i % showEvery === 0
        ? <SvgText key={i} x={toX(i)} y={height - 6} fontSize={9} fill={colors.text2} textAnchor="middle" fontFamily="Inter">{d.label}</SvgText>
        : null
      )}
    </Svg>
  );
}

// ── Chart card ─────────────────────────────────────────────
function ChartCard({ color, title, subtitle, children, stats }: {
  color: string; title: string; subtitle: string;
  children: React.ReactNode;
  stats?: { label: string; value: string }[];
}) {
  const { colors } = useTheme();
  return (
    <View style={[cc.card, { backgroundColor: colors.surface }, shadowSm]}>
      <View style={cc.header}>
        <View style={[cc.dot, { backgroundColor: color }]} />
        <View>
          <Text style={[cc.title, { color: colors.text }]}>{title}</Text>
          <Text style={[cc.sub, { color: colors.text2 }]}>{subtitle}</Text>
        </View>
      </View>
      <View style={{ paddingBottom: 8 }}>{children}</View>
      {stats && stats.length > 0 && (
        <View style={[cc.statsRow, { borderTopColor: colors.surface2 }]}>
          {stats.map(({ label, value }, i) => (
            <View key={label} style={[cc.stat, i > 0 && { borderLeftColor: colors.surface2, borderLeftWidth: 1 }]}>
              <Text style={[cc.statVal, { color: color }]}>{value}</Text>
              <Text style={[cc.statLbl, { color: colors.text2 }]}>{label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const cc = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: "hidden", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, paddingBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  title: { fontFamily: "InterMedium", fontSize: 15 },
  sub: { fontFamily: "Inter", fontSize: 12, marginTop: 1 },
  statsRow: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 10 },
  stat: { flex: 1, alignItems: "center", paddingVertical: 4 },
  statVal: { fontFamily: "LoraBold", fontSize: 18 },
  statLbl: { fontFamily: "Inter", fontSize: 11, marginTop: 1 },
});

// ── Main screen ────────────────────────────────────────────
export default function ChartsScreen() {
  const { colors, scheme } = useTheme();
  const { records, loading, refresh } = useRecords();
  const { profile } = useProfile();
  const today = format(new Date(), "yyyy-MM-dd");
  const logData = useLogData(today);
  const todayRecord = records.find(r => r.date === today) ?? null;

  useFocusEffect(useCallback(() => { refresh(); logData.refresh(); }, [refresh]));

  const recent = last30Days(records);
  const mkData = (key: "calories" | "steps" | "weight") =>
    recent.map(r => ({ label: format(parseISO(r.date), "d"), value: r[key] != null ? Number(r[key]) : null }));

  const avgCals  = avg(recent.map(r => r.calories));
  const avgSteps = avg(recent.map(r => r.steps));
  const weights  = recent.filter(r => r.weight != null).map(r => Number(r.weight));
  const minW = weights.length ? Math.min(...weights) : null;
  const maxW = weights.length ? Math.max(...weights) : null;

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />

      <View style={[s.header, { backgroundColor: colors.bg }]}>
        <Text style={[s.title, { color: colors.text }]}>Charts</Text>
        <View style={[s.badge, { backgroundColor: colors.surface }]}>
          <Text style={[s.badgeTxt, { color: colors.text2 }]}>{recent.length} days</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}><Text style={[s.msg, { color: colors.text2, fontStyle: "italic" }]}>Loading…</Text></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>

          {/* Progress rings */}
          <View style={[s.ringsCard, { backgroundColor: colors.surface }, shadowSm]}>
            <Text style={[s.ringsTitle, { color: colors.text2 }]}>Today's progress</Text>
            <View style={s.rings}>
              <ProgressRing
                value={logData.totalFoodCals}
                goal={profile ? calcDailyTarget(profile, todayRecord?.steps ?? null) : 2000}
                label="Calories"
                color={colors.accent}
              />
              <ProgressRing
                value={todayRecord?.steps ?? 0}
                goal={10000}
                label="Steps"
                color={colors.accent3}
              />
            </View>
          </View>

          {recent.length < 2 ? (
            <Text style={[s.msg, { color: colors.text2, fontStyle: "italic", textAlign: "center", marginTop: 20 }]}>
              Log a few more entries to see charts
            </Text>
          ) : (
            <>
              <ChartCard color={colors.accent} title="Calories" subtitle="kcal per day · last 30 days"
                stats={[{ label: "Average", value: `${formatNum(avgCals)} kcal` }, { label: "Days logged", value: mkData("calories").filter(d => d.value).length.toString() }]}>
                <LineChart data={mkData("calories")} color={colors.accent} />
              </ChartCard>

              <ChartCard color={colors.accent3} title="Steps" subtitle="steps per day · last 30 days"
                stats={[{ label: "Average", value: formatNum(avgSteps) }, { label: "Days logged", value: mkData("steps").filter(d => d.value).length.toString() }]}>
                <LineChart data={mkData("steps")} color={colors.accent3} />
              </ChartCard>

              <ChartCard color={colors.accent2} title="Weight" subtitle="kg · last 30 days"
                stats={weights.length >= 2 ? [{ label: "Min", value: `${minW?.toFixed(1)} kg` }, { label: "Max", value: `${maxW?.toFixed(1)} kg` }, { label: "Change", value: `${((maxW ?? 0) - (minW ?? 0)).toFixed(1)} kg` }] : []}>
                <LineChart data={mkData("weight")} color={colors.accent2} />
              </ChartCard>
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { fontFamily: "LoraBold", fontSize: 28 },
  badge: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  badgeTxt: { fontFamily: "Inter", fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  msg: { fontFamily: "Inter", fontSize: 14 },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  ringsCard: { borderRadius: radius.lg, padding: 20, marginBottom: 16 },
  ringsTitle: { fontFamily: "Inter", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 16, textAlign: "center" },
  rings: { flexDirection: "row", gap: 16 },
});
