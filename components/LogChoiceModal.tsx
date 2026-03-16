import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { shadow } from "../lib/theme";

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
        <View style={[s.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Handle */}
          <View style={[s.handle, { backgroundColor: colors.border }]} />

          <Text style={[s.title, { color: colors.text2 }]}>WHAT DO YOU WANT TO LOG?</Text>

          <TouchableOpacity
            style={[s.option, { backgroundColor: colors.bg, borderColor: colors.border }, shadow]}
            onPress={onFood}
          >
            <View style={[s.iconBox, { backgroundColor: colors.success, borderColor: colors.border }]}>
              <Ionicons name="restaurant" size={20} color="#000" />
            </View>
            <View style={s.optionText}>
              <Text style={[s.optionTitle, { color: colors.text }]}>FOOD EATEN</Text>
              <Text style={[s.optionSub, { color: colors.text2 }]}>log meals, snacks, drinks</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.option, { backgroundColor: colors.bg, borderColor: colors.border }, shadow]}
            onPress={onSteps}
          >
            <View style={[s.iconBox, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Ionicons name="footsteps" size={20} color="#fff" />
            </View>
            <View style={s.optionText}>
              <Text style={[s.optionTitle, { color: colors.text }]}>STEPS & WEIGHT</Text>
              <Text style={[s.optionSub, { color: colors.text2 }]}>daily step count and body weight</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.cancelBtn, { borderColor: colors.border, backgroundColor: colors.surface2 }]}
            onPress={onClose}
          >
            <Text style={[s.cancelText, { color: colors.text }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderWidth: 3, borderBottomWidth: 0,
    padding: 20, paddingBottom: 40, gap: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 8,
  },
  title: {
    fontFamily: "SpaceMono", fontSize: 10,
    letterSpacing: 1.2, textAlign: "center", marginBottom: 4,
  },
  option: {
    flexDirection: "row", alignItems: "center",
    gap: 14, borderWidth: 2, padding: 16,
  },
  iconBox: {
    width: 44, height: 44, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  optionText: { flex: 1 },
  optionTitle: { fontFamily: "BebasNeue", fontSize: 22, letterSpacing: 1.5 },
  optionSub: { fontFamily: "SpaceMono", fontSize: 10, marginTop: 2 },
  cancelBtn: {
    borderWidth: 2, paddingVertical: 13,
    alignItems: "center", marginTop: 4,
  },
  cancelText: { fontFamily: "BebasNeue", fontSize: 20, letterSpacing: 1.5 },
});
