import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { shadow, shadowSm, radius } from "../lib/theme";
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
      setDate(today); setSteps(""); setWeight("");
    }
  }, [existing, visible]);

  const handleSave = async () => {
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD format"); return;
    }
    setSaving(true);
    try {
      await onSave({ date, calories: null, steps: steps ? parseInt(steps) : null, weight: weight ? parseFloat(weight) : null });
      onClose();
    } catch { Alert.alert("Error", "Failed to save"); }
    finally { setSaving(false); }
  };

  const inp = [s.input, { backgroundColor: colors.surface2, color: colors.text }];
  const lbl = [s.label, { color: colors.text2 }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.bg }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[s.header, { borderBottomColor: colors.surface2 }]}>
          <Text style={[s.title, { color: colors.text }]}>{existing ? "Edit entry" : "Steps & weight"}</Text>
          <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: colors.surface2 }]}>
            <Ionicons name="close" size={18} color={colors.text2} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={[s.note, { backgroundColor: colors.surface }]}>
            <Text style={[s.noteText, { color: colors.text2 }]}>Log food calories in the Log tab</Text>
          </View>
          <View style={s.field}>
            <Text style={lbl}>Date</Text>
            <TextInput style={inp} value={date} onChangeText={setDate}
              placeholder={today} placeholderTextColor={colors.text2}
              keyboardType="numbers-and-punctuation" editable={!existing} />
          </View>
          <View style={s.field}>
            <Text style={lbl}>Steps</Text>
            <TextInput style={inp} value={steps} onChangeText={setSteps}
              placeholder="8 000" placeholderTextColor={colors.text2} keyboardType="number-pad" />
          </View>
          <View style={s.field}>
            <Text style={lbl}>Weight (kg)</Text>
            <TextInput style={inp} value={weight} onChangeText={setWeight}
              placeholder="72.5" placeholderTextColor={colors.text2} keyboardType="decimal-pad" />
          </View>
          <View style={s.row}>
            <TouchableOpacity style={[s.btn, { backgroundColor: colors.surface2 }]} onPress={onClose}>
              <Text style={[s.btnTxt, { color: colors.text2 }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent }, shadow]} onPress={handleSave} disabled={saving}>
              <Text style={[s.btnTxt, { color: "#fff" }]}>{saving ? "Saving…" : "Save"}</Text>
            </TouchableOpacity>
          </View>
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
  scroll: { padding: 24, gap: 20 },
  note: { borderRadius: radius.md, padding: 14 },
  noteText: { fontFamily: "Inter", fontSize: 13, lineHeight: 20 },
  field: { gap: 8 },
  label: { fontFamily: "InterMedium", fontSize: 13, letterSpacing: 0.2 },
  input: { borderRadius: radius.md, padding: 14, fontFamily: "Inter", fontSize: 15 },
  row: { flexDirection: "row", gap: 12, marginTop: 4 },
  btn: { flex: 1, borderRadius: radius.md, paddingVertical: 15, alignItems: "center" },
  btnTxt: { fontFamily: "InterMedium", fontSize: 15 },
});
