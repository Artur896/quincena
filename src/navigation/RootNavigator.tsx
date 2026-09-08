import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, radius, spacing, typography } from "@/theme";
import { selectionHaptic } from "@/utils/haptics";
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

interface RootNavigatorProps {
  /** Pestaña con la que arranca la sesión. Útil para aterrizar directo en
   * Ruleta cuando el mes todavía no tiene meta, en vez de dejar al usuario
   * en Inicio viendo un estado vacío que lo manda a buscar la pestaña. */
  initialRouteName?: keyof RootTabParamList;
}

export function RootNavigator({ initialRouteName }: RootNavigatorProps) {
  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AnimatedTabBar {...props} />}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Ruleta" component={RouletteScreen} />
      <Tab.Screen name="Meta" component={GoalScreen} />
      <Tab.Screen name="Gastos" component={ExpensesScreen} />
      <Tab.Screen name="Asesor" component={AdvisorScreen} />
    </Tab.Navigator>
  );
}

function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const tabWidth = tabBarWidth / state.routes.length;
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0) {
      indicatorX.value = withTiming(state.index * tabWidth, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [state.index, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: tabWidth,
    transform: [{ translateX: indicatorX.value }],
  }));

  function handleLayout(event: LayoutChangeEvent) {
    setTabBarWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      style={[styles.tabBar, { paddingBottom: spacing.sm + insets.bottom }]}
      onLayout={handleLayout}
    >
      {tabWidth > 0 ? (
        <Animated.View style={[styles.indicatorTrack, indicatorStyle]}>
          <View style={styles.indicatorPill} />
        </Animated.View>
      ) : null}

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const color = isFocused ? colors.accent : colors.textTertiary;

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            selectionHaptic();
            navigation.navigate(route.name);
          }
        }

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
            <Ionicons
              name={TAB_ICONS[route.name as keyof RootTabParamList]}
              size={22}
              color={color}
            />
            <Text style={[typography.micro, { color }, styles.tabLabel]}>{route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabLabel: {
    marginTop: 2,
  },
  indicatorTrack: {
    position: "absolute",
    top: 0,
    alignItems: "center",
  },
  indicatorPill: {
    width: 24,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});
