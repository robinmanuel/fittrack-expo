import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { shadow, radius } from "../lib/theme";

interface Props {
  label: string;
  value: string;
  unit?: string;
  accentColor: string;
  trend?: number | null;
}

export default function StatCard({ label, value, unit, accentColor, trend }: Props) {
  const { colors } = useTheme();
  const trendUp = trend != null && trend >= 0;

  return (
    <View style={[s.card, { backgroundColor: colors.surface }, shadow]}>
      <View style={[s.dot, { backgroundColor: accentColor }]} />
      <Text style={[s.label, { color: colors.text2 }]}>{label}</Text>
      <View style={s.row}>
        <Text style={[s.value, { color: colors.text }]}>
          {value === "" || value == null ? "—" : value}
        </Text>
        {unit && <Text style={[s.unit, { color: colors.text2 }]}> {unit}</Text>}
      </View>
      {trend != null && (
        <Text style={[s.trend, { color: trendUp ? colors.accent : colors.danger }]}>
          {trendUp ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs last week
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.md,
    padding: 16,
    gap: 4,
  },
  dot: {
    width: 6, height: 6,
    borderRadius: radius.full,
    marginBottom: 6,
  },
  label: {
    fontFamily: "Inter",
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  value: {
    fontFamily: "LoraBold",
    fontSize: 30,
    lineHeight: 34,
  },
  unit: {
    fontFamily: "Inter",
    fontSize: 13,
  },
  trend: {
    fontFamily: "Inter",
    fontSize: 11,
    marginTop: 4,
  },
});
