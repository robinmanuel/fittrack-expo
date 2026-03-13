import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { useTheme } from "../hooks/useTheme";

interface DataPoint {
  label: string;
  value: number | null;
}

interface Props {
  data: DataPoint[];
  color: string;
  height?: number;
  title: string;
}

export default function BarChart({ data, color, height = 140, title }: Props) {
  const { colors } = useTheme();
  const W = 320;
  const H = height;
  const PAD = { top: 10, right: 8, bottom: 28, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const values = data.map(d => d.value ?? 0);
  const maxVal = Math.max(...values, 1);

  const barW = Math.max(4, chartW / data.length - 3);
  const gap = chartW / data.length;

  // Show only every Nth label to avoid clutter
  const showEvery = data.length > 15 ? 5 : data.length > 7 ? 3 : 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.titleRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.title, { color: colors.text2 }]}>{title.toUpperCase()}</Text>
      </View>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Horizontal guide lines */}
        {[0.25, 0.5, 0.75, 1].map(pct => {
          const y = PAD.top + chartH * (1 - pct);
          return (
            <Line
              key={pct}
              x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke={colors.surface2} strokeWidth={1} strokeDasharray="4,4"
            />
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = d.value != null ? Math.max(2, (d.value / maxVal) * chartH) : 0;
          const x = PAD.left + i * gap + (gap - barW) / 2;
          const y = PAD.top + chartH - barH;
          return (
            <Rect
              key={i}
              x={x} y={y} width={barW} height={barH}
              fill={d.value != null ? color : colors.surface2}
              stroke={colors.border}
              strokeWidth={d.value != null ? 1 : 0}
            />
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) =>
          i % showEvery === 0 ? (
            <SvgText
              key={i}
              x={PAD.left + i * gap + gap / 2}
              y={H - 6}
              fontSize={8}
              fill={colors.text2}
              textAnchor="middle"
              fontFamily="SpaceMono"
            >
              {d.label}
            </SvgText>
          ) : null
        )}

        {/* Y-axis max */}
        <SvgText
          x={PAD.left - 4}
          y={PAD.top + 4}
          fontSize={8}
          fill={colors.text2}
          textAnchor="end"
          fontFamily="SpaceMono"
        >
          {Math.round(maxVal).toLocaleString()}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 2, overflow: "hidden", marginBottom: 12 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
  },
  dot: { width: 10, height: 10, borderWidth: 2, borderColor: "#000" },
  title: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
});
