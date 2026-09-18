import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AddExpenseModal, Card, ErrorBanner, PrimaryButton, RouletteWheel, Screen } from "@/components";
import { CUSTOM_CATEGORY_COLORS, CUSTOM_CATEGORY_ICONS } from "@/constants/categories";
import { useAppStore } from "@/store/useAppStore";
import { colors, radius, spacing, typography } from "@/theme";
import { currentMonthKey, isRouletteWindowOpen, monthLabel } from "@/utils/date";
import { formatMoney } from "@/utils/money";
import { angleForCategory } from "@/utils/roulette";
import type { GoalCategory } from "@/types";

export function RouletteScreen() {
  const activeGoal = useAppStore((state) => state.activeGoal);
  const spins = useAppStore((state) => state.spins);
  const categories = useAppStore((state) => state.categories);
  const spinRoulette = useAppStore((state) => state.spinRoulette);
  const addCategory = useAppStore((state) => state.addCategory);

  const [angle, setAngle] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  // pendingCategory: ya se decidió (y escribió en la base de datos), pero la
  // rueda todavía está girando. result: solo se llena cuando la animación
  // termina — así la tarjeta/haptic de resultado nunca se adelanta al giro.
  const [pendingCategory, setPendingCategory] = useState<GoalCategory | null>(null);
  const [result, setResult] = useState<GoalCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState<string>(CUSTOM_CATEGORY_ICONS[0]);
  const [color, setColor] = useState<string>(CUSTOM_CATEGORY_COLORS[0]);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const month = currentMonthKey();
  const alreadySpun = spins.some((spin) => spin.month === month);
  const windowOpen = isRouletteWindowOpen();

  const lockedCategory =
    !result && alreadySpun && !pendingCategory && activeGoal?.month === month
      ? (categories.find((category) => category.id === activeGoal.categoryId) ?? null)
      : null;
  const displayedResult = result ?? lockedCategory;

  async function handleSpin() {
    setError(null);
    setResult(null);
    setSpinning(true);
    try {
      const category = await spinRoulette();
      setPendingCategory(category);
      setAngle(angleForCategory(category.id, categories));
    } catch (err) {
      setError((err as Error).message);
      setSpinning(false);
    }
  }

  function handleSpinEnd() {
    setSpinning(false);
    setResult(pendingCategory);
  }

  function openCategoryModal() {
    setCategoryError(null);
    setName("");
    setTarget("");
    setIcon(CUSTOM_CATEGORY_ICONS[0]);
    setColor(CUSTOM_CATEGORY_COLORS[0]);
    setCategoryModalVisible(true);
  }

  async function handleAddCategory() {
    if (!name.trim() || !target) return;
    setCategoryError(null);
    setSavingCategory(true);
    try {
      // Todas las categorías tienen la misma probabilidad (ver
      // utils/roulette.ts) — priority/weight ya no afectan el sorteo, se
      // guardan solo por compatibilidad con el esquema de la base de datos.
      await addCategory({
        name: name.trim(),
        defaultTarget: Number(target),
        priority: "media",
        weight: 25,
        icon,
        color,
      });
      setCategoryModalVisible(false);
    } catch (err) {
      setCategoryError((err as Error).message);
    } finally {
      setSavingCategory(false);
    }
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
          categories={categories}
          targetAngle={angle}
          onSpinEnd={handleSpinEnd}
          resultColor={pendingCategory?.color}
        />
      </View>

      {!alreadySpun && !pendingCategory ? (
        <Pressable onPress={openCategoryModal} style={styles.addCategoryLink}>
          <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
          <Text style={[typography.caption, styles.addCategoryText]}>Añadir nueva categoría</Text>
        </Pressable>
      ) : null}

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

      {error ? <ErrorBanner message={error} /> : null}

      <PrimaryButton
        label={spinning ? "Girando..." : "Girar la ruleta"}
        onPress={handleSpin}
        disabled={alreadySpun || !windowOpen || spinning}
        loading={spinning}
      />

      <PrimaryButton
        label="Registrar un gasto"
        onPress={() => setExpenseModalVisible(true)}
        variant="secondary"
      />

      <AddExpenseModal visible={expenseModalVisible} onClose={() => setExpenseModalVisible(false)} />

      <Modal visible={categoryModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={[typography.title, styles.modalTitle]}>Nueva categoría</Text>

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nombre (ej. Boda, Auto, Perro)"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
              />

              <View style={styles.amountRow}>
                <Text style={styles.currencySign}>$</Text>
                <TextInput
                  value={target}
                  onChangeText={(text) => setTarget(text.replace(/[^0-9.]/g, ""))}
                  placeholder="Meta"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                />
              </View>

              <Text style={typography.caption}>Ícono</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.iconRow}>
                  {CUSTOM_CATEGORY_ICONS.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setIcon(item)}
                      style={[styles.iconChip, icon === item && styles.iconChipActive]}
                    >
                      <Ionicons
                        name={item as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={icon === item ? colors.background : colors.textSecondary}
                      />
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={typography.caption}>Color</Text>
              <View style={styles.chipRow}>
                {CUSTOM_CATEGORY_COLORS.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setColor(item)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: item },
                      color === item && styles.colorSwatchActive,
                    ]}
                  />
                ))}
              </View>

              {categoryError ? <ErrorBanner message={categoryError} /> : null}

              <View style={styles.modalActions}>
                <Pressable onPress={() => setCategoryModalVisible(false)} style={styles.cancelButton}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
                <View style={styles.confirmButton}>
                  <PrimaryButton
                    label="Agregar"
                    onPress={handleAddCategory}
                    disabled={!name.trim() || !target}
                    loading={savingCategory}
                  />
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    gap: 4,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  wheelWrap: {
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  addCategoryLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  addCategoryText: {
    color: colors.accent,
  },
  resultCard: {
    gap: spacing.xs,
    alignItems: "center",
  },
  notice: {
    ...typography.caption,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalTitle: {
    textAlign: "center",
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
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
  },
  currencySign: {
    ...typography.title,
    color: colors.textTertiary,
    marginRight: 2,
  },
  amountInput: {
    ...typography.title,
    minWidth: 40,
    padding: 0,
    textAlign: "center",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  iconRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchActive: {
    borderColor: colors.textPrimary,
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
