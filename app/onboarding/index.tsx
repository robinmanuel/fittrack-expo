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

// Step 0 = Welcome, steps 1-3 = data entry
const TOTAL_DATA_STEPS = 3;

export default function OnboardingScreen() {
  const { colors: C } = useTheme();
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
  const back = () => {
    if (step === 0) { router.back(); return; }
    setStep(s => s - 1);
  };

  const next = () => {
    if (step === 1 && (!name.trim() || !age)) {
      Alert.alert("Missing info", "Fill in all fields"); return;
    }
    if (step === 2 && (!height || !weight)) {
      Alert.alert("Missing info", "Enter height and weight"); return;
    }
    if (step === 3 && !goalWeight) {
      Alert.alert("Missing info", "Enter your goal weight"); return;
    }
    if (step < TOTAL_DATA_STEPS) { setStep(s => s + 1); return; }
    finish();
  };

  const finish = async () => {
    const profile: UserProfile = {
      name: name.trim(),
      sex, age: parseInt(age),
      height: parseFloat(height),
      weight: parseFloat(weight),
      goalWeight: parseFloat(goalWeight),
      goalDirection: goalDir,
      weeklyRateKg: rate,
    };
    await save(profile);
    router.replace("/(tabs)");
  };

  const inp = [sty.input, { backgroundColor: C.bg2, borderColor: C.border, color: C.text }];
  const lbl = [sty.label, { color: C.text2 }];

  const Sel = ({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) => (
    <TouchableOpacity
      style={[sty.selBtn, { borderColor: C.border, backgroundColor: active ? C.accent : C.surface2 }]}
      onPress={onPress}
    >
      <Text style={[sty.selText, { color: active ? "#fff" : C.text }]}>{children}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[sty.container, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[sty.header, { backgroundColor: C.accent, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={back} style={sty.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={sty.headerTitle}>PROFILE SETUP</Text>
        <TouchableOpacity onPress={skip} style={sty.skipBtn}>
          <Text style={sty.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots (only for data steps) */}
      {step > 0 && (
        <View style={[sty.progressBar, { backgroundColor: C.surface2, borderBottomColor: C.border }]}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[sty.progressDot, {
              backgroundColor: i <= step ? C.accent : C.surface2,
              borderColor: C.border,
              width: i === step ? 24 : 10,
            }]} />
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={sty.scroll} keyboardShouldPersistTaps="handled">

        {/* ── STEP 0: Welcome ─────────────────────── */}
        {step === 0 && (
          <View style={sty.section}>
            <Text style={[sty.bigTitle, { color: C.text }]}>SETUP{"\n"}YOUR{"\n"}PROFILE</Text>
            <Text style={[sty.bigSub, { color: C.text2 }]}>
              // takes 2 minutes{"\n"}// optional — skip anytime
            </Text>

            <View style={[sty.infoBox, { backgroundColor: C.surface, borderColor: C.border }]}>
              {[
                { icon: "pulse", color: C.accent3, label: "BMR", desc: "Calories burned at complete rest using Mifflin-St Jeor" },
                { icon: "flame", color: C.accent, label: "TDEE", desc: "BMR + calories burned from your logged steps" },
                { icon: "flag", color: C.accent2, label: "GOAL DATE", desc: "Estimated date to reach your target weight" },
              ].map(({ icon, color, label, desc }) => (
                <View key={label} style={sty.infoRow}>
                  <View style={[sty.infoIcon, { backgroundColor: color, borderColor: C.border }]}>
                    <Ionicons name={icon as any} size={13} color="#000" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[sty.infoLabel, { color: C.text }]}>{label}</Text>
                    <Text style={[sty.infoDesc, { color: C.text2 }]}>{desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── STEP 1: Name, Sex, Age ───────────────── */}
        {step === 1 && (
          <View style={sty.section}>
            <Text style={[sty.stepTitle, { color: C.text }]}>THE BASICS</Text>
            <Text style={[sty.stepSub, { color: C.text2 }]}>// name, sex, age</Text>

            <View style={sty.field}>
              <Text style={lbl}>YOUR NAME</Text>
              <TextInput style={inp} value={name} onChangeText={setName}
                placeholder="e.g. Robin" placeholderTextColor={C.text2} />
            </View>
            <View style={sty.field}>
              <Text style={lbl}>BIOLOGICAL SEX</Text>
              <View style={sty.row}>
                <Sel active={sex === "male"} onPress={() => setSex("male")}>♂  MALE</Sel>
                <Sel active={sex === "female"} onPress={() => setSex("female")}>♀  FEMALE</Sel>
              </View>
            </View>
            <View style={sty.field}>
              <Text style={lbl}>AGE (years)</Text>
              <TextInput style={inp} value={age} onChangeText={setAge}
                placeholder="25" placeholderTextColor={C.text2} keyboardType="number-pad" />
            </View>
          </View>
        )}

        {/* ── STEP 2: Height, Weight ───────────────── */}
        {step === 2 && (
          <View style={sty.section}>
            <Text style={[sty.stepTitle, { color: C.text }]}>YOUR BODY</Text>
            <Text style={[sty.stepSub, { color: C.text2 }]}>// height & current weight</Text>

            <View style={sty.field}>
              <Text style={lbl}>HEIGHT (cm)</Text>
              <TextInput style={inp} value={height} onChangeText={setHeight}
                placeholder="175" placeholderTextColor={C.text2} keyboardType="decimal-pad" />
            </View>
            <View style={sty.field}>
              <Text style={lbl}>CURRENT WEIGHT (kg)</Text>
              <TextInput style={inp} value={weight} onChangeText={setWeight}
                placeholder="75.0" placeholderTextColor={C.text2} keyboardType="decimal-pad" />
            </View>
          </View>
        )}

        {/* ── STEP 3: Goal ─────────────────────────── */}
        {step === 3 && (
          <View style={sty.section}>
            <Text style={[sty.stepTitle, { color: C.text }]}>YOUR GOAL</Text>
            <Text style={[sty.stepSub, { color: C.text2 }]}>// direction, target, rate</Text>

            <View style={sty.field}>
              <Text style={lbl}>I WANT TO</Text>
              <View style={sty.row}>
                <Sel active={goalDir === "lose"} onPress={() => setGoalDir("lose")}>📉 LOSE</Sel>
                <Sel active={goalDir === "gain"} onPress={() => setGoalDir("gain")}>📈 GAIN</Sel>
              </View>
            </View>

            <View style={sty.field}>
              <Text style={lbl}>GOAL WEIGHT (kg)</Text>
              <TextInput style={inp} value={goalWeight} onChangeText={setGoalWeight}
                placeholder="68.0" placeholderTextColor={C.text2} keyboardType="decimal-pad" />
            </View>

            <View style={sty.field}>
              <Text style={lbl}>WEEKLY RATE (kg/week)</Text>
              <View style={sty.rateGrid}>
                {[0.25, 0.5, 0.75, 1.0].map(r => (
                  <Sel key={r} active={rate === r} onPress={() => setRate(r)}>
                    {r} kg/wk
                  </Sel>
                ))}
              </View>
              <Text style={[sty.rateNote, { color: C.text2 }]}>
                ⚡ 0.5 kg/week is the recommended safe rate
              </Text>
            </View>
          </View>
        )}

        {/* Nav */}
        <View style={sty.navRow}>
          <TouchableOpacity
            style={[sty.navBtn, { borderColor: C.border, backgroundColor: C.accent }]}
            onPress={next}
          >
            <Text style={sty.navBtnText}>
              {step === 0 ? "START SETUP →" : step === TOTAL_DATA_STEPS ? "SAVE & GO →" : "NEXT →"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const sty = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: 3,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontFamily: "BebasNeue", fontSize: 24, color: "#fff", letterSpacing: 2, flex: 1 },
  skipBtn: { borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", paddingVertical: 4, paddingHorizontal: 10 },
  skipText: { fontFamily: "BebasNeue", fontSize: 16, color: "#fff", letterSpacing: 1 },
  progressBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderBottomWidth: 2,
  },
  progressDot: { height: 8, borderRadius: 4, borderWidth: 2 },
  scroll: { padding: 20, paddingBottom: 60 },
  section: { marginBottom: 16 },
  bigTitle: { fontFamily: "BebasNeue", fontSize: 56, lineHeight: 54, marginBottom: 12 },
  bigSub: { fontFamily: "SpaceMono", fontSize: 12, lineHeight: 22, marginBottom: 28 },
  stepTitle: { fontFamily: "BebasNeue", fontSize: 42, lineHeight: 44, marginBottom: 4 },
  stepSub: { fontFamily: "SpaceMono", fontSize: 12, marginBottom: 28 },
  field: { marginBottom: 20 },
  label: { fontFamily: "SpaceMono", fontSize: 10, letterSpacing: 1.2, marginBottom: 8 },
  input: { borderWidth: 2, padding: 13, fontFamily: "SpaceMono", fontSize: 15, fontWeight: "600" },
  row: { flexDirection: "row", gap: 10 },
  selBtn: { flex: 1, borderWidth: 2, paddingVertical: 14, alignItems: "center" },
  selText: { fontFamily: "BebasNeue", fontSize: 18, letterSpacing: 1 },
  rateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  rateNote: { fontFamily: "SpaceMono", fontSize: 10, lineHeight: 16 },
  infoBox: { borderWidth: 2, padding: 16, gap: 16 },
  infoRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  infoIcon: { width: 28, height: 28, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontFamily: "BebasNeue", fontSize: 16, letterSpacing: 1 },
  infoDesc: { fontFamily: "SpaceMono", fontSize: 10, lineHeight: 16, marginTop: 2 },
  navRow: { marginTop: 8 },
  navBtn: { borderWidth: 2, paddingVertical: 15, alignItems: "center" },
  navBtnText: { fontFamily: "BebasNeue", fontSize: 22, color: "#fff", letterSpacing: 1.5 },
});
