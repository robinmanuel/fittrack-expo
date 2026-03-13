import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useRecords } from "../../hooks/useRecords";
import { computeWeekSummary, formatNum } from "../../lib/stats";
import { shadow, shadowSm } from "../../lib/theme";
import StatCard from "../../components/StatCard";
import LogEntryModal from "../../components/LogEntryModal";
import { NewRecord } from "../../lib/types";

export default function DashboardScreen() {
  const { colors, scheme, toggle } = useTheme();
  const { records, loading, refresh, add } = useRecords();

  // Re-fetch when tab is focused
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );
  const [modalOpen, setModalOpen] = useState(false);

  const summary = computeWeekSummary(records);
  const today = new Date().toISOString().split("T")[0];
  const todayRecord = records.find(r => r.date === today);

  const handleAdd = async (record: NewRecord) => {
    await add(record);
    setModalOpen(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoBox, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Ionicons name="flash" size={18} color="#fff" />
          </View>
          <View>
            <Text style={[styles.appName, { color: colors.text }]}>FITTRACK</Text>
            <Text style={[styles.tagline, { color: colors.text2 }]}>7-day overview</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={toggle}
          style={[styles.themeBtn, { borderColor: colors.border, backgroundColor: colors.surface2 }, shadowSm]}
        >
          <Ionicons name={scheme === "dark" ? "sunny" : "moon"} size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />}
      >
        {/* Today's status */}
        <View style={[styles.todayBanner, {
          backgroundColor: todayRecord ? colors.success : colors.accent2,
          borderColor: colors.border,
        }, shadowSm]}>
          <Text style={styles.todayText}>
            {todayRecord ? "✓  TODAY LOGGED" : "⚡  LOG TODAY'S DATA"}
          </Text>
        </View>

        {/* Stat cards */}
        <Text style={[styles.sectionLabel, { color: colors.text2 }]}>THIS WEEK</Text>
        <View style={styles.statRow}>
          <StatCard
            label="Avg Cal"
            value={formatNum(summary.avgCalories)}
            unit="kcal"
            accentColor={colors.accent}
            trend={summary.calTrend}
          />
          <StatCard
            label="Avg Steps"
            value={formatNum(summary.avgSteps)}
            accentColor={colors.accent3}
            trend={summary.stepTrend}
          />
        </View>
        <View style={styles.statRow}>
          <StatCard
            label="Latest Weight"
            value={formatNum(summary.latestWeight, 1)}
            unit="kg"
            accentColor={colors.accent2}
            trend={summary.weightTrend}
          />
          <View style={[styles.entryCountCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
            <View style={[styles.accentBar, { backgroundColor: colors.accent3 }]} />
            <View style={{ padding: 14 }}>
              <Text style={[styles.entryCountLabel, { color: colors.text2 }]}>TOTAL ENTRIES</Text>
              <Text style={[styles.entryCountValue, { color: colors.text }]}>{records.length}</Text>
            </View>
          </View>
        </View>

        {/* Recent entries preview */}
        <Text style={[styles.sectionLabel, { color: colors.text2 }]}>RECENT</Text>
        {records.slice(0, 5).map(r => (
          <View
            key={r.id}
            style={[styles.recentRow, { backgroundColor: colors.surface, borderColor: colors.border }, shadowSm]}
          >
            <View style={[styles.recentDate, { backgroundColor: colors.surface2, borderRightColor: colors.border }]}>
              <Text style={[styles.recentDateText, { color: colors.text }]}>{r.date}</Text>
            </View>
            <View style={styles.recentStats}>
              {r.calories != null && (
                <View style={[styles.pill, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                  <Text style={styles.pillText}>{Math.round(r.calories)} kcal</Text>
                </View>
              )}
              {r.steps != null && (
                <View style={[styles.pill, { backgroundColor: colors.accent3, borderColor: colors.border }]}>
                  <Text style={[styles.pillText, { color: "#000" }]}>{r.steps.toLocaleString()} steps</Text>
                </View>
              )}
              {r.weight != null && (
                <View style={[styles.pill, { backgroundColor: colors.accent2, borderColor: colors.border }]}>
                  <Text style={[styles.pillText, { color: "#000" }]}>{Number(r.weight).toFixed(1)} kg</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {records.length === 0 && !loading && (
          <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyTitle, { color: colors.text2 }]}>NO ENTRIES YET</Text>
            <Text style={[styles.emptyHint, { color: colors.text2 }]}>// tap the button below to start</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent, borderColor: colors.border }, shadow]}
        onPress={() => setModalOpen(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
        <Text style={styles.fabText}>LOG ENTRY</Text>
      </TouchableOpacity>

      <LogEntryModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAdd}
      />
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: { borderWidth: 2, padding: 6 },
  appName: { fontFamily: "BebasNeue", fontSize: 26, letterSpacing: 2 },
  tagline: { fontFamily: "SpaceMono", fontSize: 10, letterSpacing: 0.8 },
  themeBtn: { borderWidth: 2, padding: 8 },
  scroll: { padding: 16 },
  todayBanner: {
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  todayText: { fontFamily: "BebasNeue", fontSize: 18, color: "#000", letterSpacing: 1.5 },
  sectionLabel: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 4,
  },
  statRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  entryCountCard: { flex: 1, borderWidth: 2, overflow: "hidden" },
  accentBar: { height: 6 },
  entryCountLabel: { fontFamily: "SpaceMono", fontSize: 10, letterSpacing: 1.2, marginBottom: 6 },
  entryCountValue: { fontFamily: "BebasNeue", fontSize: 36, lineHeight: 40 },
  recentRow: {
    flexDirection: "row",
    borderWidth: 2,
    marginBottom: 8,
    alignItems: "center",
    overflow: "hidden",
  },
  recentDate: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRightWidth: 2,
    minWidth: 108,
  },
  recentDateText: { fontFamily: "SpaceMono", fontSize: 11, fontWeight: "700" },
  recentStats: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 4, padding: 8 },
  pill: {
    borderWidth: 2,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pillText: { fontFamily: "SpaceMono", fontSize: 10, fontWeight: "700", color: "#fff" },
  emptyBox: { borderWidth: 2, padding: 40, alignItems: "center", marginTop: 20 },
  emptyTitle: { fontFamily: "BebasNeue", fontSize: 28 },
  emptyHint: { fontFamily: "SpaceMono", fontSize: 11, marginTop: 6 },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
  },
  fabText: { fontFamily: "BebasNeue", fontSize: 20, color: "#fff", letterSpacing: 1.5 },
});
