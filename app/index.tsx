import { useEffect } from "react";
import { useRouter } from "expo-router";
import { loadProfile } from "../lib/profile";
import { View, ActivityIndicator } from "react-native";

export default function Root() {
  const router = useRouter();
  useEffect(() => {
    loadProfile().then(profile => {
      if (profile) {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    });
  }, []);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0d0d0d" }}>
      <ActivityIndicator color="#ff5c00" />
    </View>
  );
}
