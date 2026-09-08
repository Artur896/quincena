import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from "react-native-svg";

import { colors } from "@/theme";
import { successHaptic } from "@/utils/haptics";
import { getSegmentLayout } from "@/utils/roulette";
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

/** Evita etiquetas de cabeza en la mitad inferior de la rueda: en ese rango
 * el rotate() de SVG las voltearía 180° respecto a una lectura normal. */
function readableLabelRotation(midAngle: number): number {
  const normalized = ((midAngle % 360) + 360) % 360;
  return normalized > 90 && normalized < 270 ? midAngle + 180 : midAngle;
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
  const radius = resolvedSize / 2;
  const labelRadius = radius * 0.64;
  const burstColor = resultColor ?? colors.accent;

  const segments = useMemo(() => getSegmentLayout(categories), [categories]);

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
          successHaptic();
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
    <View style={[styles.wrapper, { width: resolvedSize, height: resolvedSize + 24 }]}>
      <View style={styles.pointerPin} />
      <View style={styles.pointer} />

      <View style={[styles.rim, { width: resolvedSize + 16, height: resolvedSize + 16, borderRadius: (resolvedSize + 16) / 2 }]} />
      <View style={[styles.trim, { width: resolvedSize + 8, height: resolvedSize + 8, borderRadius: (resolvedSize + 8) / 2 }]} />

      <Animated.View style={[{ width: resolvedSize, height: resolvedSize }, animatedStyle]}>
        <Svg width={resolvedSize} height={resolvedSize} viewBox={`0 0 ${resolvedSize} ${resolvedSize}`}>
          <Defs>
            <RadialGradient id="wheelSheen" cx="35%" cy="26%" r="70%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.24} />
              <Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.06} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <G>
            {segments.map(({ category, startAngle, endAngle }) => (
              <Path
                key={category.id}
                d={describeSegment(radius, radius, radius - 4, startAngle, endAngle)}
                fill={category.color}
                stroke={colors.background}
                strokeWidth={3}
              />
            ))}
          </G>
          {/* Brillo global, no por segmento: da profundidad sin romper los colores planos de cada categoría. */}
          <Circle cx={radius} cy={radius} r={radius - 4} fill="url(#wheelSheen)" />
          <Circle cx={radius} cy={radius} r={radius - 1} fill="none" stroke={colors.background} strokeWidth={2} />
          <Circle cx={radius} cy={radius} r={radius * 0.15} fill={colors.surface} stroke={colors.accent} strokeWidth={2} />
          <Circle cx={radius} cy={radius} r={3} fill={colors.accent} />
        </Svg>

        {/* Ícono + nombre por segmento, como Views normales (no SVG) para
            poder usar los mismos glifos de Ionicons que el resto de la app;
            viven dentro del mismo Animated.View que gira, así quedan
            pegados a su segmento en todo momento. */}
        {segments.map(({ category, midAngle }) => {
          const label = polarToCartesian(radius, radius, labelRadius, midAngle);
          return (
            <View
              key={category.id}
              pointerEvents="none"
              style={[
                styles.segmentLabel,
                {
                  left: label.x - 22,
                  top: label.y - 18,
                  transform: [{ rotate: `${readableLabelRotation(midAngle)}deg` }],
                },
              ]}
            >
              <Ionicons
                name={category.icon as keyof typeof Ionicons.glyphMap}
                size={15}
                color={colors.background}
              />
              <Text style={styles.segmentLabelText}>{category.name}</Text>
            </View>
          );
        })}
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
  rim: {
    position: "absolute",
    top: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  trim: {
    position: "absolute",
    top: 8,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  segmentLabel: {
    position: "absolute",
    width: 44,
    alignItems: "center",
    gap: 1,
  },
  segmentLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.background,
  },
  pointerPin: {
    position: "absolute",
    top: 6,
    zIndex: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
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
    top: 4,
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
