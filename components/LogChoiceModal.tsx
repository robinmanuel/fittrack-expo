import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { radius, shadow } from "../lib/theme";

interface Props {
  visible: boolean;
  onFood: () => void;
  onSteps: () => void;
  onClose: () => void;
}

export default function LogChoiceModal({ visible, onFood, onSteps, onClose }: Props) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <View style={[s.sheet, { backgroundColor: colors.surface }]}>
          <View style={[s.handle, { backgroundColor: colors.surface2 }]} />
          <Text style={[s.title, { color: colors.text2 }]}>What would you like to log?</Text>

          {[
            { icon: "restaurant-outline", label: "Food eaten", sub: "Meals, snacks, drinks", color: colors.success, onPress: onFood },
            { icon: "footsteps-outline", label: "Steps & weight", sub: "Daily step count and body weight", color: colors.accent3, onPress: onSteps },
          ].map(({ icon, label, sub, color, onPress }) => (
            <TouchableOpacity key={label} style={[s.option, { backgroundColor: colors.bg }]} onPress={onPress}>
              <View style={[s.iconBox, { backgroundColor: color + "22" }]}>
                <Ionicons name={icon as any} size={22} color={color} />
              </View>
              <View style={s.optText}>
                <Text style={[s.optTitle, { color: colors.text }]}>{label}</Text>
                <Text style={[s.optSub, { color: colors.text2 }]}>{sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text2} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[s.cancel, { backgroundColor: colors.surface2 }]} onPress={onClose}>
            <Text style={[s.cancelTxt, { color: colors.text2 }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, paddingBottom: 40, gap: 10 },
  handle: { width: 36, height: 4, borderRadius: radius.full, alignSelf: "center", marginBottom: 12 },
  title: { fontFamily: "Inter", fontSize: 13, textAlign: "center", marginBottom: 4 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: radius.md, padding: 16 },
  iconBox: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  optText: { flex: 1 },
  optTitle: { fontFamily: "InterMedium", fontSize: 16 },
  optSub: { fontFamily: "Inter", fontSize: 12, marginTop: 2 },
  cancel: { borderRadius: radius.md, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  cancelTxt: { fontFamily: "InterMedium", fontSize: 15 },
});
