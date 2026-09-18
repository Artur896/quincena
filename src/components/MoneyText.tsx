import { useEffect } from "react";
import { StyleSheet, TextInput, type TextInputProps, type TextStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, typography } from "@/theme";
import { formatMoney, formatMoneyWorklet } from "@/utils/money";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface MoneyTextProps {
  amount: number;
  variant?: "display" | "title" | "body";
  color?: string;
  style?: TextStyle;
}

const variantStyle = {
  display: typography.money,
  title: typography.title,
  body: typography.subtitle,
};

// TextInput (no Text) porque Reanimated solo puede mutar la prop nativa
// `text` de forma imperativa en un input editable; con editable={false} se
// ve y se comporta como texto estático mientras el número hace count-up.
export function MoneyText({ amount, variant = "body", color, style }: MoneyTextProps) {
  const animatedValue = useSharedValue(amount);

  useEffect(() => {
    animatedValue.value = withTiming(amount, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [amount, animatedValue]);

  const animatedProps = useAnimatedProps(
    () =>
      ({
        text: formatMoneyWorklet(animatedValue.value),
      }) as Partial<TextInputProps>,
  );

  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      defaultValue={formatMoney(amount)}
      animatedProps={animatedProps}
      style={[variantStyle[variant], color ? { color } : null, styles.input, style]}
    />
  );
}

export function SignedMoneyText({ amount, style }: { amount: number; style?: TextStyle }) {
  const isNegative = amount < 0;
  const sign = isNegative ? "-" : "+";
  const signColor = isNegative ? colors.danger : colors.success;
  const animatedValue = useSharedValue(Math.abs(amount));

  useEffect(() => {
    animatedValue.value = withTiming(Math.abs(amount), {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [amount, animatedValue]);

  const animatedProps = useAnimatedProps(
    () =>
      ({
        text: `${sign}${formatMoneyWorklet(animatedValue.value)}`,
      }) as Partial<TextInputProps>,
  );

  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      defaultValue={`${sign}${formatMoney(Math.abs(amount))}`}
      animatedProps={animatedProps}
      style={[typography.subtitle, { color: signColor }, styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
  },
});
