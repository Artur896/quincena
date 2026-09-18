import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AddExpenseModal, Card, EmptyState, MoneyText, PrimaryButton, Screen, SectionHeader } from "@/components";
import { useAppStore } from "@/store/useAppStore";
import { colors, radius, spacing, typography } from "@/theme";

export function ExpensesScreen() {
  const expenses = useAppStore((state) => state.expenses);
  const todayExpensesTotal = useAppStore((state) => state.todayExpensesTotal);

  const [modalVisible, setModalVisible] = useState(false);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={typography.display}>Gastos</Text>
        <Text style={[typography.body, styles.subtitle]}>Registra lo que gastas fuera de tus metas.</Text>
      </View>

      <Animated.View entering={FadeInDown.delay(40).duration(400)}>
        <Card elevated>
          <Text style={typography.caption}>Gastado hoy</Text>
          <MoneyText amount={todayExpensesTotal} variant="display" color={colors.danger} />
        </Card>
      </Animated.View>

      <PrimaryButton label="Registrar gasto" onPress={() => setModalVisible(true)} />

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <SectionHeader title="Historial" />
        {expenses.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="Sin gastos registrados"
            description="Los gastos manuales que agregues aparecerán aquí."
          />
        ) : (
          <Card>
            {expenses.map((expense, index) => (
              <Animated.View
                key={expense.id}
                entering={FadeInDown.duration(300)}
                style={[styles.row, index === 0 && styles.rowFirst]}
              >
                {expense.photoUrl ? (
                  <Image source={{ uri: expense.photoUrl }} style={styles.rowThumbnail} />
                ) : null}
                <View style={styles.rowTexts}>
                  <Text style={typography.body} numberOfLines={1}>
                    {expense.title || expense.category}
                  </Text>
                  <Text style={typography.caption}>
                    {expense.category} · {new Date(expense.date).toLocaleDateString("es-MX")}
                  </Text>
                </View>
                <MoneyText amount={expense.amount} variant="body" color={colors.danger} />
              </Animated.View>
            ))}
          </Card>
        )}
      </Animated.View>

      <AddExpenseModal visible={modalVisible} onClose={() => setModalVisible(false)} />
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowThumbnail: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
});
