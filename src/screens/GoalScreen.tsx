import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card, CategoryPill, EmptyState, MoneyText, ProgressBar, Screen, SectionHeader } from "@/components";
import { getCategoryById } from "@/constants/categories";
import { useAppStore } from "@/store/useAppStore";
import { colors, spacing, typography } from "@/theme";
import { estimateCompletionDate, groupContributionsByMonth } from "@/utils/accumulation";
import { monthLabel } from "@/utils/date";
import { formatMoney, progressPercentage } from "@/utils/money";

export function GoalScreen() {
  const activeGoal = useAppStore((state) => state.activeGoal);
  const goalHistory = useAppStore((state) => state.goalHistory);
  const contributions = useAppStore((state) => state.contributions);
  const incomeConfig = useAppStore((state) => state.incomeConfig);

  const category = activeGoal ? getCategoryById(activeGoal.categoryId) : null;

  const monthlyHistory = useMemo(() => {
    return Object.entries(groupContributionsByMonth(contributions)).sort((a, b) =>
      b[0].localeCompare(a[0]),
    );
  }, [contributions]);

  const estimatedCompletion = useMemo(() => {
    if (!activeGoal || !incomeConfig) return null;
    return estimateCompletionDate(activeGoal, incomeConfig.goalsAllocation);
  }, [activeGoal, incomeConfig]);

  if (!activeGoal || !category) {
    return (
      <Screen>
        <Text style={typography.display}>Meta</Text>
        <EmptyState
          icon="flag-outline"
          title="Sin meta activa"
          description="Gira la ruleta este mes para comprometerte con una meta."
        />
      </Screen>
    );
  }

  const percentage = progressPercentage(activeGoal.accumulatedAmount, activeGoal.targetAmount);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={typography.display}>Meta</Text>
        <CategoryPill category={category} />
      </View>

      <Card elevated style={styles.progressCard}>
        <Text style={typography.caption}>Acumulado en {monthLabel(activeGoal.month)}</Text>
        <MoneyText amount={activeGoal.accumulatedAmount} variant="display" />
        <Text style={typography.caption}>Meta total: {formatMoney(activeGoal.targetAmount)}</Text>
        <ProgressBar percentage={percentage} color={category.color} />
        <Text style={[typography.caption, styles.percentage]}>{Math.round(percentage)}% completado</Text>
      </Card>

      <Card>
        <Text style={typography.caption}>Fecha estimada para completar la meta</Text>
        <Text style={typography.subtitle}>
          {estimatedCompletion
            ? estimatedCompletion.toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : activeGoal.accumulatedAmount >= activeGoal.targetAmount
              ? "¡Meta completada!"
              : "Configura tu ingreso para calcularla"}
        </Text>
      </Card>

      <View>
        <SectionHeader title="Historial mensual" />
        {monthlyHistory.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Sin historial todavía"
            description="Cada quincena que aportes queda registrada aquí para siempre."
          />
        ) : (
          <Card>
            {monthlyHistory.map(([month, amount], index) => (
              <View
                key={month}
                style={[styles.historyRow, index === 0 && styles.historyRowFirst]}
              >
                <Text style={typography.body}>{monthLabel(month)}</Text>
                <MoneyText amount={amount} variant="body" />
              </View>
            ))}
          </Card>
        )}
      </View>

      {goalHistory.length > 0 ? (
        <View>
          <SectionHeader title="Metas anteriores" />
          <Card>
            {goalHistory
              .filter((goal) => goal.id !== activeGoal.id)
              .map((goal, index) => {
                const goalCategory = getCategoryById(goal.categoryId);
                return (
                  <View
                    key={goal.id}
                    style={[styles.historyRow, index === 0 && styles.historyRowFirst]}
                  >
                    <View>
                      <Text style={typography.body}>{goalCategory?.name ?? goal.categoryId}</Text>
                      <Text style={typography.caption}>{monthLabel(goal.month)}</Text>
                    </View>
                    <Text style={[typography.caption, goal.status === "completed" && styles.completed]}>
                      {goal.status === "completed" ? "Completada" : "En progreso"}
                    </Text>
                  </View>
                );
              })}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  progressCard: {
    gap: spacing.xs,
  },
  percentage: {
    marginTop: spacing.xs,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyRowFirst: {
    borderTopWidth: 0,
  },
  completed: {
    color: colors.success,
  },
});
