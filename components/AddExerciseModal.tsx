import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { FreqExercise, NewExerciseEntry } from "../lib/types";
import { radius, shadow } from "../lib/theme";

interface Props {
  visible: boolean; date: string;
  freqExercises: FreqExercise[];
  onSave: (e: NewExerciseEntry) => Promise<void>;
  onClose: () => void;
}

export default function AddExerciseModal({ visible, date, freqExercises, onSave, onClose }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [calsBurned, setCalsBurned] = useState("");
  const [saving, setSaving] = useState(false);
  const [filtered, setFiltered] = useState<FreqExercise[]>([]);

  useEffect(() => { if (!visible) { setName(""); setCalsBurned(""); } }, [visible]);
  useEffect(() => {
    setFiltered(name.trim().length > 0
      ? freqExercises.filter(e => e.name.toLowerCase().includes(name.toLowerCase())).slice(0, 5)
      : freqExercises.slice(0, 5));
  }, [name, freqExercises]);

  const selectFreq = (e: FreqExercise) => { setName(e.name); setCalsBurned(e.cals_burned.toString()); setFiltered([]); };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Missing", "Enter exercise name"); return; }
    if (!calsBurned || parseFloat(calsBurned) <= 0) { Alert.alert("Missing", "Enter calories burned"); return; }
    setSaving(true);
    try { await onSave({ date, name: name.trim(), cals_burned: parseFloat(calsBurned) }); onClose(); }
    finally { setSaving(false); }
  };

  const inp = [s.input, { backgroundColor: colors.surface2, color: colors.text }];
  const lbl = [s.label, { color: colors.text2 }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.bg }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[s.header, { borderBottomColor: colors.surface2 }]}>
          <Text style={[s.title, { color: colors.text }]}>Log exercise</Text>
          <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: colors.surface2 }]}>
            <Ionicons name="close" size={18} color={colors.text2} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {freqExercises.length > 0 && (
            <View>
              <Text style={[s.sectionLbl, { color: colors.text2 }]}>Frequent</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={s.chips}>
                  {freqExercises.slice(0, 8).map(e => (
                    <TouchableOpacity key={e.id} style={[s.chip, { backgroundColor: colors.surface }]} onPress={() => selectFreq(e)}>
                      <Text style={[s.chipName, { color: colors.text }]}>{e.name}</Text>
                      <Text style={[s.chipCal, { color: colors.accent3 }]}>{e.cals_burned} kcal</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          <View style={{ position: "relative" }}>
            <Text style={lbl}>Exercise name</Text>
            <TextInput style={[inp, { marginTop: 8 }]} value={name} onChangeText={setName}
              placeholder="e.g. Running 30 min" placeholderTextColor={colors.text2} />
            {filtered.length > 0 && name.length > 0 && (
              <View style={[s.autocomplete, { backgroundColor: colors.surface }]}>
                {filtered.map(e => (
                  <TouchableOpacity key={e.id} style={[s.autoItem, { borderBottomColor: colors.surface2 }]} onPress={() => selectFreq(e)}>
                    <Text style={[s.autoName, { color: colors.text }]}>{e.name}</Text>
                    <Text style={[s.autoCal, { color: colors.text2 }]}>{e.cals_burned} kcal burned</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={s.field}>
            <Text style={lbl}>Calories burned</Text>
            <TextInput style={[inp, { marginTop: 8 }]} value={calsBurned} onChangeText={setCalsBurned}
              placeholder="250" placeholderTextColor={colors.text2} keyboardType="decimal-pad" />
          </View>
          {parseFloat(calsBurned) > 0 && (
            <View style={[s.total, { backgroundColor: colors.surface }]}>
              <Text style={[s.totalLbl, { color: colors.text2 }]}>Burned</Text>
              <Text style={[s.totalVal, { color: colors.accent3 }]}>{Math.round(parseFloat(calsBurned))} kcal</Text>
            </View>
          )}
          <TouchableOpacity style={[s.saveBtn, { backgroundColor: colors.accent3 }, shadow]} onPress={handleSave} disabled={saving}>
            <Text style={s.saveTxt}>{saving ? "Saving…" : "Add exercise"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingTop: 24, borderBottomWidth: 1 },
  title: { fontFamily: "LoraBold", fontSize: 22 },
  closeBtn: { borderRadius: radius.full, padding: 6 },
  scroll: { padding: 24, gap: 18 },
  sectionLbl: { fontFamily: "Inter", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 },
  chips: { flexDirection: "row", gap: 8 },
  chip: { borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 14 },
  chipName: { fontFamily: "InterMedium", fontSize: 13 },
  chipCal: { fontFamily: "Inter", fontSize: 11, marginTop: 2 },
  field: { gap: 0 },
  label: { fontFamily: "InterMedium", fontSize: 13 },
  input: { borderRadius: radius.md, padding: 14, fontFamily: "Inter", fontSize: 15 },
  autocomplete: { position: "absolute", top: "100%", left: 0, right: 0, borderRadius: radius.md, zIndex: 10, overflow: "hidden" },
  autoItem: { padding: 12, borderBottomWidth: 1 },
  autoName: { fontFamily: "InterMedium", fontSize: 13 },
  autoCal: { fontFamily: "Inter", fontSize: 11, marginTop: 2 },
  total: { borderRadius: radius.md, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLbl: { fontFamily: "Inter", fontSize: 13 },
  totalVal: { fontFamily: "LoraBold", fontSize: 26 },
  saveBtn: { borderRadius: radius.md, paddingVertical: 16, alignItems: "center" },
  saveTxt: { fontFamily: "InterMedium", fontSize: 16, color: "#fff" },
});
