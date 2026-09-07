import { Text, type TextStyle } from "react-native";

import { colors, typography } from "@/theme";
import { formatMoney } from "@/utils/money";

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

export function MoneyText({ amount, variant = "body", color, style }: MoneyTextProps) {
  return (
    <Text style={[variantStyle[variant], color ? { color } : null, style]}>
      {formatMoney(amount)}
    </Text>
  );
}

export function SignedMoneyText({ amount, style }: { amount: number; style?: TextStyle }) {
  const isNegative = amount < 0;
  return (
    <Text
      style={[
        typography.subtitle,
        { color: isNegative ? colors.danger : colors.success },
        style,
      ]}
    >
      {isNegative ? "-" : "+"}
      {formatMoney(Math.abs(amount))}
    </Text>
  );
}
