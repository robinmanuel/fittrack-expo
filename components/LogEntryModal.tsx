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
  const [calories, setCalories] = useState("");
  const [steps, setSteps] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setDate(existing.date);
      setCalories(existing.calories?.toString() ?? "");
      setSteps(existing.steps?.toString() ?? "");
      setWeight(existing.weight?.toString() ?? "");
    } else {
      setDate(today);
      setCalories(""); setSteps(""); setWeight("");
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
        calories: calories ? parseInt(calories) : null,
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

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.bg2, borderColor: colors.border, color: colors.text },
  ];
  const labelStyle = [styles.label, { color: colors.text2 }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.bg }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.accent, borderBottomColor: colors.border }]}>
          <Text style={styles.headerTitle}>{existing ? "EDIT ENTRY" : "NEW ENTRY"}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: "rgba(255,255,255,0.5)" }]}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Date */}
          <View style={styles.field}>
            <Text style={labelStyle}>DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={inputStyle}
              value={date}
              onChangeText={setDate}
              placeholder="2024-01-15"
              placeholderTextColor={colors.text2}
              keyboardType="numbers-and-punctuation"
              editable={!existing}
            />
          </View>

          {/* Calories & Steps side by side */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={labelStyle}>CALORIES (kcal)</Text>
              <TextInput
                style={inputStyle}
                value={calories}
                onChangeText={setCalories}
                placeholder="2000"
                placeholderTextColor={colors.text2}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={labelStyle}>STEPS</Text>
              <TextInput
                style={inputStyle}
                value={steps}
                onChangeText={setSteps}
                placeholder="8000"
                placeholderTextColor={colors.text2}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Weight */}
          <View style={styles.field}>
            <Text style={labelStyle}>WEIGHT (kg)</Text>
            <TextInput
              style={inputStyle}
              value={weight}
              onChangeText={setWeight}
              placeholder="72.5"
              placeholderTextColor={colors.text2}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Buttons */}
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost, { borderColor: colors.border, backgroundColor: colors.surface2 }, shadowSm]}
              onPress={onClose}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.accent, borderColor: colors.border }, shadow]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={[styles.btnText, { color: "#fff" }]}>{saving ? "SAVING…" : "SAVE →"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
  },
  headerTitle: {
    fontFamily: "BebasNeue",
    fontSize: 26,
    color: "#fff",
    letterSpacing: 2,
  },
  closeBtn: {
    borderWidth: 2,
    padding: 4,
    borderRadius: 0,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  row: { flexDirection: "row", gap: 12 },
  field: { gap: 6 },
  label: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 2,
    padding: 12,
    fontFamily: "SpaceMono",
    fontSize: 14,
    fontWeight: "600",
  },
  btn: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimary: {},
  btnGhost: {},
  btnText: {
    fontFamily: "BebasNeue",
    fontSize: 20,
    letterSpacing: 1.5,
  },
});
