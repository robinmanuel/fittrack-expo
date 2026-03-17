import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, StatusBar, Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useProfile } from "../../hooks/useProfile";
import { Sex, GoalDirection, UserProfile } from "../../lib/bmr";
import { radius, shadow, shadowSm } from "../../lib/theme";

const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { save } = useProfile();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [goalDir, setGoalDir] = useState<GoalDirection>("lose");
  const [rate, setRate] = useState(0.5);

  const skip = () => router.replace("/(tabs)");
  const back = () => step === 0 ? router.back() : setStep(s => s - 1);
  const next = () => {
    if (step === 1 && (!name.trim() || !age)) { Alert.alert("Missing", "Please fill in all fields"); return; }
    if (step === 2 && (!height || !weight)) { Alert.alert("Missing", "Enter height and weight"); return; }
    if (step === 3 && !goalWeight) { Alert.alert("Missing", "Enter your goal weight"); return; }
    if (step < TOTAL_STEPS) { setStep(s => s + 1); return; }
    finish();
  };

  const finish = async () => {
    await save({ name: name.trim(), sex, age: parseInt(age), height: parseFloat(height), weight: parseFloat(weight), goalWeight: parseFloat(goalWeight), goalDirection: goalDir, weeklyRateKg: rate });
    router.replace("/(tabs)");
  };

  const C = colors;
  const inp = [s.input, { backgroundColor: C.surface, color: C.text }];
  const lbl = [s.label, { color: C.text2 }];

  const Chip = ({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) => (
    <TouchableOpacity style={[s.chip, { backgroundColor: active ? C.accent : C.surface }]} onPress={onPress}>
      <Text style={[s.chipTxt, { color: active ? "#fff" : C.text2 }]}>{children}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Nav bar */}
      <View style={s.nav}>
        <TouchableOpacity onPress={back} style={[s.navBtn, { backgroundColor: C.surface }]}>
          <Ionicons name="arrow-back" size={18} color={C.text2} />
        </TouchableOpacity>
        {step > 0 && (
          <View style={s.dots}>
            {[1,2,3].map(i => (
              <View key={i} style={[s.dot, { backgroundColor: i <= step ? C.accent : C.surface2, width: i === step ? 20 : 8 }]} />
            ))}
          </View>
        )}
        <TouchableOpacity onPress={skip} style={[s.navBtn, { backgroundColor: C.surface }]}>
          <Text style={[s.skipTxt, { color: C.text2 }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {step === 0 && (
          <View style={s.section}>
            <Text style={[s.bigTitle, { color: C.text }]}>Set up your{"\n"}profile</Text>
            <Text style={[s.bigSub, { color: C.text2 }]}>Takes 2 minutes. Optional — skip anytime.</Text>
            <View style={[s.infoCard, { backgroundColor: C.surface }, shadowSm]}>
              {[
                { icon: "pulse-outline", color: C.accent3, label: "BMR", desc: "Calories burned at rest (Mifflin-St Jeor)" },
                { icon: "flame-outline", color: C.accent, label: "TDEE", desc: "BMR + calories burned from your logged steps" },
                { icon: "flag-outline", color: C.accent2, label: "Goal date", desc: "Estimated date to reach your target weight" },
              ].map(({ icon, color, label, desc }) => (
                <View key={label} style={s.infoRow}>
                  <View style={[s.infoIcon, { backgroundColor: color + "22" }]}>
                    <Ionicons name={icon as any} size={16} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.infoLabel, { color: C.text }]}>{label}</Text>
                    <Text style={[s.infoDesc, { color: C.text2 }]}>{desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={s.section}>
            <Text style={[s.stepTitle, { color: C.text }]}>The basics</Text>
            <Text style={[s.stepSub, { color: C.text2 }]}>Name, sex and age</Text>
            <View style={s.field}>
              <Text style={lbl}>Your name</Text>
              <TextInput style={inp} value={name} onChangeText={setName} placeholder="e.g. Robin" placeholderTextColor={C.text2} />
            </View>
            <View style={s.field}>
              <Text style={lbl}>Biological sex</Text>
              <View style={s.chipRow}><Chip active={sex === "male"} onPress={() => setSex("male")}>Male</Chip><Chip active={sex === "female"} onPress={() => setSex("female")}>Female</Chip></View>
            </View>
            <View style={s.field}>
              <Text style={lbl}>Age</Text>
              <TextInput style={inp} value={age} onChangeText={setAge} placeholder="25" placeholderTextColor={C.text2} keyboardType="number-pad" />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={s.section}>
            <Text style={[s.stepTitle, { color: C.text }]}>Your body</Text>
            <Text style={[s.stepSub, { color: C.text2 }]}>Height and current weight</Text>
            <View style={s.field}>
              <Text style={lbl}>Height (cm)</Text>
              <TextInput style={inp} value={height} onChangeText={setHeight} placeholder="175" placeholderTextColor={C.text2} keyboardType="decimal-pad" />
            </View>
            <View style={s.field}>
              <Text style={lbl}>Current weight (kg)</Text>
              <TextInput style={inp} value={weight} onChangeText={setWeight} placeholder="75.0" placeholderTextColor={C.text2} keyboardType="decimal-pad" />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={s.section}>
            <Text style={[s.stepTitle, { color: C.text }]}>Your goal</Text>
            <Text style={[s.stepSub, { color: C.text2 }]}>Direction, target and pace</Text>
            <View style={s.field}>
              <Text style={lbl}>I want to</Text>
              <View style={s.chipRow}><Chip active={goalDir === "lose"} onPress={() => setGoalDir("lose")}>Lose weight</Chip><Chip active={goalDir === "gain"} onPress={() => setGoalDir("gain")}>Gain weight</Chip></View>
            </View>
            <View style={s.field}>
              <Text style={lbl}>Goal weight (kg)</Text>
              <TextInput style={inp} value={goalWeight} onChangeText={setGoalWeight} placeholder="68.0" placeholderTextColor={C.text2} keyboardType="decimal-pad" />
            </View>
            <View style={s.field}>
              <Text style={lbl}>Weekly pace</Text>
              <View style={[s.chipRow, { flexWrap: "wrap" }]}>
                {[0.25, 0.5, 0.75, 1.0].map(r => <Chip key={r} active={rate === r} onPress={() => setRate(r)}>{r} kg/wk</Chip>)}
              </View>
              <Text style={[s.rateNote, { color: C.text2 }]}>0.5 kg/week is the recommended safe rate for most people</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={[s.nextBtn, { backgroundColor: C.accent }, shadow]} onPress={next}>
          <Text style={s.nextBtnTxt}>
            {step === 0 ? "Get started" : step === TOTAL_STEPS ? "Save profile" : "Continue"}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  navBtn: { borderRadius: radius.full, padding: 8 },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 8, borderRadius: radius.full },
  skipTxt: { fontFamily: "InterMedium", fontSize: 14, paddingHorizontal: 4, paddingVertical: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  section: { marginBottom: 24 },
  bigTitle: { fontFamily: "LoraBold", fontSize: 40, lineHeight: 46, marginBottom: 10 },
  bigSub: { fontFamily: "Inter", fontSize: 15, lineHeight: 22, marginBottom: 24 },
  stepTitle: { fontFamily: "LoraBold", fontSize: 34, lineHeight: 38, marginBottom: 6 },
  stepSub: { fontFamily: "Inter", fontSize: 14, marginBottom: 28 },
  field: { marginBottom: 20 },
  label: { fontFamily: "InterMedium", fontSize: 13, marginBottom: 8 },
  input: { borderRadius: radius.md, padding: 14, fontFamily: "Inter", fontSize: 15 },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: { borderRadius: radius.full, paddingVertical: 10, paddingHorizontal: 20 },
  chipTxt: { fontFamily: "InterMedium", fontSize: 14 },
  infoCard: { borderRadius: radius.lg, padding: 20, gap: 16 },
  infoRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  infoIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontFamily: "InterMedium", fontSize: 14 },
  infoDesc: { fontFamily: "Inter", fontSize: 12, lineHeight: 18, marginTop: 2 },
  rateNote: { fontFamily: "Inter", fontSize: 12, lineHeight: 18, marginTop: 8 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.full, paddingVertical: 16, marginTop: 4 },
  nextBtnTxt: { fontFamily: "InterMedium", fontSize: 16, color: "#fff" },
});
