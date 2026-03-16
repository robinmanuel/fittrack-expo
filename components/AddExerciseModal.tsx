import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { FreqExercise, NewExerciseEntry } from "../lib/types";
import { shadow, shadowSm } from "../lib/theme";

interface Props {
  visible: boolean;
  date: string;
  freqExercises: FreqExercise[];
  onSave: (entry: NewExerciseEntry) => Promise<void>;
  onClose: () => void;
}

export default function AddExerciseModal({ visible, date, freqExercises, onSave, onClose }: Props) {
  const { colors: C } = useTheme();
  const [name, setName] = useState("");
  const [calsBurned, setCalsBurned] = useState("");
  const [saving, setSaving] = useState(false);
  const [filtered, setFiltered] = useState<FreqExercise[]>([]);

  useEffect(() => {
    if (!visible) { setName(""); setCalsBurned(""); }
  }, [visible]);

  useEffect(() => {
    if (name.trim().length > 0) {
      setFiltered(freqExercises.filter(e =>
        e.name.toLowerCase().includes(name.toLowerCase())
      ).slice(0, 5));
    } else {
      setFiltered(freqExercises.slice(0, 5));
    }
  }, [name, freqExercises]);

  const selectFreq = (e: FreqExercise) => {
    setName(e.name);
    setCalsBurned(e.cals_burned.toString());
    setFiltered([]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Missing", "Enter exercise name"); return; }
    if (!calsBurned || parseFloat(calsBurned) <= 0) { Alert.alert("Missing", "Enter calories burned"); return; }
    setSaving(true);
    try {
      await onSave({ date, name: name.trim(), cals_burned: parseFloat(calsBurned) });
      onClose();
    } finally { setSaving(false); }
  };

  const inp = [s.input, { backgroundColor: C.bg2, borderColor: C.border, color: C.text }];
  const lbl = [s.label, { color: C.text2 }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[s.container, { backgroundColor: C.bg }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[s.header, { backgroundColor: C.accent3, borderBottomColor: C.border }]}>
          <Text style={s.headerTitle}>LOG EXERCISE</Text>
          <TouchableOpacity onPress={onClose} style={[s.closeBtn, { borderColor: "rgba(0,0,0,0.3)" }]}>
            <Ionicons name="close" size={18} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Frequent quick-add */}
          {freqExercises.length > 0 && (
            <View style={s.freqSection}>
              <Text style={[s.freqTitle, { color: C.text2 }]}>FREQUENT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={s.freqRow}>
                  {freqExercises.slice(0, 8).map(e => (
                    <TouchableOpacity
                      key={e.id}
                      style={[s.freqChip, { backgroundColor: C.surface, borderColor: C.border }, shadowSm]}
                      onPress={() => selectFreq(e)}
                    >
                      <Text style={[s.freqChipName, { color: C.text }]} numberOfLines={1}>{e.name}</Text>
                      <Text style={[s.freqChipCal, { color: C.accent3 }]}>{e.cals_burned} kcal</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Name with autocomplete */}
          <View style={s.field}>
            <Text style={lbl}>EXERCISE NAME</Text>
            <TextInput style={inp} value={name} onChangeText={setName}
              placeholder="e.g. Running 30min" placeholderTextColor={C.text2} />
            {filtered.length > 0 && name.length > 0 && (
              <View style={[s.autocomplete, { backgroundColor: C.surface, borderColor: C.border }]}>
                {filtered.map(e => (
                  <TouchableOpacity key={e.id} style={[s.autoItem, { borderBottomColor: C.surface2 }]} onPress={() => selectFreq(e)}>
                    <Text style={[s.autoName, { color: C.text }]}>{e.name}</Text>
                    <Text style={[s.autoCal, { color: C.text2 }]}>{e.cals_burned} kcal burned</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Cals burned */}
          <View style={s.field}>
            <Text style={lbl}>CALORIES BURNED</Text>
            <TextInput style={inp} value={calsBurned} onChangeText={setCalsBurned}
              placeholder="250" placeholderTextColor={C.text2} keyboardType="decimal-pad" />
          </View>

          {/* Preview */}
          {parseFloat(calsBurned) > 0 && (
            <View style={[s.totalBox, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.accent3 }]}>
              <Text style={[s.totalLabel, { color: C.text2 }]}>CALORIES BURNED</Text>
              <Text style={[s.totalVal, { color: C.accent3 }]}>{Math.round(parseFloat(calsBurned))} kcal</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: C.accent3, borderColor: C.border }, shadow]}
            onPress={handleSave} disabled={saving}
          >
            <Text style={s.saveBtnText}>{saving ? "SAVING…" : "ADD EXERCISE →"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 20, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 3,
  },
  headerTitle: { fontFamily: "BebasNeue", fontSize: 26, color: "#000", letterSpacing: 2 },
  closeBtn: { borderWidth: 2, padding: 4 },
  scroll: { padding: 20 },
  freqSection: { marginBottom: 20 },
  freqTitle: { fontFamily: "SpaceMono", fontSize: 10, letterSpacing: 1.2, marginBottom: 8 },
  freqRow: { flexDirection: "row", gap: 8 },
  freqChip: { borderWidth: 2, paddingVertical: 8, paddingHorizontal: 12, minWidth: 100 },
  freqChipName: { fontFamily: "SpaceMono", fontSize: 11, fontWeight: "700" },
  freqChipCal: { fontFamily: "SpaceMono", fontSize: 10, marginTop: 2 },
  field: { marginBottom: 16, position: "relative" },
  label: { fontFamily: "SpaceMono", fontSize: 10, letterSpacing: 1.2, marginBottom: 6 },
  input: { borderWidth: 2, padding: 12, fontFamily: "SpaceMono", fontSize: 14, fontWeight: "600" },
  autocomplete: {
    position: "absolute", top: "100%", left: 0, right: 0,
    borderWidth: 2, borderTopWidth: 0, zIndex: 10,
  },
  autoItem: { padding: 10, borderBottomWidth: 1 },
  autoName: { fontFamily: "SpaceMono", fontSize: 12, fontWeight: "700" },
  autoCal: { fontFamily: "SpaceMono", fontSize: 10, marginTop: 2 },
  totalBox: { borderWidth: 2, borderLeftWidth: 4, padding: 12, marginBottom: 16 },
  totalLabel: { fontFamily: "SpaceMono", fontSize: 9, letterSpacing: 1 },
  totalVal: { fontFamily: "BebasNeue", fontSize: 32, lineHeight: 34 },
  saveBtn: { borderWidth: 2, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { fontFamily: "BebasNeue", fontSize: 22, color: "#000", letterSpacing: 1.5 },
});
