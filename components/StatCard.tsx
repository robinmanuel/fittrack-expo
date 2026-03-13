import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { shadow } from "../lib/theme";

interface Props {
  label: string;
  value: string;
  unit?: string;
  accentColor: string;
  trend?: number | null;
}

export default function StatCard({ label, value, unit, accentColor, trend }: Props) {
  const { colors } = useTheme();
  const trendColor = trend == null ? colors.text2 : trend >= 0 ? colors.success : colors.danger;
  const trendSymbol = trend == null ? "" : trend >= 0 ? "▲" : "▼";

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.text2 }]}>{label.toUpperCase()}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
          {unit && <Text style={[styles.unit, { color: colors.text2 }]}>{unit}</Text>}
        </View>
        {trend != null && (
          <View style={[styles.trendBadge, { backgroundColor: trendColor, borderColor: colors.border }]}>
            <Text style={styles.trendText}>
              {trendSymbol} {Math.abs(trend).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 2,
    overflow: "hidden",
  },
  accentBar: { height: 6 },
  body: { padding: 14 },
  label: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  value: {
    fontFamily: "BebasNeue",
    fontSize: 36,
    lineHeight: 40,
  },
  unit: {
    fontFamily: "SpaceMono",
    fontSize: 12,
  },
  trendBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
  },
  trendText: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
  },
});
