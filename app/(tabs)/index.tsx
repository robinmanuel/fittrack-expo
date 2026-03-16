import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useRecords } from "../../hooks/useRecords";
import { useProfile } from "../../hooks/useProfile";
import { useLogData } from "../../hooks/useLogData";
import {
  calcBMR, calcTDEE, calcDailyTarget,
  calcGoalDate, calcWeeksToGoal, stepsToKcal,
} from "../../lib/bmr";
import { shadow, shadowSm } from "../../lib/theme";
import LogEntryModal from "../../components/LogEntryModal";
import AddFoodModal from "../../components/AddFoodModal";
import LogChoiceModal from "../../components/LogChoiceModal";
import { NewRecord } from "../../lib/types";
import { format, subDays, eachDayOfInterval } from "date-fns";

// ── Helpers ────────────────────────────────────────────────
function StatPill({
  label, value, color,
}: { label: string; value: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[pill.wrap, { backgroundColor: colors.surface, borderColor: colors.border }, shadowSm]}>
      <View style={[pill.bar, { backgroundColor: color }]} />
      <View style={pill.body}>
        <Text style={[pill.label, { color: colors.text2 }]}>{label}</Text>
        <Text style={[pill.value, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}
const pill = StyleSheet.create({
  wrap: { flex: 1, borderWidth: 2, overflow: "hidden" },
  bar: { height: 4 },
  body: { padding: 12 },
  label: { fontFamily: "SpaceMono", fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  value: { fontFamily: "BebasNeue", fontSize: 28, lineHeight: 30 },
});

// ── Heatmap ────────────────────────────────────────────────
function Heatmap({ records }: { records: Array<{ date: string; steps: number | null }> }) {
  const { colors } = useTheme();
  const today = new Date();
  const startDay = subDays(today, 83);
  const days = eachDayOfInterval({ start: startDay, end: today });

  const stepsMap: Record<string, number> = {};
  records.forEach(r => { if (r.steps) stepsMap[r.date] = r.steps; });
  const maxSteps = Math.max(...Object.values(stepsMap), 1);

  const CELL = 13, GAP = 3, WEEKS = 12;
  const cols: Date[][] = [];
  for (let w = 0; w < WEEKS; w++) cols.push(days.slice(w * 7, w * 7 + 7));

  const todayStr = format(today, "yyyy-MM-dd");

  const cellColor = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const s = stepsMap[key];
    if (!s) return colors.surface2;
    const p = Math.min(s / maxSteps, 1);
    if (p > 0.75) return colors.accent3;
    if (p > 0.5)  return colors.accent3 + "CC";
    if (p > 0.25) return colors.accent3 + "88";
    return colors.accent3 + "44";
  };

  const dayLbls = ["S","M","T","W","T","F","S"];

  return (
    <View style={[hm.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[hm.header, { borderBottomColor: colors.border }]}>
        <View style={[hm.dot, { backgroundColor: colors.accent3, borderColor: colors.border }]} />
        <Text style={[hm.title, { color: colors.text2 }]}>STEP HEATMAP</Text>
        <Text style={[hm.sub, { color: colors.text2 }]}>12 WEEKS</Text>
      </View>
      <View style={hm.body}>
        <View style={hm.dayCol}>
          {dayLbls.map((d, i) => (
            <Text key={i} style={[hm.dayLbl, { color: colors.text2, height: CELL + GAP }]}>{d}</Text>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: GAP }}>
            {cols.map((week, wi) => (
              <View key={wi} style={{ flexDirection: "column", gap: GAP }}>
                {week.map((day, di) => {
                  const key = format(day, "yyyy-MM-dd");
                  const isToday = key === todayStr;
                  return (
                    <View key={di} style={[hm.cell, {
                      width: CELL, height: CELL,
                      backgroundColor: cellColor(day),
                      borderColor: isToday ? colors.accent : "transparent",
                      borderWidth: isToday ? 1.5 : 0,
                      borderRadius: 2,
                    }]} />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={[hm.legend, { borderTopColor: colors.border }]}>
        <Text style={[hm.lgLabel, { color: colors.text2 }]}>FEW STEPS</Text>
        {(["44","88","CC",""] as string[]).map((op, i) => (
          <View key={i} style={[hm.lgCell, {
            backgroundColor: op === "" ? colors.accent3 : colors.accent3 + op,
            borderColor: colors.border,
          }]} />
        ))}
        <Text style={[hm.lgLabel, { color: colors.text2 }]}>MANY</Text>
      </View>
    </View>
  );
}
const hm = StyleSheet.create({
  card: { borderWidth: 2, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderBottomWidth: 2 },
  dot: { width: 10, height: 10, borderWidth: 2 },
  title: { fontFamily: "SpaceMono", fontSize: 10, fontWeight: "700", letterSpacing: 1.2, flex: 1 },
  sub: { fontFamily: "SpaceMono", fontSize: 9 },
  body: { flexDirection: "row", padding: 10, gap: 6 },
  dayCol: { justifyContent: "flex-start", paddingTop: 1 },
  dayLbl: { fontFamily: "SpaceMono", fontSize: 7, textAlign: "center", lineHeight: 13 },
  cell: {},
  legend: { flexDirection: "row", alignItems: "center", gap: 4, padding: 10, borderTopWidth: 1 },
  lgCell: { width: 10, height: 10, borderWidth: 1, borderRadius: 1 },
  lgLabel: { fontFamily: "SpaceMono", fontSize: 8, marginHorizontal: 2 },
});

// ── BMR & Goal section ────────────────────────────────────
function BMRSection({ stepsToday }: { stepsToday: number | null }) {
  const { colors } = useTheme();
  const { profile } = useProfile();
  if (!profile) return null;

  const bmr    = Math.round(calcBMR(profile));
  const tdee   = calcTDEE(profile, stepsToday);
  const target = calcDailyTarget(profile, stepsToday);
  const stepKcal = stepsToday ? Math.round(stepsToKcal(stepsToday, profile.weight)) : 0;
  const isLose = profile.goalDirection === "lose";

  return (
    <View style={{ gap: 10 }}>
      {/* BMR row */}
      <View style={bm.row}>
        <View style={[bm.tile, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
          <View style={[bm.tileBar, { backgroundColor: colors.accent3 }]} />
          <View style={bm.tileBody}>
            <Text style={[bm.tileLabel, { color: colors.text2 }]}>BMR</Text>
            <Text style={[bm.tileVal, { color: colors.text }]}>{bmr.toLocaleString()}</Text>
            <Text style={[bm.tileSub, { color: colors.text2 }]}>kcal at rest</Text>
          </View>
        </View>
        <View style={[bm.tile, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
          <View style={[bm.tileBar, { backgroundColor: colors.accent }]} />
          <View style={bm.tileBody}>
            <Text style={[bm.tileLabel, { color: colors.text2 }]}>TDEE TODAY</Text>
            <Text style={[bm.tileVal, { color: colors.text }]}>{tdee.toLocaleString()}</Text>
            <Text style={[bm.tileSub, { color: colors.text2 }]}>
              {stepsToday ? `+${stepKcal} from steps` : "no steps logged"}
            </Text>
          </View>
        </View>
      </View>

      {/* Daily target */}
      <View style={[bm.targetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[bm.targetBar, { backgroundColor: colors.accent2 }]} />
        <View style={bm.targetInner}>
          <Text style={[bm.targetLabel, { color: colors.text2 }]}>
            DAILY TARGET · {isLose ? "LOSE" : "GAIN"} {profile.weeklyRateKg} KG/WK
          </Text>
          <View style={bm.targetRow}>
            <Text style={[bm.targetVal, { color: colors.text }]}>{target.toLocaleString()}</Text>
            <Text style={[bm.targetUnit, { color: colors.text2 }]}>kcal</Text>
            <View style={[bm.badge, {
              backgroundColor: isLose ? colors.danger : colors.success,
              borderColor: colors.border,
            }]}>
              <Text style={bm.badgeText}>
                {isLose ? "−" : "+"}{Math.abs(tdee - target)} vs TDEE
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
const bm = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, borderWidth: 2, overflow: "hidden" },
  tileBar: { height: 5 },
  tileBody: { padding: 12 },
  tileLabel: { fontFamily: "SpaceMono", fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  tileVal: { fontFamily: "BebasNeue", fontSize: 30, lineHeight: 32 },
  tileSub: { fontFamily: "SpaceMono", fontSize: 9, marginTop: 2 },
  targetCard: { borderWidth: 2, overflow: "hidden" },
  targetBar: { height: 5 },
  targetInner: { padding: 14 },
  targetLabel: { fontFamily: "SpaceMono", fontSize: 9, letterSpacing: 1, marginBottom: 6 },
  targetRow: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  targetVal: { fontFamily: "BebasNeue", fontSize: 42, lineHeight: 44 },
  targetUnit: { fontFamily: "SpaceMono", fontSize: 13 },
  badge: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: "SpaceMono", fontSize: 10, fontWeight: "700", color: "#fff" },
});

// ── Goal Date card ─────────────────────────────────────────
function GoalDateCard() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  if (!profile) return null;

  const weeks    = calcWeeksToGoal(profile);
  const goalDate = calcGoalDate(profile);
  const diff     = Math.abs(profile.goalWeight - profile.weight).toFixed(1);
  const isLose   = profile.goalDirection === "lose";

  return (
    <View style={[gd.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[gd.topBar, { backgroundColor: colors.accent2 }]} />
      <View style={gd.inner}>
        <View style={gd.left}>
          <Text style={[gd.label, { color: colors.text2 }]}>GOAL DATE</Text>
          <Text style={[gd.date, { color: colors.accent2 }]}>{format(goalDate, "MMM d")}</Text>
          <Text style={[gd.year, { color: colors.text2 }]}>{format(goalDate, "yyyy")}</Text>
        </View>
        <View style={[gd.divider, { backgroundColor: colors.border }]} />
        <View style={gd.statsRow}>
          {[
            { val: Math.ceil(weeks).toString(), lbl: "WEEKS" },
            { val: diff, lbl: "KG TO GO" },
            { val: `${isLose ? "−" : "+"}${profile.weeklyRateKg}`, lbl: "KG/WEEK" },
          ].map(({ val, lbl }) => (
            <View key={lbl} style={gd.stat}>
              <Text style={[gd.statVal, { color: colors.text }]}>{val}</Text>
              <Text style={[gd.statLbl, { color: colors.text2 }]}>{lbl}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
const gd = StyleSheet.create({
  card: { borderWidth: 2, overflow: "hidden" },
  topBar: { height: 5 },
  inner: { flexDirection: "row" },
  left: { padding: 14, alignItems: "center", justifyContent: "center", minWidth: 88 },
  label: { fontFamily: "SpaceMono", fontSize: 8, letterSpacing: 1, marginBottom: 4 },
  date: { fontFamily: "BebasNeue", fontSize: 32, lineHeight: 34 },
  year: { fontFamily: "SpaceMono", fontSize: 10 },
  divider: { width: 2 },
  statsRow: { flex: 1, flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statVal: { fontFamily: "BebasNeue", fontSize: 24, lineHeight: 26 },
  statLbl: { fontFamily: "SpaceMono", fontSize: 8, letterSpacing: 0.8 },
});

// ── Main Dashboard ─────────────────────────────────────────
export default function DashboardScreen() {
  const { colors, scheme, toggle } = useTheme();
  const { records, loading, refresh, add } = useRecords();
  const { profile } = useProfile();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [foodModal, setFoodModal] = useState(false);
  const [logChoice, setLogChoice] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); refreshLog(); }, [refresh, refreshLog]));

  const today = format(new Date(), "yyyy-MM-dd");
  const todayRecord = records.find(r => r.date === today) ?? null;
  const stepsToday = todayRecord?.steps ?? null;
  const logData = useLogData(today);
  const { totalFoodCals, totalExerciseCals, refresh: refreshLog } = logData;
  const stepKcalToday = stepsToday && profile
    ? Math.round(stepsToKcal(stepsToday, profile.weight))
    : 0;
  const totalBurnedToday = stepKcalToday + totalExerciseCals;

  const handleAdd = async (r: NewRecord) => { await add(r); setModalOpen(false); };

  const hasProfile = !!profile;

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={s.headerL}>
          <View style={[s.logo, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Ionicons name="flash" size={18} color="#fff" />
          </View>
          <View>
            <Text style={[s.appName, { color: colors.text }]}>FITTRACK</Text>
            {profile
              ? <Text style={[s.tagline, { color: colors.text2 }]}>HEY {profile.name.toUpperCase()} 👋</Text>
              : <Text style={[s.tagline, { color: colors.text2 }]}>TRACK YOUR GAINS</Text>
            }
          </View>
        </View>
        <View style={s.headerR}>
          <TouchableOpacity
            style={[s.iconBtn, { borderColor: colors.border, backgroundColor: colors.surface2 }]}
            onPress={toggle}
          >
            <Ionicons name={scheme === "dark" ? "sunny" : "moon"} size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.logBtn, { backgroundColor: colors.accent, borderColor: colors.border }, shadow]}
            onPress={() => setLogChoice(true)}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={s.logBtnText}>LOG</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />}
      >

        {/* 1 ── TODAY'S STATS ──────────────────────── */}
        <Text style={[s.sectionLbl, { color: colors.text2 }]}>TODAY'S STATS</Text>
        <View style={s.todayGrid}>
          <StatPill
            label="CALORIES EATEN"
            value={totalFoodCals > 0 ? `${Math.round(totalFoodCals).toLocaleString()} kcal` : "—"}
            color={colors.accent}
          />
          <StatPill
            label="STEPS"
            value={todayRecord?.steps != null ? todayRecord.steps.toLocaleString() : "—"}
            color={colors.accent3}
          />
        </View>
        <View style={[s.todayGrid, { marginTop: 10 }]}>
          <StatPill
            label="CALS BURNED"
            value={totalBurnedToday > 0 ? `${totalBurnedToday.toLocaleString()} kcal` : "—"}
            color={colors.danger}
          />
          <StatPill
            label="WEIGHT"
            value={todayRecord?.weight != null ? `${Number(todayRecord.weight).toFixed(1)} kg` : "—"}
            color={colors.accent2}
          />
          <View style={[s.dateBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.dateBadgeDay, { color: colors.accent }]}>{format(new Date(), "d")}</Text>
            <Text style={[s.dateBadgeMon, { color: colors.text2 }]}>{format(new Date(), "MMM yyyy").toUpperCase()}</Text>
            {todayRecord
              ? <Text style={[s.loggedTag, { color: colors.success }]}>✓ LOGGED</Text>
              : <Text style={[s.loggedTag, { color: colors.accent }]}>TAP + TO LOG</Text>
            }
          </View>
        </View>

        {/* 2 ── HEATMAP ────────────────────────────── */}
        <Text style={[s.sectionLbl, { color: colors.text2 }]}>CONSISTENCY</Text>
        <Heatmap records={records} />

        {/* 3 ── BMR & GOAL ─────────────────────────── */}
        {hasProfile ? (
          <>
            <Text style={[s.sectionLbl, { color: colors.text2 }]}>BMR & GOAL</Text>
            <BMRSection stepsToday={stepsToday} />
          </>
        ) : (
          <View style={[s.noProfileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.noProfileTitle, { color: colors.text }]}>BMR & GOAL NOT SET</Text>
            <Text style={[s.noProfileSub, { color: colors.text2 }]}>
              // complete your profile to see{"\n"}// BMR, TDEE and goal ETA
            </Text>
          </View>
        )}

        {/* 4 ── GOAL DATE ──────────────────────────── */}
        {hasProfile && (
          <>
            <Text style={[s.sectionLbl, { color: colors.text2 }]}>GOAL DATE</Text>
            <GoalDateCard />
          </>
        )}

        {/* 5 ── EDIT PROFILE ───────────────────────── */}
        <Text style={[s.sectionLbl, { color: colors.text2 }]}>PROFILE</Text>
        <TouchableOpacity
          style={[s.editBtn, { backgroundColor: colors.surface, borderColor: colors.border }, shadowSm]}
          onPress={() => router.push("/onboarding")}
        >
          <Ionicons name="person-outline" size={16} color={colors.text2} />
          <Text style={[s.editBtnText, { color: colors.text }]}>
            {hasProfile ? `EDIT PROFILE · ${profile!.name.toUpperCase()}` : "SET UP PROFILE →"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text2} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Log choice bottom sheet */}
      <LogChoiceModal
        visible={logChoice}
        onFood={() => { setLogChoice(false); setFoodModal(true); }}
        onSteps={() => { setLogChoice(false); setModalOpen(true); }}
        onClose={() => setLogChoice(false)}
      />
      <LogEntryModal visible={modalOpen} onClose={() => setModalOpen(false)} onSave={handleAdd} />
      <AddFoodModal
        visible={foodModal}
        date={today}
        freqFoods={logData.freqFoods}
        onSave={async (e) => { await logData.addFood(e); }}
        onClose={() => setFoodModal(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 3,
  },
  headerL: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { borderWidth: 2, padding: 6 },
  appName: { fontFamily: "BebasNeue", fontSize: 26, letterSpacing: 2 },
  tagline: { fontFamily: "SpaceMono", fontSize: 10 },
  headerR: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { borderWidth: 2, padding: 8 },
  logBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 2, paddingVertical: 8, paddingHorizontal: 14 },
  logBtnText: { fontFamily: "BebasNeue", fontSize: 18, color: "#fff", letterSpacing: 1 },
  scroll: { padding: 16, gap: 0 },
  sectionLbl: { fontFamily: "SpaceMono", fontSize: 10, letterSpacing: 1.5, marginTop: 20, marginBottom: 10 },
  todayGrid: { flexDirection: "row", gap: 10 },
  dateBadge: { flex: 1, borderWidth: 2, padding: 12, alignItems: "center", justifyContent: "center" },
  dateBadgeDay: { fontFamily: "BebasNeue", fontSize: 36, lineHeight: 38 },
  dateBadgeMon: { fontFamily: "SpaceMono", fontSize: 9, letterSpacing: 0.8 },
  loggedTag: { fontFamily: "SpaceMono", fontSize: 9, fontWeight: "700", marginTop: 4 },
  noProfileCard: { borderWidth: 2, padding: 24, alignItems: "center" },
  noProfileTitle: { fontFamily: "BebasNeue", fontSize: 24 },
  noProfileSub: { fontFamily: "SpaceMono", fontSize: 10, marginTop: 6, textAlign: "center", lineHeight: 18 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 2, padding: 14 },
  editBtnText: { fontFamily: "BebasNeue", fontSize: 18, letterSpacing: 1 },
});
