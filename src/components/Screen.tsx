import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = true, style }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, style]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.flex, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  flex: {
    flex: 1,
  },
});
