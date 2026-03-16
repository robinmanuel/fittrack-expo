import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { shadow, shadowSm } from "../lib/theme";
import { FitnessRecord, NewRecord } from "../lib/types";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (record: NewRecord) => Promise<void>;
  existing?: FitnessRecord | null;
}

export default function LogEntryModal({ visible, onClose, onSave, existing }: Props) {
  const { colors } = useTheme();
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [steps, setSteps] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setDate(existing.date);
      setSteps(existing.steps?.toString() ?? "");
      setWeight(existing.weight?.toString() ?? "");
    } else {
      setDate(today);
      setSteps(""); setWeight("");
    }
  }, [existing, visible]);

  const handleSave = async () => {
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD format");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        date,
        calories: null,
        steps: steps ? parseInt(steps) : null,
        weight: weight ? parseFloat(weight) : null,
      });
      onClose();
    } catch {
      Alert.alert("Error", "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const inp = [s.input, { backgroundColor: colors.bg2, borderColor: colors.border, color: colors.text }];
  const lbl = [s.label, { color: colors.text2 }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[s.container, { backgroundColor: colors.bg }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[s.header, { backgroundColor: colors.accent, borderBottomColor: colors.border }]}>
          <Text style={s.headerTitle}>{existing ? "EDIT ENTRY" : "STEPS & WEIGHT"}</Text>
          <TouchableOpacity onPress={onClose} style={[s.closeBtn, { borderColor: "rgba(255,255,255,0.5)" }]}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <View style={[s.note, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.accent3 }]}>
            <Text style={[s.noteText, { color: colors.text2 }]}>
              // log food calories in the LOG tab
            </Text>
          </View>

          <View style={s.field}>
            <Text style={lbl}>DATE (YYYY-MM-DD)</Text>
            <TextInput style={inp} value={date} onChangeText={setDate}
              placeholder={today} placeholderTextColor={colors.text2}
              keyboardType="numbers-and-punctuation" editable={!existing} />
          </View>

          <View style={s.field}>
            <Text style={lbl}>STEPS</Text>
            <TextInput style={inp} value={steps} onChangeText={setSteps}
              placeholder="8000" placeholderTextColor={colors.text2} keyboardType="number-pad" />
          </View>

          <View style={s.field}>
            <Text style={lbl}>WEIGHT (kg)</Text>
            <TextInput style={inp} value={weight} onChangeText={setWeight}
              placeholder="72.5" placeholderTextColor={colors.text2} keyboardType="decimal-pad" />
          </View>

          <View style={s.row}>
            <TouchableOpacity
              style={[s.btn, { borderColor: colors.border, backgroundColor: colors.surface2 }, shadowSm]}
              onPress={onClose}
            >
              <Text style={[s.btnText, { color: colors.text }]}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: colors.accent, borderColor: colors.border }, shadow]}
              onPress={handleSave} disabled={saving}
            >
              <Text style={[s.btnText, { color: "#fff" }]}>{saving ? "SAVING…" : "SAVE →"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2,
  },
  headerTitle: { fontFamily: "BebasNeue", fontSize: 26, color: "#fff", letterSpacing: 2 },
  closeBtn: { borderWidth: 2, padding: 4 },
  scroll: { padding: 20, gap: 16 },
  note: { borderWidth: 2, borderLeftWidth: 4, padding: 12 },
  noteText: { fontFamily: "SpaceMono", fontSize: 11, lineHeight: 18 },
  field: { gap: 6 },
  label: { fontFamily: "SpaceMono", fontSize: 10, letterSpacing: 1.2 },
  input: { borderWidth: 2, padding: 12, fontFamily: "SpaceMono", fontSize: 14, fontWeight: "600" },
  row: { flexDirection: "row", gap: 12, marginTop: 4 },
  btn: { flex: 1, borderWidth: 2, paddingVertical: 14, alignItems: "center" },
  btnText: { fontFamily: "BebasNeue", fontSize: 20, letterSpacing: 1.5 },
});
