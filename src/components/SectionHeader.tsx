import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

interface SectionHeaderProps {
  title: string;
  action?: string;
  onPressAction?: () => void;
}

export function SectionHeader({ title, action, onPressAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={typography.subtitle}>{title}</Text>
      {action ? (
        <Text style={styles.action} onPress={onPressAction}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  action: {
    ...typography.caption,
    color: colors.accent,
  },
});
