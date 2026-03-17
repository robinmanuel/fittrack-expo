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
import { calcBMR, calcTDEE, calcDailyTarget, calcGoalDate, calcWeeksToGoal, stepsToKcal } from "../../lib/bmr";
import { shadow, shadowSm, radius } from "../../lib/theme";
import LogEntryModal from "../../components/LogEntryModal";
import AddFoodModal from "../../components/AddFoodModal";
import LogChoiceModal from "../../components/LogChoiceModal";
import { NewRecord } from "../../lib/types";
import { format, subDays, eachDayOfInterval } from "date-fns";

// ── Heatmap ────────────────────────────────────────────────
function Heatmap({ records }: { records: Array<{ date: string; steps: number | null }> }) {
  const { colors } = useTheme();
  const today = new Date();
  const days = eachDayOfInterval({ start: subDays(today, 83), end: today });
  const stepsMap: Record<string, number> = {};
  records.forEach(r => { if (r.steps) stepsMap[r.date] = r.steps; });
  const maxSteps = Math.max(...Object.values(stepsMap), 1);
  const todayStr = format(today, "yyyy-MM-dd");
  const CELL = 12, GAP = 3, WEEKS = 12;
  const cols: Date[][] = [];
  for (let w = 0; w < WEEKS; w++) cols.push(days.slice(w * 7, w * 7 + 7));

  const cellColor = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const s = stepsMap[key];
    if (!s) return colors.surface2;
    const p = Math.min(s / maxSteps, 1);
    if (p > 0.75) return colors.accent3;
    if (p > 0.5)  return colors.accent3 + "cc";
    if (p > 0.25) return colors.accent3 + "88";
    return colors.accent3 + "44";
  };

  return (
    <View style={[hm.card, { backgroundColor: colors.surface }, shadowSm]}>
      <Text style={[hm.title, { color: colors.text2 }]}>Consistency — 12 weeks</Text>
      <View style={hm.body}>
        <View style={hm.dayCol}>
          {["S","M","T","W","T","F","S"].map((d, i) => (
            <Text key={i} style={[hm.dayLbl, { color: colors.text2, height: CELL + GAP }]}>{d}</Text>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: GAP }}>
            {cols.map((week, wi) => (
              <View key={wi} style={{ flexDirection: "column", gap: GAP }}>
                {week.map((day, di) => (
                  <View key={di} style={{
                    width: CELL, height: CELL,
                    borderRadius: 3,
                    backgroundColor: cellColor(day),
                    borderWidth: format(day, "yyyy-MM-dd") === todayStr ? 1.5 : 0,
                    borderColor: colors.accent,
                  }} />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={hm.legend}>
        <Text style={[hm.lgLbl, { color: colors.text2 }]}>fewer steps</Text>
        {["44","88","cc",""].map((op, i) => (
          <View key={i} style={[hm.lgCell, { backgroundColor: op ? colors.accent3 + op : colors.accent3, borderRadius: 2 }]} />
        ))}
        <Text style={[hm.lgLbl, { color: colors.text2 }]}>more</Text>
      </View>
    </View>
  );
}
const hm = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 16 },
  title: { fontFamily: "Inter", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 },
  body: { flexDirection: "row", gap: 6 },
  dayCol: {},
  dayLbl: { fontFamily: "Inter", fontSize: 8, textAlign: "center", lineHeight: 12 },
  legend: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  lgCell: { width: 10, height: 10 },
  lgLbl: { fontFamily: "Inter", fontSize: 10, marginHorizontal: 2 },
});

// ── BMR section ────────────────────────────────────────────
function BMRSection({ stepsToday }: { stepsToday: number | null }) {
  const { colors } = useTheme();
  const { profile } = useProfile();
  if (!profile) return null;
  const bmr    = Math.round(calcBMR(profile));
  const tdee   = calcTDEE(profile, stepsToday);
  const target = calcDailyTarget(profile, stepsToday);
  const stepKcal = stepsToday ? Math.round(stepsToKcal(stepsToday, profile.weight)) : 0;
  const isLose = profile.goalDirection === "lose";
  const delta = Math.abs(tdee - target);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[
          { label: "BMR", val: bmr.toLocaleString(), unit: "kcal", color: colors.accent3, sub: "at rest" },
          { label: "TDEE today", val: tdee.toLocaleString(), unit: "kcal", color: colors.accent, sub: stepsToday ? `+${stepKcal} from steps` : "no steps" },
        ].map(({ label, val, unit, color, sub }) => (
          <View key={label} style={[bm.tile, { backgroundColor: colors.surface }, shadowSm]}>
            <View style={[bm.dot, { backgroundColor: color }]} />
            <Text style={[bm.tileLabel, { color: colors.text2 }]}>{label}</Text>
            <Text style={[bm.tileVal, { color: colors.text }]}>{val}<Text style={[bm.tileUnit, { color: colors.text2 }]}> {unit}</Text></Text>
            <Text style={[bm.tileSub, { color: colors.text2 }]}>{sub}</Text>
          </View>
        ))}
      </View>
      <View style={[bm.target, { backgroundColor: colors.surface }, shadowSm]}>
        <View style={[bm.dot, { backgroundColor: colors.accent2 }]} />
        <Text style={[bm.tileLabel, { color: colors.text2 }]}>Daily target · {isLose ? "lose" : "gain"} {profile.weeklyRateKg} kg/wk</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <Text style={[bm.targetVal, { color: colors.text }]}>{target.toLocaleString()}</Text>
          <Text style={[bm.tileUnit, { color: colors.text2 }]}>kcal/day</Text>
          <View style={[bm.badge, { backgroundColor: isLose ? colors.danger + "22" : colors.success + "22" }]}>
            <Text style={[bm.badgeTxt, { color: isLose ? colors.danger : colors.success }]}>
              {isLose ? "−" : "+"}{delta} vs TDEE
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
const bm = StyleSheet.create({
  tile: { flex: 1, borderRadius: radius.md, padding: 14, gap: 3 },
  dot: { width: 6, height: 6, borderRadius: radius.full, marginBottom: 4 },
  tileLabel: { fontFamily: "Inter", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 },
  tileVal: { fontFamily: "LoraBold", fontSize: 24, lineHeight: 26 },
  tileUnit: { fontFamily: "Inter", fontSize: 12 },
  tileSub: { fontFamily: "Inter", fontSize: 11, marginTop: 1 },
  target: { borderRadius: radius.md, padding: 14 },
  targetVal: { fontFamily: "LoraBold", fontSize: 38, lineHeight: 40 },
  badge: { borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontFamily: "InterMedium", fontSize: 11 },
});

// ── Goal Date ──────────────────────────────────────────────
function GoalDateCard() {
  const { colors } = useTheme();
  const { profile } = useProfile();
  if (!profile) return null;
  const weeks = calcWeeksToGoal(profile);
  const goalDate = calcGoalDate(profile);
  const diff = Math.abs(profile.goalWeight - profile.weight).toFixed(1);

  return (
    <View style={[gd.card, { backgroundColor: colors.surface }, shadowSm]}>
      <View style={[gd.dot, { backgroundColor: colors.accent2 }]} />
      <Text style={[gd.label, { color: colors.text2 }]}>Goal date</Text>
      <Text style={[gd.date, { color: colors.text }]}>{format(goalDate, "MMMM d, yyyy")}</Text>
      <View style={gd.row}>
        {[
          { val: Math.ceil(weeks).toString(), lbl: "weeks" },
          { val: diff, lbl: "kg to go" },
          { val: `${profile.goalDirection === "lose" ? "−" : "+"}${profile.weeklyRateKg}`, lbl: "kg/week" },
        ].map(({ val, lbl }) => (
          <View key={lbl} style={gd.stat}>
            <Text style={[gd.statVal, { color: colors.text }]}>{val}</Text>
            <Text style={[gd.statLbl, { color: colors.text2 }]}>{lbl}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const gd = StyleSheet.create({
  card: { borderRadius: radius.md, padding: 16, gap: 4 },
  dot: { width: 6, height: 6, borderRadius: radius.full, marginBottom: 4 },
  label: { fontFamily: "Inter", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 },
  date: { fontFamily: "LoraBold", fontSize: 22, marginTop: 2 },
  row: { flexDirection: "row", marginTop: 12, gap: 0 },
  stat: { flex: 1 },
  statVal: { fontFamily: "LoraBold", fontSize: 20 },
  statLbl: { fontFamily: "Inter", fontSize: 11, marginTop: 1 },
});

// ── Dashboard ──────────────────────────────────────────────
export default function DashboardScreen() {
  const { colors, scheme, toggle } = useTheme();
  const { records, loading, refresh, add: addRecord } = useRecords();
  const { profile } = useProfile();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [foodModal, setFoodModal] = useState(false);
  const [logChoice, setLogChoice] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const logData = useLogData(today);
  const { totalFoodCals, totalExerciseCals, refresh: refreshLog } = logData;
  const todayRecord = records.find(r => r.date === today) ?? null;
  const stepsToday = todayRecord?.steps ?? null;
  const stepKcalToday = stepsToday && profile ? Math.round(stepsToKcal(stepsToday, profile.weight)) : 0;
  const totalBurnedToday = stepKcalToday + totalExerciseCals;

  useFocusEffect(useCallback(() => { refresh(); refreshLog(); }, [refresh, refreshLog]));

  const handleAdd = async (r: NewRecord) => { await addRecord(r); setModalOpen(false); };

  const Stat = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <View style={[ds.stat, { backgroundColor: colors.surface }, shadowSm]}>
      <View style={[ds.statDot, { backgroundColor: color }]} />
      <Text style={[ds.statLabel, { color: colors.text2 }]}>{label}</Text>
      <Text style={[ds.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.bg }]}>
        <View>
          <Text style={[s.appName, { color: colors.text }]}>
            {profile ? `Hello, ${profile.name}` : "FitTrack"}
          </Text>
          <Text style={[s.date, { color: colors.text2 }]}>{format(new Date(), "EEEE, MMMM d")}</Text>
        </View>
        <View style={s.headerR}>
          <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.surface }]} onPress={toggle}>
            <Ionicons name={scheme === "dark" ? "sunny-outline" : "moon-outline"} size={18} color={colors.text2} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.logBtn, { backgroundColor: colors.accent }, shadow]} onPress={() => setLogChoice(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.logBtnTxt}>Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />}
      >
        {/* Today's stats */}
        <Text style={[s.section, { color: colors.text2 }]}>Today</Text>
        <View style={ds.grid}>
          <Stat label="Eaten" value={totalFoodCals > 0 ? `${Math.round(totalFoodCals)} kcal` : "—"} color={colors.accent} />
          <Stat label="Steps" value={stepsToday != null ? stepsToday.toLocaleString() : "—"} color={colors.accent3} />
        </View>
        <View style={[ds.grid, { marginTop: 10 }]}>
          <Stat label="Burned" value={totalBurnedToday > 0 ? `${totalBurnedToday} kcal` : "—"} color={colors.danger} />
          <Stat label="Weight" value={todayRecord?.weight != null ? `${Number(todayRecord.weight).toFixed(1)} kg` : "—"} color={colors.accent2} />
        </View>

        {/* Heatmap */}
        <Text style={[s.section, { color: colors.text2 }]}>Consistency</Text>
        <Heatmap records={records} />

        {/* BMR & Goal */}
        {profile ? (
          <>
            <Text style={[s.section, { color: colors.text2 }]}>BMR & goal</Text>
            <BMRSection stepsToday={stepsToday} />
            <Text style={[s.section, { color: colors.text2 }]}>Goal date</Text>
            <GoalDateCard />
          </>
        ) : (
          <View style={[s.noProfile, { backgroundColor: colors.surface }, shadowSm]}>
            <Text style={[s.noProfileTitle, { color: colors.text }]}>No profile set up</Text>
            <Text style={[s.noProfileSub, { color: colors.text2 }]}>Set up your profile to see BMR, TDEE and your goal date</Text>
          </View>
        )}

        {/* Profile */}
        <Text style={[s.section, { color: colors.text2 }]}>Profile</Text>
        <TouchableOpacity style={[s.profileBtn, { backgroundColor: colors.surface }, shadowSm]} onPress={() => router.push("/onboarding")}>
          <View style={[s.profileIcon, { backgroundColor: colors.accent + "22" }]}>
            <Ionicons name="person-outline" size={18} color={colors.accent} />
          </View>
          <Text style={[s.profileBtnTxt, { color: colors.text }]}>
            {profile ? `Edit profile · ${profile.name}` : "Set up profile"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text2} />
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      <LogChoiceModal visible={logChoice}
        onFood={() => { setLogChoice(false); setFoodModal(true); }}
        onSteps={() => { setLogChoice(false); setModalOpen(true); }}
        onClose={() => setLogChoice(false)} />
      <LogEntryModal visible={modalOpen} onClose={() => setModalOpen(false)} onSave={handleAdd} />
      <AddFoodModal visible={foodModal} date={today} freqFoods={logData.freqFoods}
        onSave={async (e) => { await logData.addFood(e); }}
        onClose={() => setFoodModal(false)} />
    </View>
  );
}

const ds = StyleSheet.create({
  grid: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, borderRadius: radius.md, padding: 14, gap: 3 },
  statDot: { width: 6, height: 6, borderRadius: radius.full, marginBottom: 4 },
  statLabel: { fontFamily: "Inter", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 },
  statValue: { fontFamily: "LoraBold", fontSize: 24, lineHeight: 26 },
});

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  appName: { fontFamily: "LoraBold", fontSize: 24 },
  date: { fontFamily: "Inter", fontSize: 13, marginTop: 2 },
  headerR: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { borderRadius: radius.full, padding: 9 },
  logBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.full, paddingVertical: 9, paddingHorizontal: 16 },
  logBtnTxt: { fontFamily: "InterMedium", fontSize: 14, color: "#fff" },
  scroll: { paddingHorizontal: 20 },
  section: { fontFamily: "Inter", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 24, marginBottom: 10 },
  noProfile: { borderRadius: radius.md, padding: 20, gap: 6 },
  noProfileTitle: { fontFamily: "InterMedium", fontSize: 16 },
  noProfileSub: { fontFamily: "Inter", fontSize: 13, lineHeight: 20 },
  profileBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius.md, padding: 14 },
  profileIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  profileBtnTxt: { flex: 1, fontFamily: "InterMedium", fontSize: 15 },
});
