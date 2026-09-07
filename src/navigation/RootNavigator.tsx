import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { colors } from "@/theme";
import { AdvisorScreen } from "@/screens/AdvisorScreen";
import { ExpensesScreen } from "@/screens/ExpensesScreen";
import { GoalScreen } from "@/screens/GoalScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { RouletteScreen } from "@/screens/RouletteScreen";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Inicio: "home",
  Ruleta: "sync",
  Meta: "flag",
  Gastos: "cart",
  Asesor: "sparkles",
};

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name as keyof RootTabParamList]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Ruleta" component={RouletteScreen} />
      <Tab.Screen name="Meta" component={GoalScreen} />
      <Tab.Screen name="Gastos" component={ExpensesScreen} />
      <Tab.Screen name="Asesor" component={AdvisorScreen} />
    </Tab.Navigator>
  );
}
