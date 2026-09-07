import { StyleSheet, Text, View } from "react-native";

import {
  Card,
  CategoryPill,
  EmptyState,
  MoneyText,
  MovementRow,
  ProgressBar,
  Screen,
  SectionHeader,
} from "@/components";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { colors, spacing, typography } from "@/theme";
import { formatMoney, progressPercentage } from "@/utils/money";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function HomeScreen() {
  const summary = useFinancialSummary();
  const { currentGoal, currentCategory } = summary;

  return (
    <Screen>
      <View style={styles.greetingBlock}>
        <Text style={typography.caption}>{greeting()}</Text>
        <Text style={typography.display}>Tu enfoque de hoy</Text>
      </View>

      <Card elevated style={styles.goalCard}>
        {currentGoal && currentCategory ? (
          <>
            <View style={styles.goalHeader}>
              <CategoryPill category={currentCategory} />
              <Text style={typography.caption}>Meta del mes</Text>
            </View>
            <MoneyText amount={currentGoal.accumulatedAmount} variant="display" />
            <Text style={typography.caption}>
              de {formatMoney(currentGoal.targetAmount)} objetivo
            </Text>
            <ProgressBar
              percentage={progressPercentage(currentGoal.accumulatedAmount, currentGoal.targetAmount)}
              color={currentCategory.color}
            />
          </>
        ) : (
          <EmptyState
            icon="sync-outline"
            title="Aún no giras la ruleta este mes"
            description="Ve a la pestaña Ruleta para comprometerte con una meta."
          />
        )}
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={typography.caption}>Dinero libre</Text>
          <MoneyText amount={summary.freeMoney} variant="title" />
        </Card>
        <Card style={styles.statCard}>
          <Text style={typography.caption}>Gastos de hoy</Text>
          <MoneyText amount={summary.todayExpenses} variant="title" color={colors.danger} />
        </Card>
      </View>

      <View>
        <SectionHeader title="Movimientos recientes" />
        {summary.recentMovements.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Sin movimientos todavía"
            description="Tus aportes y gastos aparecerán aquí."
          />
        ) : (
          summary.recentMovements.map((movement) => (
            <MovementRow key={`${movement.type}-${movement.id}`} movement={movement} />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetingBlock: {
    gap: 4,
  },
  goalCard: {
    gap: spacing.sm,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    gap: 4,
  },
});
