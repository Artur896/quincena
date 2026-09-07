import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";
import type { Movement } from "@/types";
import { SignedMoneyText } from "./MoneyText";

const ICONS: Record<Movement["type"], keyof typeof Ionicons.glyphMap> = {
  contribution: "trending-up",
  expense: "cart-outline",
  roulette: "sync-outline",
};

export function MovementRow({ movement }: { movement: Movement }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={ICONS[movement.type]} size={18} color={colors.textPrimary} />
      </View>
      <View style={styles.texts}>
        <Text style={typography.body} numberOfLines={1}>
          {movement.title}
        </Text>
        <Text style={typography.caption}>{movement.subtitle}</Text>
      </View>
      <SignedMoneyText amount={movement.amount} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
