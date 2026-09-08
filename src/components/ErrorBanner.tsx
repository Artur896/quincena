import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={16} color={colors.danger} />
      <Text style={[typography.caption, styles.text]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: {
    flex: 1,
    color: colors.danger,
  },
});
