import { Stack } from "expo-router";
import { ThemeProvider } from "../../hooks/useTheme";
import { ProfileProvider } from "../../hooks/useProfile";

export default function OnboardingLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ProfileProvider>
    </ThemeProvider>
  );
}
