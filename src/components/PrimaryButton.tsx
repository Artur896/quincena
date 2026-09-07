import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: PrimaryButtonProps) {
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isSecondary ? styles.secondary : styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.textPrimary : colors.background} />
      ) : (
        <Text style={[styles.label, isSecondary ? styles.labelSecondary : styles.labelPrimary]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    ...typography.subtitle,
  },
  labelPrimary: {
    color: colors.background,
  },
  labelSecondary: {
    color: colors.textPrimary,
  },
});
