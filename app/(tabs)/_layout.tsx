import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeProvider } from "../../hooks/useTheme";
import { RecordsProvider } from "../../hooks/useRecords";
import { ProfileProvider } from "../../hooks/useProfile";

function TabsContent() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 3,
          borderTopColor: colors.border,
          height: 60,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text2,
        tabBarLabelStyle: {
          fontFamily: "SpaceMono",
          fontSize: 9,
          letterSpacing: 1,
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: "DASHBOARD",
        tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
      }} />
      <Tabs.Screen name="log" options={{
        title: "LOG",
        tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
      }} />
      <Tabs.Screen name="charts" options={{
        title: "CHARTS",
        tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
      }} />
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
