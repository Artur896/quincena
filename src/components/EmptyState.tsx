import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={28} color={colors.textTertiary} />
      <Text style={[typography.subtitle, styles.title]}>{title}</Text>
      <Text style={[typography.caption, styles.description]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    maxWidth: 240,
  },
});
