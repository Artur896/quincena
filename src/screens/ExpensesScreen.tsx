import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card, EmptyState, MoneyText, PrimaryButton, Screen, SectionHeader } from "@/components";
import { useAppStore } from "@/store/useAppStore";
import { colors, radius, spacing, typography } from "@/theme";

const QUICK_CATEGORIES = ["Comida", "Transporte", "Ocio", "Salud", "Otro"];

export function ExpensesScreen() {
  const expenses = useAppStore((state) => state.expenses);
  const todayExpensesTotal = useAppStore((state) => state.todayExpensesTotal);
  const addExpense = useAppStore((state) => state.addExpense);

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(QUICK_CATEGORIES[0]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!amount) return;
    setSaving(true);
    try {
      await addExpense({ amount: Number(amount), category, description });
      setAmount("");
      setDescription("");
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  }

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
                <View style={styles.rowTexts}>
                  <Text style={typography.body} numberOfLines={1}>
                    {expense.description || expense.category}
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

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={typography.title}>Nuevo gasto</Text>

            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="Monto"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción (opcional)"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
            />

            <View style={styles.categoryRow}>
              {QUICK_CATEGORIES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[styles.categoryChip, category === item && styles.categoryChipActive]}
                >
                  <Text
                    style={[
                      typography.caption,
                      category === item && { color: colors.background },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
              <View style={styles.confirmButton}>
                <PrimaryButton
                  label="Guardar"
                  onPress={handleSave}
                  disabled={!amount}
                  loading={saving}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
    marginRight: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  categoryChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cancelButton: {
    padding: spacing.sm,
  },
  confirmButton: {
    flex: 1,
  },
});
