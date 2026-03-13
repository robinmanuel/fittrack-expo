import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { FitnessRecord } from "../lib/types";
import { format, parseISO } from "date-fns";
import { shadowSm } from "../lib/theme";

interface Props {
  record: FitnessRecord;
  onEdit: (r: FitnessRecord) => void;
  onDelete: (id: number) => void;
}

export default function RecordRow({ record, onEdit, onDelete }: Props) {
  const { colors } = useTheme();

  const confirmDelete = () => {
    Alert.alert("Delete Entry", `Remove record for ${record.date}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(record.id) },
    ]);
  };

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, shadowSm]}>
      {/* Date */}
      <View style={[styles.dateBadge, { backgroundColor: colors.accent, borderColor: colors.border }]}>
        <Text style={styles.dateDay}>{format(parseISO(record.date), "dd")}</Text>
        <Text style={styles.dateMon}>{format(parseISO(record.date), "MMM").toUpperCase()}</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Metric label="CAL" value={record.calories} color={colors.accent} unit="kcal" />
        <Metric label="STEPS" value={record.steps} color={colors.accent3} />
        <Metric label="KG" value={record.weight} color={colors.accent2} decimals={1} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface2 }]}
          onPress={() => onEdit(record)}
        >
          <Ionicons name="pencil" size={14} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.danger }]}
          onPress={confirmDelete}
        >
          <Ionicons name="trash" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Metric({ label, value, color, unit, decimals = 0 }: {
  label: string; value: number | null; color: string; unit?: string; decimals?: number;
}) {
  const { colors } = useTheme();
  const display = value == null ? "—" : decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color: colors.text2 }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: value != null ? color : colors.text2 }]}>{display}</Text>
      {unit && <Text style={[styles.metricUnit, { color: colors.text2 }]}>{unit}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    marginBottom: 10,
    overflow: "hidden",
  },
  dateBadge: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRightWidth: 2,
  },
  dateDay: {
    fontFamily: "BebasNeue",
    fontSize: 28,
    color: "#fff",
    lineHeight: 28,
  },
  dateMon: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    color: "#fff",
    letterSpacing: 1,
  },
  stats: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 12,
  },
  metric: { alignItems: "flex-start" },
  metricLabel: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    letterSpacing: 0.8,
  },
  metricValue: {
    fontFamily: "BebasNeue",
    fontSize: 20,
    lineHeight: 22,
  },
  metricUnit: {
    fontFamily: "SpaceMono",
    fontSize: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    paddingRight: 10,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
