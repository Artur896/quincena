import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";
import type { GoalCategory } from "@/types";

export function CategoryPill({ category }: { category: GoalCategory }) {
  return (
    <View style={[styles.pill, { borderColor: category.color }]}>
      <Ionicons
        name={category.icon as keyof typeof Ionicons.glyphMap}
        size={14}
        color={category.color}
      />
      <Text style={[typography.caption, { color: category.color }]}>{category.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceElevated,
    alignSelf: "flex-start",
  },
});
