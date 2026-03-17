import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeProvider } from "../../hooks/useTheme";
import { RecordsProvider } from "../../hooks/useRecords";
import { ProfileProvider } from "../../hooks/useProfile";
import { radius } from "../../lib/theme";

function TabsContent() {
  const { colors } = useTheme();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopWidth: 0,
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        height: 64,
        paddingBottom: 8,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.text2,
      tabBarLabelStyle: { fontFamily: "Inter", fontSize: 11, marginTop: 2 },
    }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="log"   options={{ title: "Log",  tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="charts" options={{ title: "Charts", tabBarIcon: ({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <RecordsProvider>
          <TabsContent />
        </RecordsProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}
