import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, radius } from "@/theme";
import { clampPercentage } from "@/utils/money";

interface ProgressBarProps {
  percentage: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ percentage, color = colors.accent, height = 10 }: ProgressBarProps) {
  const safePercentage = clampPercentage(percentage);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(safePercentage, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [safePercentage, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color, height }, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    overflow: "hidden",
  },
  fill: {
    borderRadius: radius.pill,
  },
});
