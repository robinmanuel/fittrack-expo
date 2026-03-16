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
import { shadow, shadowSm } from "../../lib/theme";
import { FoodEntry, ExerciseEntry } from "../../lib/types";

// ── Date Picker strip ──────────────────────────────────────
function DateStrip({ selected, onChange }: { selected: string; onChange: (d: string) => void }) {
  const { colors } = useTheme();
  const days: { label: string; date: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ label: format(d, "EEE d"), date: format(d, "yyyy-MM-dd") });
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[ds.strip, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
      {days.map(({ label, date }) => {
        const active = date === selected;
        return (
          <TouchableOpacity key={date} onPress={() => onChange(date)}
            style={[ds.day, { borderColor: colors.border, backgroundColor: active ? colors.accent : colors.surface2 }]}>
            <Text style={[ds.dayText, { color: active ? "#fff" : colors.text2 }]}>{label.toUpperCase()}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
const ds = StyleSheet.create({
  strip: { borderBottomWidth: 2, paddingVertical: 10, paddingHorizontal: 12 },
  day: { borderWidth: 2, paddingVertical: 6, paddingHorizontal: 10, marginRight: 6 },
  dayText: { fontFamily: "SpaceMono", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
});

// ── Section header ─────────────────────────────────────────
function SectionHeader({
  label, total, totalLabel, color, onAdd,
}: { label: string; total: number; totalLabel: string; color: string; onAdd: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={sh.row}>
      <View style={[sh.dot, { backgroundColor: color, borderColor: colors.border }]} />
      <Text style={[sh.label, { color: colors.text }]}>{label}</Text>
      <View style={[sh.badge, { backgroundColor: color, borderColor: colors.border }]}>
        <Text style={sh.badgeText}>{Math.round(total)} {totalLabel}</Text>
      </View>
      <TouchableOpacity style={[sh.addBtn, { backgroundColor: color, borderColor: colors.border }, shadowSm]} onPress={onAdd}>
        <Ionicons name="add" size={16} color="#000" />
      </TouchableOpacity>
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  dot: { width: 10, height: 10, borderWidth: 2 },
  label: { fontFamily: "BebasNeue", fontSize: 20, letterSpacing: 1, flex: 1 },
  badge: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: "SpaceMono", fontSize: 10, fontWeight: "700", color: "#000" },
  addBtn: { borderWidth: 2, padding: 5 },
});

// ── Food row ───────────────────────────────────────────────
function FoodRow({ entry, onDelete }: { entry: FoodEntry; onDelete: (id: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[fr.row, { backgroundColor: colors.surface, borderColor: colors.border }, shadowSm]}>
      <View style={[fr.left, { borderRightColor: colors.border }]}>
        <Text style={[fr.cals, { color: colors.success }]}>{Math.round(entry.total_cals)}</Text>
        <Text style={[fr.unit, { color: colors.text2 }]}>kcal</Text>
      </View>
      <View style={fr.mid}>
        <Text style={[fr.name, { color: colors.text }]} numberOfLines={1}>{entry.name}</Text>
        <Text style={[fr.detail, { color: colors.text2 }]}>
          {entry.quantity} × {entry.cals_per_unit} kcal/serving
        </Text>
      </View>
      <TouchableOpacity style={[fr.delBtn, { borderColor: colors.border, backgroundColor: colors.danger }]}
        onPress={() => Alert.alert("Delete?", `Remove ${entry.name}?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => onDelete(entry.id) },
        ])}>
        <Ionicons name="trash" size={13} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
const fr = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderWidth: 2, marginBottom: 8, overflow: "hidden" },
  left: { paddingHorizontal: 12, paddingVertical: 10, alignItems: "center", borderRightWidth: 2, minWidth: 64 },
  cals: { fontFamily: "BebasNeue", fontSize: 22, lineHeight: 24 },
  unit: { fontFamily: "SpaceMono", fontSize: 8 },
  mid: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  name: { fontFamily: "SpaceMono", fontSize: 12, fontWeight: "700" },
  detail: { fontFamily: "SpaceMono", fontSize: 10, marginTop: 2 },
  delBtn: { borderLeftWidth: 2, padding: 12, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
});

// ── Exercise row ───────────────────────────────────────────
function ExerciseRow({ entry, onDelete }: { entry: ExerciseEntry; onDelete: (id: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[er.row, { backgroundColor: colors.surface, borderColor: colors.border }, shadowSm]}>
      <View style={[er.left, { borderRightColor: colors.border }]}>
        <Text style={[er.cals, { color: colors.accent3 }]}>{Math.round(entry.cals_burned)}</Text>
        <Text style={[er.unit, { color: colors.text2 }]}>kcal</Text>
      </View>
      <View style={er.mid}>
        <Text style={[er.name, { color: colors.text }]} numberOfLines={1}>{entry.name}</Text>
        <Text style={[er.detail, { color: colors.text2 }]}>calories burned</Text>
      </View>
      <TouchableOpacity style={[er.delBtn, { borderColor: colors.border, backgroundColor: colors.danger }]}
        onPress={() => Alert.alert("Delete?", `Remove ${entry.name}?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => onDelete(entry.id) },
        ])}>
        <Ionicons name="trash" size={13} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
const er = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderWidth: 2, marginBottom: 8, overflow: "hidden" },
  left: { paddingHorizontal: 12, paddingVertical: 10, alignItems: "center", borderRightWidth: 2, minWidth: 64 },
  cals: { fontFamily: "BebasNeue", fontSize: 22, lineHeight: 24 },
  unit: { fontFamily: "SpaceMono", fontSize: 8 },
  mid: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  name: { fontFamily: "SpaceMono", fontSize: 12, fontWeight: "700" },
  detail: { fontFamily: "SpaceMono", fontSize: 10, marginTop: 2 },
  delBtn: { borderLeftWidth: 2, padding: 12, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
});

// ── Empty state ────────────────────────────────────────────
function EmptyState({ label, color }: { label: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[em.box, { borderColor: colors.border, borderLeftColor: color }]}>
      <Text style={[em.text, { color: colors.text2 }]}>// no {label} logged yet</Text>
    </View>
  );
}
const em = StyleSheet.create({
  box: { borderWidth: 2, borderLeftWidth: 4, padding: 14, marginBottom: 8 },
  text: { fontFamily: "SpaceMono", fontSize: 11 },
});

// ── Summary bar ────────────────────────────────────────────
function SummaryBar({
  foodCals, stepCals, exerciseCals, steps,
}: { foodCals: number; stepCals: number; exerciseCals: number; steps: number | null }) {
  const { colors } = useTheme();
  const totalBurned = stepCals + exerciseCals;
  const net = foodCals - totalBurned;
  return (
    <View style={[sb.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={sb.item}>
        <Text style={[sb.val, { color: colors.success }]}>{Math.round(foodCals)}</Text>
        <Text style={[sb.lbl, { color: colors.text2 }]}>EATEN</Text>
      </View>
      <Text style={[sb.sep, { color: colors.border }]}>−</Text>
      <View style={sb.item}>
        <Text style={[sb.val, { color: colors.accent3 }]}>{Math.round(totalBurned)}</Text>
        <Text style={[sb.lbl, { color: colors.text2 }]}>BURNED</Text>
      </View>
      <Text style={[sb.sep, { color: colors.border }]}>=</Text>
      <View style={sb.item}>
        <Text style={[sb.val, { color: net > 0 ? colors.accent : colors.success }]}>{Math.round(net)}</Text>
        <Text style={[sb.lbl, { color: colors.text2 }]}>NET</Text>
      </View>
    </View>
  );
}
const sb = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", borderWidth: 2, marginBottom: 16 },
  item: { flex: 1, alignItems: "center", paddingVertical: 12 },
  val: { fontFamily: "BebasNeue", fontSize: 24, lineHeight: 26 },
  lbl: { fontFamily: "SpaceMono", fontSize: 9, letterSpacing: 1 },
  sep: { fontFamily: "BebasNeue", fontSize: 20, paddingHorizontal: 4 },
});

// ── Main screen ────────────────────────────────────────────
export default function LogScreen() {
  const { colors, scheme } = useTheme();
  const { records, refresh: refreshRecords, add: addRecord } = useRecords();
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [foodModal, setFoodModal] = useState(false);
  const [exerciseModal, setExerciseModal] = useState(false);
  const [stepsModal, setStepsModal] = useState(false);

  const {
    foodEntries, exerciseEntries,
    freqFoods, freqExercises,
    loading, refresh,
    addFood, removeFood,
    addExercise, removeExercise,
    totalFoodCals, totalExerciseCals,
  } = useLogData(date);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  // When date changes, refresh log data
  const handleDateChange = (d: string) => {
    setDate(d);
  };
  useFocusEffect(useCallback(() => { refresh(); }, [date, refresh]));

  // Get steps for selected date from records
  const dayRecord = records.find(r => r.date === date);
  const stepsToday = dayRecord?.steps ?? null;
  const stepCals = stepsToday ? Math.round(stepsToday * ((dayRecord ? 70 : 70) / 70) * 0.04) : 0;

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.text }]}>LOG</Text>
        <TouchableOpacity
          style={[s.stepsBtn, { backgroundColor: colors.surface2, borderColor: colors.border }, shadowSm]}
          onPress={() => setStepsModal(true)}
        >
          <Ionicons name="footsteps" size={14} color={colors.accent3} />
          <Text style={[s.stepsBtnText, { color: colors.text }]}>
            {stepsToday != null ? `${stepsToday.toLocaleString()} STEPS` : "LOG STEPS"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date strip */}
      <DateStrip selected={date} onChange={handleDateChange} />

      <ScrollView contentContainerStyle={s.scroll}>

        {/* Summary bar */}
        <SummaryBar
          foodCals={totalFoodCals}
          stepCals={stepCals}
          exerciseCals={totalExerciseCals}
          steps={stepsToday}
        />

        {/* ── FOOD section ──────────────────────────── */}
        <SectionHeader
          label="FOOD EATEN"
          total={totalFoodCals}
          totalLabel="kcal"
          color={colors.success}
          onAdd={() => setFoodModal(true)}
        />
        {foodEntries.length === 0
          ? <EmptyState label="food" color={colors.success} />
          : foodEntries.map(f => (
              <FoodRow key={f.id} entry={f} onDelete={removeFood} />
            ))
        }

        {/* ── EXERCISE section ──────────────────────── */}
        <View style={{ marginTop: 20 }}>
          <SectionHeader
            label="EXERCISE"
            total={totalExerciseCals + stepCals}
            totalLabel="kcal burned"
            color={colors.accent3}
            onAdd={() => setExerciseModal(true)}
          />
          {/* Steps as a pseudo-entry if logged */}
          {stepsToday != null && stepCals > 0 && (
            <View style={[fr.row, { backgroundColor: colors.surface, borderColor: colors.border }, shadowSm]}>
              <View style={[fr.left, { borderRightColor: colors.border }]}>
                <Text style={[fr.cals, { color: colors.accent3 }]}>{stepCals}</Text>
                <Text style={[fr.unit, { color: colors.text2 }]}>kcal</Text>
              </View>
              <View style={fr.mid}>
                <Text style={[fr.name, { color: colors.text }]}>Walking / Steps</Text>
                <Text style={[fr.detail, { color: colors.text2 }]}>{stepsToday.toLocaleString()} steps</Text>
              </View>
              <View style={[{ paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="footsteps" size={16} color={colors.accent3} />
              </View>
            </View>
          )}
          {exerciseEntries.length === 0
            ? <EmptyState label="exercises" color={colors.accent3} />
            : exerciseEntries.map(e => (
                <ExerciseRow key={e.id} entry={e} onDelete={removeExercise} />
              ))
          }
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Modals */}
      <AddFoodModal
        visible={foodModal}
        date={date}
        freqFoods={freqFoods}
        onSave={addFood}
        onClose={() => setFoodModal(false)}
      />
      <AddExerciseModal
        visible={exerciseModal}
        date={date}
        freqExercises={freqExercises}
        onSave={addExercise}
        onClose={() => setExerciseModal(false)}
      />
      <LogEntryModal
        visible={stepsModal}
        onClose={() => { setStepsModal(false); refresh(); }}
        onSave={async (r) => { await addRecord(r); await refresh(); }}
        existing={dayRecord ?? null}
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
  title: { fontFamily: "BebasNeue", fontSize: 32, letterSpacing: 2 },
  stepsBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 2, paddingVertical: 7, paddingHorizontal: 12 },
  stepsBtnText: { fontFamily: "SpaceMono", fontSize: 10, fontWeight: "700" },
  scroll: { padding: 16 },
});
