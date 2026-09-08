import { useEffect, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors, radius, spacing, typography } from "@/theme";
import { tapHaptic } from "@/utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
  icon?: ReactNode;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
  icon,
}: PrimaryButtonProps) {
  const isSecondary = variant === "secondary";
  const isInactive = disabled || loading;
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.25);

  useEffect(() => {
    if (isSecondary || isInactive) {
      glow.value = withTiming(0.25, { duration: 300 });
      return;
    }
    glow.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.25, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [isSecondary, isInactive, glow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: isSecondary ? 0 : glow.value,
  }));

  function handlePressIn() {
    scale.value = withTiming(0.96, { duration: 110, easing: Easing.out(Easing.quad) });
    tapHaptic();
  }

  function handlePressOut() {
    scale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.back(1.6)) });
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isInactive}
      style={[
        styles.base,
        isSecondary ? styles.secondary : styles.primary,
        isInactive && styles.disabled,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.textPrimary : colors.background} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, isSecondary ? styles.labelSecondary : styles.labelPrimary]}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    elevation: 3,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.4,
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
