import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

import { colors } from "@/theme";
import type { GoalCategory } from "@/types";

interface RouletteWheelProps {
  categories: GoalCategory[];
  /** Diámetro fijo en px. Si se omite, se calcula a partir del ancho de pantalla. */
  size?: number;
  /** Ángulo final absoluto (en grados) al que debe girar la ruleta. `null` = reposo. */
  targetAngle: number | null;
  onSpinEnd?: () => void;
  /** Color de la categoría ganadora, usado en el pulso/chispas al caer el resultado. */
  resultColor?: string;
}

const SPARK_COUNT = 8;

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

export function RouletteWheel({
  categories,
  size,
  targetAngle,
  onSpinEnd,
  resultColor,
}: RouletteWheelProps) {
  const { width: windowWidth } = useWindowDimensions();
  // Clamp entre 220 y 300: cabe en pantallas angostas y no se ve minúscula
  // en el contenedor de 480px máx. de Screen en pantallas anchas/web.
  const resolvedSize = size ?? Math.min(300, Math.max(220, windowWidth - 96));
  const rotation = useSharedValue(0);
  const burst = useSharedValue(0);
  const segmentAngle = 360 / categories.length;
  const radius = resolvedSize / 2;
  const labelRadius = radius * 0.62;
  const burstColor = resultColor ?? colors.accent;

  const sparkAngles = useMemo(
    () => Array.from({ length: SPARK_COUNT }, (_, i) => (360 / SPARK_COUNT) * i),
    [],
  );

  useEffect(() => {
    if (targetAngle === null) return;
    burst.value = 0;
    rotation.value = withTiming(
      targetAngle,
      { duration: 4200, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          burst.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) });
          if (onSpinEnd) {
            onSpinEnd();
          }
        }
      },
    );
  }, [targetAngle, onSpinEnd, rotation, burst]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.4, 1], [0.6, 0.35, 0]),
    transform: [{ scale: interpolate(burst.value, [0, 1], [0.4, 2.4]) }],
  }));

  return (
    <View style={[styles.wrapper, { width: resolvedSize, height: resolvedSize + 20 }]}>
      <View style={styles.pointer} />
      <Animated.View style={[{ width: resolvedSize, height: resolvedSize }, animatedStyle]}>
        <Svg width={resolvedSize} height={resolvedSize} viewBox={`0 0 ${resolvedSize} ${resolvedSize}`}>
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

      <View pointerEvents="none" style={[styles.burstOverlay, { width: resolvedSize, height: resolvedSize }]}>
        <Animated.View style={[styles.pulse, { backgroundColor: burstColor }, pulseStyle]} />
        {sparkAngles.map((angleDeg) => (
          <Spark
            key={angleDeg}
            burst={burst}
            angleDeg={angleDeg}
            distance={radius * 0.55}
            color={burstColor}
          />
        ))}
      </View>
    </View>
  );
}

function Spark({
  burst,
  angleDeg,
  distance,
  color,
}: {
  burst: SharedValue<number>;
  angleDeg: number;
  distance: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const rad = (angleDeg * Math.PI) / 180;
    const d = interpolate(burst.value, [0, 1], [0, distance]);
    return {
      opacity: interpolate(burst.value, [0, 0.15, 1], [0, 1, 0]),
      transform: [
        { translateX: Math.cos(rad) * d },
        { translateY: Math.sin(rad) * d },
        { scale: interpolate(burst.value, [0, 1], [0.8, 0.1]) },
      ],
    };
  });

  return <Animated.View style={[styles.spark, { backgroundColor: color }, style]} />;
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
  burstOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  spark: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
