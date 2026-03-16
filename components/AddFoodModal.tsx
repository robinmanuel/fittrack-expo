import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { FreqFood, NewFoodEntry } from "../lib/types";
import { shadow, shadowSm } from "../lib/theme";

interface Props {
  visible: boolean;
  date: string;
  freqFoods: FreqFood[];
  onSave: (entry: NewFoodEntry) => Promise<void>;
  onClose: () => void;
}

export default function AddFoodModal({ visible, date, freqFoods, onSave, onClose }: Props) {
  const { colors: C } = useTheme();
  const [name, setName] = useState("");
  const [calsPerUnit, setCalsPerUnit] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [saving, setSaving] = useState(false);
  const [filtered, setFiltered] = useState<FreqFood[]>([]);

  useEffect(() => {
    if (!visible) { setName(""); setCalsPerUnit(""); setQuantity("1"); }
  }, [visible]);

  useEffect(() => {
    if (name.trim().length > 0) {
      setFiltered(freqFoods.filter(f =>
        f.name.toLowerCase().includes(name.toLowerCase())
      ).slice(0, 5));
    } else {
      setFiltered(freqFoods.slice(0, 5));
    }
  }, [name, freqFoods]);

  const selectFreq = (f: FreqFood) => {
    setName(f.name);
    setCalsPerUnit(f.cals_per_unit.toString());
    setFiltered([]);
  };

  const totalCals = parseFloat(calsPerUnit || "0") * parseFloat(quantity || "0");

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Missing", "Enter food name"); return; }
    if (!calsPerUnit || parseFloat(calsPerUnit) <= 0) { Alert.alert("Missing", "Enter calories per serving"); return; }
    if (!quantity || parseFloat(quantity) <= 0) { Alert.alert("Missing", "Enter quantity"); return; }
    setSaving(true);
    try {
      await onSave({ date, name: name.trim(), cals_per_unit: parseFloat(calsPerUnit), quantity: parseFloat(quantity) });
      onClose();
    } finally { setSaving(false); }
  };

  const inp = [s.input, { backgroundColor: C.bg2, borderColor: C.border, color: C.text }];
  const lbl = [s.label, { color: C.text2 }];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[s.container, { backgroundColor: C.bg }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View style={[s.header, { backgroundColor: C.success, borderBottomColor: C.border }]}>
          <Text style={s.headerTitle}>LOG FOOD</Text>
          <TouchableOpacity onPress={onClose} style={[s.closeBtn, { borderColor: "rgba(0,0,0,0.3)" }]}>
            <Ionicons name="close" size={18} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Freq quick-add */}
          {freqFoods.length > 0 && (
            <View style={s.freqSection}>
              <Text style={[s.freqTitle, { color: C.text2 }]}>FREQUENT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={s.freqRow}>
                  {freqFoods.slice(0, 8).map(f => (
                    <TouchableOpacity
                      key={f.id}
                      style={[s.freqChip, { backgroundColor: C.surface, borderColor: C.border }, shadowSm]}
                      onPress={() => selectFreq(f)}
                    >
                      <Text style={[s.freqChipName, { color: C.text }]} numberOfLines={1}>{f.name}</Text>
                      <Text style={[s.freqChipCal, { color: C.success }]}>{f.cals_per_unit} kcal</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Name field with autocomplete */}
          <View style={s.field}>
            <Text style={lbl}>FOOD NAME</Text>
            <TextInput style={inp} value={name} onChangeText={setName}
              placeholder="e.g. Banana" placeholderTextColor={C.text2} />
            {filtered.length > 0 && name.length > 0 && (
              <View style={[s.autocomplete, { backgroundColor: C.surface, borderColor: C.border }]}>
                {filtered.map(f => (
                  <TouchableOpacity key={f.id} style={[s.autoItem, { borderBottomColor: C.surface2 }]} onPress={() => selectFreq(f)}>
                    <Text style={[s.autoName, { color: C.text }]}>{f.name}</Text>
                    <Text style={[s.autoCal, { color: C.text2 }]}>{f.cals_per_unit} kcal/serving</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Cals + Qty row */}
          <View style={s.row}>
            <View style={[s.field, { flex: 1 }]}>
              <Text style={lbl}>KCAL / SERVING</Text>
              <TextInput style={inp} value={calsPerUnit} onChangeText={setCalsPerUnit}
                placeholder="200" placeholderTextColor={C.text2} keyboardType="decimal-pad" />
            </View>
            <View style={[s.field, { flex: 1 }]}>
              <Text style={lbl}>SERVINGS</Text>
              <TextInput style={inp} value={quantity} onChangeText={setQuantity}
                placeholder="1" placeholderTextColor={C.text2} keyboardType="decimal-pad" />
            </View>
          </View>

          {/* Total preview */}
          {totalCals > 0 && (
            <View style={[s.totalBox, { backgroundColor: C.surface, borderColor: C.border, borderLeftColor: C.success }]}>
              <Text style={[s.totalLabel, { color: C.text2 }]}>TOTAL CALORIES</Text>
              <Text style={[s.totalVal, { color: C.success }]}>{Math.round(totalCals)} kcal</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: C.success, borderColor: C.border }, shadow]}
            onPress={handleSave} disabled={saving}
          >
            <Text style={s.saveBtnText}>{saving ? "SAVING…" : "ADD FOOD →"}</Text>
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
  scroll: { padding: 20, gap: 0 },
  freqSection: { marginBottom: 20 },
  freqTitle: { fontFamily: "SpaceMono", fontSize: 10, letterSpacing: 1.2, marginBottom: 8 },
  freqRow: { flexDirection: "row", gap: 8 },
  freqChip: { borderWidth: 2, paddingVertical: 8, paddingHorizontal: 12, minWidth: 90 },
  freqChipName: { fontFamily: "SpaceMono", fontSize: 11, fontWeight: "700" },
  freqChipCal: { fontFamily: "SpaceMono", fontSize: 10, marginTop: 2 },
  field: { marginBottom: 16, position: "relative" },
  label: { fontFamily: "SpaceMono", fontSize: 10, letterSpacing: 1.2, marginBottom: 6 },
  input: { borderWidth: 2, padding: 12, fontFamily: "SpaceMono", fontSize: 14, fontWeight: "600" },
  row: { flexDirection: "row", gap: 12 },
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
