import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

import { colors } from "@/theme";
import type { GoalCategory } from "@/types";

interface RouletteWheelProps {
  categories: GoalCategory[];
  size?: number;
  /** Ángulo final absoluto (en grados) al que debe girar la ruleta. `null` = reposo. */
  targetAngle: number | null;
  onSpinEnd?: () => void;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeSegment(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

export function RouletteWheel({ categories, size = 280, targetAngle, onSpinEnd }: RouletteWheelProps) {
  const rotation = useSharedValue(0);
  const segmentAngle = 360 / categories.length;
  const radius = size / 2;
  const labelRadius = radius * 0.62;

  useEffect(() => {
    if (targetAngle === null) return;
    rotation.value = withTiming(
      targetAngle,
      { duration: 4200, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished && onSpinEnd) {
          onSpinEnd();
        }
      },
    );
  }, [targetAngle, onSpinEnd, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.wrapper, { width: size, height: size + 20 }]}>
      <View style={styles.pointer} />
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G>
            {categories.map((category, index) => {
              const startAngle = index * segmentAngle;
              const endAngle = startAngle + segmentAngle;
              const midAngle = startAngle + segmentAngle / 2;
              const label = polarToCartesian(radius, radius, labelRadius, midAngle);
              return (
                <G key={category.id}>
                  <Path
                    d={describeSegment(radius, radius, radius - 4, startAngle, endAngle)}
                    fill={category.color}
                    fillOpacity={0.92}
                    stroke={colors.background}
                    strokeWidth={3}
                  />
                  <SvgText
                    x={label.x}
                    y={label.y}
                    fill={colors.background}
                    fontSize={13}
                    fontWeight="700"
                    textAnchor="middle"
                    transform={`rotate(${midAngle}, ${label.x}, ${label.y})`}
                  >
                    {category.name}
                  </SvgText>
                </G>
              );
            })}
          </G>
          <Circle cx={radius} cy={radius} r={radius * 0.14} fill={colors.background} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  pointer: {
    position: "absolute",
    top: -2,
    zIndex: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.accent,
  },
});
