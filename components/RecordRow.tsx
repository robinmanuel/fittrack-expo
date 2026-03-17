import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { FitnessRecord } from "../lib/types";
import { format, parseISO } from "date-fns";
import { radius, shadowSm } from "../lib/theme";

interface Props {
  record: FitnessRecord;
  onEdit: (r: FitnessRecord) => void;
  onDelete: (id: number) => void;
}

export default function RecordRow({ record, onEdit, onDelete }: Props) {
  const { colors } = useTheme();

  const confirmDelete = () => {
    Alert.alert("Remove entry", `Delete record for ${record.date}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(record.id) },
    ]);
  };

  return (
    <View style={[s.row, { backgroundColor: colors.surface }, shadowSm]}>
      <View style={[s.datePill, { backgroundColor: colors.surface2 }]}>
        <Text style={[s.dateDay, { color: colors.text }]}>
          {format(parseISO(record.date), "dd")}
        </Text>
        <Text style={[s.dateMon, { color: colors.text2 }]}>
          {format(parseISO(record.date), "MMM")}
        </Text>
      </View>
      <View style={s.metrics}>
        <Metric label="cal" value={record.calories} color={colors.accent} />
        <Metric label="steps" value={record.steps} color={colors.accent3} />
        <Metric label="kg" value={record.weight} color={colors.accent2} decimals={1} />
      </View>
      <View style={s.actions}>
        <TouchableOpacity onPress={() => onEdit(record)} style={s.iconBtn}>
          <Ionicons name="pencil-outline" size={16} color={colors.text2} />
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete} style={s.iconBtn}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Metric({ label, value, color, decimals = 0 }: {
  label: string; value: number | null; color: string; decimals?: number;
}) {
  const { colors } = useTheme();
  const display = value == null ? "—"
    : decimals > 0 ? Number(value).toFixed(decimals)
    : Math.round(Number(value)).toLocaleString();
  return (
    <View style={s.metric}>
      <Text style={[s.metricVal, { color: value != null ? color : colors.text2 }]}>{display}</Text>
      <Text style={[s.metricLbl, { color: colors.text2 }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    borderRadius: radius.md, marginBottom: 8,
    overflow: "hidden", padding: 12, gap: 12,
  },
  datePill: {
    borderRadius: radius.sm, paddingHorizontal: 10,
    paddingVertical: 8, alignItems: "center", minWidth: 44,
  },
  dateDay: { fontFamily: "LoraBold", fontSize: 20, lineHeight: 22 },
  dateMon: { fontFamily: "Inter", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  metrics: { flex: 1, flexDirection: "row", gap: 16 },
  metric: { alignItems: "flex-start" },
  metricVal: { fontFamily: "LoraBold", fontSize: 16, lineHeight: 18 },
  metricLbl: { fontFamily: "Inter", fontSize: 10, marginTop: 1 },
  actions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 6 },
});
