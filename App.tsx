import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";

import { useAuth } from "@/hooks/useAuth";
import { RootNavigator } from "@/navigation/RootNavigator";
import { LoginScreen } from "@/screens/LoginScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { setupDailyExpenseReminder } from "@/services/notificationsService";
import { useAppStore } from "@/store/useAppStore";
import { colors } from "@/theme";
import { fontsToLoad } from "@/theme/fonts";
import { currentMonthKey, isRouletteWindowOpen } from "@/utils/date";

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.accent,
    text: colors.textPrimary,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);
  const { userId, isLoading: authLoading } = useAuth();
  const initialize = useAppStore((state) => state.initialize);
  const hasSavedIncomeConfig = useAppStore((state) => state.hasSavedIncomeConfig);
  const hasInitialized = useAppStore((state) => state.hasInitialized);
  const activeGoal = useAppStore((state) => state.activeGoal);

  useEffect(() => {
    if (userId) {
      void initialize(userId);
    }
  }, [userId, initialize]);

  useEffect(() => {
    if (userId && hasSavedIncomeConfig) {
      void setupDailyExpenseReminder();
    }
  }, [userId, hasSavedIncomeConfig]);

  if (!fontsLoaded) {
    return <Loading />;
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navigationTheme}>
          {authLoading ? (
            <Loading />
          ) : !userId ? (
            <LoginScreen />
          ) : !hasInitialized ? (
            <Loading />
          ) : !hasSavedIncomeConfig ? (
            <OnboardingScreen />
          ) : (
            <RootNavigator
              initialRouteName={
                (!activeGoal || activeGoal.month !== currentMonthKey()) && isRouletteWindowOpen()
                  ? "Ruleta"
                  : "Inicio"
              }
            />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
