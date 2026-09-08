import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card, PrimaryButton, RouletteWheel, Screen } from "@/components";
import { GOAL_CATEGORIES, getCategoryById } from "@/constants/categories";
import { useAppStore } from "@/store/useAppStore";
import { colors, spacing, typography } from "@/theme";
import { currentMonthKey, isRouletteWindowOpen, monthLabel } from "@/utils/date";
import { formatMoney } from "@/utils/money";
import { angleForCategory } from "@/utils/roulette";
import type { GoalCategory } from "@/types";

export function RouletteScreen() {
  const activeGoal = useAppStore((state) => state.activeGoal);
  const spins = useAppStore((state) => state.spins);
  const spinRoulette = useAppStore((state) => state.spinRoulette);

  const [angle, setAngle] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  // pendingCategory: ya se decidió (y escribió en la base de datos), pero la
  // rueda todavía está girando. result: solo se llena cuando la animación
  // termina — así la tarjeta/haptic de resultado nunca se adelanta al giro.
  const [pendingCategory, setPendingCategory] = useState<GoalCategory | null>(null);
  const [result, setResult] = useState<GoalCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const month = currentMonthKey();
  const alreadySpun = spins.some((spin) => spin.month === month);
  const windowOpen = isRouletteWindowOpen();

  const lockedCategory =
    !result && alreadySpun && !pendingCategory && activeGoal?.month === month
      ? getCategoryById(activeGoal.categoryId) ?? null
      : null;
  const displayedResult = result ?? lockedCategory;

  async function handleSpin() {
    setError(null);
    setResult(null);
    setSpinning(true);
    try {
      const category = await spinRoulette();
      setPendingCategory(category);
      setAngle(angleForCategory(category.id));
    } catch (err) {
      setError((err as Error).message);
      setSpinning(false);
    }
  }

  function handleSpinEnd() {
    setSpinning(false);
    setResult(pendingCategory);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={typography.display}>Ruleta</Text>
        <Text style={[typography.body, styles.subtitle]}>
          {monthLabel(month)} · gírala una sola vez y comprométete todo el mes.
        </Text>
      </View>

      <View style={styles.wheelWrap}>
        <RouletteWheel
          categories={GOAL_CATEGORIES}
          targetAngle={angle}
          onSpinEnd={handleSpinEnd}
          resultColor={pendingCategory?.color}
        />
      </View>

      {displayedResult ? (
        <Card elevated style={styles.resultCard}>
          <Text style={typography.caption}>Tu meta de {monthLabel(month)}</Text>
          <Text style={[typography.title, { color: displayedResult.color }]}>
            {displayedResult.name}
          </Text>
          <Text style={typography.caption}>
            Objetivo: {formatMoney(displayedResult.defaultTarget)} · {displayedResult.description}
          </Text>
        </Card>
      ) : null}

      {!alreadySpun && !windowOpen ? (
        <Text style={styles.notice}>
          La ruleta se abre del día 1 al 9 de cada mes. Vuelve pronto.
        </Text>
      ) : null}

      {alreadySpun && !result && !pendingCategory ? (
        <Text style={styles.notice}>
          Ya giraste este mes. Tu meta está bloqueada hasta el próximo mes.
        </Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        label={spinning ? "Girando..." : "Girar la ruleta"}
        onPress={handleSpin}
        disabled={alreadySpun || !windowOpen || spinning}
        loading={spinning}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  wheelWrap: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  resultCard: {
    gap: spacing.xs,
    alignItems: "center",
  },
  notice: {
    ...typography.caption,
    textAlign: "center",
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
  },
});
