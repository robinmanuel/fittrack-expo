import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useTheme } from "../../hooks/useTheme";
import { useRecords } from "../../hooks/useRecords";
import { useLogData } from "../../hooks/useLogData";
import AddFoodModal from "../../components/AddFoodModal";
import AddExerciseModal from "../../components/AddExerciseModal";
import LogEntryModal from "../../components/LogEntryModal";
import { radius, shadow, shadowSm } from "../../lib/theme";
import { FoodEntry, ExerciseEntry } from "../../lib/types";
import { stepsToKcal } from "../../lib/bmr";
import { useProfile } from "../../hooks/useProfile";

function DateStrip({ selected, onChange }: { selected: string; onChange: (d: string) => void }) {
  const { colors } = useTheme();
  const today = format(new Date(), "yyyy-MM-dd");
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return {
      dayName: format(d, "EEE"),
      dayNum:  format(d, "d"),
      month:   format(d, "MMM"),
      date:    format(d, "yyyy-MM-dd"),
      isToday: format(d, "yyyy-MM-dd") === today,
    };
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={dstrip.scroll}
    >
      {days.map(({ dayName, dayNum, month, date, isToday }) => {
        const active = date === selected;
        return (
          <TouchableOpacity
            key={date}
            onPress={() => onChange(date)}
            style={[
              dstrip.item,
              { backgroundColor: active ? colors.accent : colors.surface },
              active && { shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
            ]}
          >
            {/* Day name */}
            <Text style={[dstrip.dayName, { color: active ? "rgba(255,255,255,0.75)" : colors.text2 }]}>
              {dayName.toUpperCase()}
            </Text>
            {/* Day number */}
            <Text style={[dstrip.dayNum, { color: active ? "#fff" : colors.text }]}>
              {dayNum}
            </Text>
            {/* Today dot */}
            {isToday && (
              <View style={[dstrip.todayDot, { backgroundColor: active ? "rgba(255,255,255,0.9)" : colors.accent }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const dstrip = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingVertical: 16, gap: 8, flexDirection: "row" },
  item: {
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    minWidth: 52,
    gap: 4,
  },
  dayName: {
    fontFamily: "Inter",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  dayNum: {
    fontFamily: "LoraBold",
    fontSize: 22,
    lineHeight: 24,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    marginTop: 2,
  },
});

function FoodRow({ entry, onDelete }: { entry: FoodEntry; onDelete: (id: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[row.wrap, { backgroundColor: colors.surface }, shadowSm]}>
      <View style={[row.calBox, { backgroundColor: colors.accent + "18" }]}>
        <Text style={[row.calVal, { color: colors.accent }]}>{Math.round(entry.total_cals)}</Text>
        <Text style={[row.calUnit, { color: colors.accent }]}>kcal</Text>
      </View>
      <View style={row.info}>
        <Text style={[row.name, { color: colors.text }]} numberOfLines={1}>{entry.name}</Text>
        <Text style={[row.detail, { color: colors.text2 }]}>{entry.quantity} × {entry.cals_per_unit} kcal</Text>
      </View>
      <TouchableOpacity onPress={() => Alert.alert("Remove?", entry.name, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(entry.id) },
      ])}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

function ExerciseRow({ entry, onDelete }: { entry: ExerciseEntry; onDelete: (id: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[row.wrap, { backgroundColor: colors.surface }, shadowSm]}>
      <View style={[row.calBox, { backgroundColor: colors.accent3 + "18" }]}>
        <Text style={[row.calVal, { color: colors.accent3 }]}>{Math.round(entry.cals_burned)}</Text>
        <Text style={[row.calUnit, { color: colors.accent3 }]}>kcal</Text>
      </View>
      <View style={row.info}>
        <Text style={[row.name, { color: colors.text }]} numberOfLines={1}>{entry.name}</Text>
        <Text style={[row.detail, { color: colors.text2 }]}>calories burned</Text>
      </View>
      <TouchableOpacity onPress={() => Alert.alert("Remove?", entry.name, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(entry.id) },
      ])}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

const row = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", borderRadius: radius.md, padding: 12, gap: 12, marginBottom: 8 },
  calBox: { borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center", minWidth: 56 },
  calVal: { fontFamily: "LoraBold", fontSize: 18, lineHeight: 20 },
  calUnit: { fontFamily: "Inter", fontSize: 9 },
  info: { flex: 1 },
  name: { fontFamily: "InterMedium", fontSize: 14 },
  detail: { fontFamily: "Inter", fontSize: 12, marginTop: 2 },
});

export default function LogScreen() {
  const { colors, scheme } = useTheme();
  const { records, refresh: refreshRecords, add: addRecord } = useRecords();
  const { profile } = useProfile();
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [foodModal, setFoodModal] = useState(false);
  const [exerciseModal, setExerciseModal] = useState(false);
  const [stepsModal, setStepsModal] = useState(false);
  const { foodEntries, exerciseEntries, freqFoods, freqExercises,
    refresh, addFood, removeFood, addExercise, removeExercise,
    totalFoodCals, totalExerciseCals } = useLogData(date);

  useFocusEffect(useCallback(() => { refresh(); }, [date, refresh]));

  const dayRecord = records.find(r => r.date === date);
  const stepsToday = dayRecord?.steps ?? null;
  const stepCals = stepsToday && profile ? Math.round(stepsToKcal(stepsToday, profile.weight)) : (stepsToday ? Math.round(stepsToday * 0.04) : 0);
  const totalBurned = stepCals + totalExerciseCals;
  const net = totalFoodCals - totalBurned;

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />

      <View style={[s.header, { backgroundColor: colors.bg }]}>
        <Text style={[s.title, { color: colors.text }]}>Log</Text>
        <TouchableOpacity style={[s.stepsBtn, { backgroundColor: colors.surface }, shadowSm]} onPress={() => setStepsModal(true)}>
          <Ionicons name="footsteps-outline" size={15} color={colors.accent3} />
          <Text style={[s.stepsTxt, { color: colors.text }]}>
            {stepsToday != null ? `${stepsToday.toLocaleString()} steps` : "Log steps"}
          </Text>
        </TouchableOpacity>
      </View>

      <DateStrip selected={date} onChange={setDate} />

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Summary */}
        <View style={[s.summary, { backgroundColor: colors.surface }, shadowSm]}>
          {[
            { label: "Eaten", val: Math.round(totalFoodCals), color: colors.accent },
            { label: "Burned", val: Math.round(totalBurned), color: colors.accent3 },
            { label: "Net", val: Math.round(net), color: net > 0 ? colors.accent2 : colors.success },
          ].map(({ label, val, color }) => (
            <View key={label} style={s.summaryItem}>
              <Text style={[s.summaryVal, { color }]}>{val || 0}</Text>
              <Text style={[s.summaryLbl, { color: colors.text2 }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Food */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Food eaten</Text>
          <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.accent }, shadow]} onPress={() => setFoodModal(true)}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        {foodEntries.length === 0
          ? <Text style={[s.empty, { color: colors.text2 }]}>Nothing logged yet</Text>
          : foodEntries.map(f => <FoodRow key={f.id} entry={f} onDelete={removeFood} />)
        }

        {/* Exercise */}
        <View style={[s.sectionHeader, { marginTop: 20 }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Exercise</Text>
          <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.accent3 }, shadow]} onPress={() => setExerciseModal(true)}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        {stepsToday != null && stepCals > 0 && (
          <View style={[row.wrap, { backgroundColor: colors.surface }, shadowSm]}>
            <View style={[row.calBox, { backgroundColor: colors.accent3 + "18" }]}>
              <Text style={[row.calVal, { color: colors.accent3 }]}>{stepCals}</Text>
              <Text style={[row.calUnit, { color: colors.accent3 }]}>kcal</Text>
            </View>
            <View style={row.info}>
              <Text style={[row.name, { color: colors.text }]}>Walking</Text>
              <Text style={[row.detail, { color: colors.text2 }]}>{stepsToday.toLocaleString()} steps</Text>
            </View>
            <Ionicons name="footsteps-outline" size={16} color={colors.accent3} />
          </View>
        )}
        {exerciseEntries.length === 0
          ? <Text style={[s.empty, { color: colors.text2 }]}>No exercise logged yet</Text>
          : exerciseEntries.map(e => <ExerciseRow key={e.id} entry={e} onDelete={removeExercise} />)
        }
        <View style={{ height: 60 }} />
      </ScrollView>

      <AddFoodModal visible={foodModal} date={date} freqFoods={freqFoods} onSave={addFood} onClose={() => setFoodModal(false)} />
      <AddExerciseModal visible={exerciseModal} date={date} freqExercises={freqExercises} onSave={addExercise} onClose={() => setExerciseModal(false)} />
      <LogEntryModal visible={stepsModal}
        onClose={() => { setStepsModal(false); refreshRecords(); refresh(); }}
        onSave={async (r) => { await addRecord(r); await refresh(); }}
        existing={dayRecord ?? null} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4 },
  title: { fontFamily: "LoraBold", fontSize: 28 },
  stepsBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.full, paddingVertical: 8, paddingHorizontal: 14 },
  stepsTxt: { fontFamily: "InterMedium", fontSize: 13 },
  scroll: { paddingHorizontal: 20 },
  summary: { borderRadius: radius.md, flexDirection: "row", padding: 16, marginBottom: 4 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryVal: { fontFamily: "LoraBold", fontSize: 22 },
  summaryLbl: { fontFamily: "Inter", fontSize: 11, marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontFamily: "InterMedium", fontSize: 16 },
  addBtn: { borderRadius: radius.full, padding: 7 },
  empty: { fontFamily: "Inter", fontSize: 13, fontStyle: "italic", marginBottom: 8 },
});
