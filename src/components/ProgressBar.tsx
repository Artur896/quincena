import { StyleSheet, View } from "react-native";

import { colors, radius } from "@/theme";
import { clampPercentage } from "@/utils/money";

interface ProgressBarProps {
  percentage: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ percentage, color = colors.accent, height = 10 }: ProgressBarProps) {
  const safePercentage = clampPercentage(percentage);

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          { width: `${safePercentage}%`, backgroundColor: color, height },
        ]}
      />
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
