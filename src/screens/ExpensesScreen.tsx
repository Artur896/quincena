import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Card, EmptyState, ErrorBanner, MoneyText, PrimaryButton, Screen, SectionHeader } from "@/components";
import { uploadExpensePhoto } from "@/services/expensesService";
import { useAppStore } from "@/store/useAppStore";
import { colors, radius, spacing, typography } from "@/theme";

const QUICK_CATEGORIES = ["Comida", "Transporte", "Ocio", "Salud", "Otro"];

export function ExpensesScreen() {
  const userId = useAppStore((state) => state.userId);
  const expenses = useAppStore((state) => state.expenses);
  const todayExpensesTotal = useAppStore((state) => state.todayExpensesTotal);
  const addExpense = useAppStore((state) => state.addExpense);

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(QUICK_CATEGORIES[0]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = Boolean(amount) && title.trim().length > 0;

  function openModal() {
    setError(null);
    setModalVisible(true);
  }

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!canSave || !userId) return;
    setError(null);
    setSaving(true);
    try {
      const photoUrl = photoUri ? await uploadExpensePhoto(userId, photoUri) : null;
      await addExpense({ amount: Number(amount), category, title: title.trim(), photoUrl });
      setAmount("");
      setTitle("");
      setPhotoUri(null);
      setModalVisible(false);
    } catch (err) {
      setError((err as Error).message);
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

      <PrimaryButton label="Registrar gasto" onPress={openModal} />

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

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={[typography.title, styles.modalTitle]}>Nuevo gasto</Text>

              <View style={styles.amountRow}>
                <Text style={styles.currencySign}>$</Text>
                <TextInput
                  value={amount}
                  onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ""))}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                  autoFocus
                />
              </View>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Título del gasto"
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

              {photoUri ? (
                <View style={styles.photoPreviewRow}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <Pressable onPress={() => setPhotoUri(null)} style={styles.photoRemove}>
                    <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photoButtons}>
                  <Pressable onPress={pickFromCamera} style={styles.photoButton}>
                    <Ionicons name="camera-outline" size={18} color={colors.textSecondary} />
                    <Text style={typography.caption}>Cámara</Text>
                  </Pressable>
                  <Pressable onPress={pickFromLibrary} style={styles.photoButton}>
                    <Ionicons name="image-outline" size={18} color={colors.textSecondary} />
                    <Text style={typography.caption}>Galería</Text>
                  </Pressable>
                </View>
              )}

              {error ? <ErrorBanner message={error} /> : null}

              <View style={styles.modalActions}>
                <Pressable onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
                <View style={styles.confirmButton}>
                  <PrimaryButton
                    label="Guardar"
                    onPress={handleSave}
                    disabled={!canSave}
                    loading={saving}
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalTitle: {
    textAlign: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  currencySign: {
    ...typography.money,
    color: colors.textTertiary,
    marginRight: 2,
  },
  amountInput: {
    ...typography.money,
    minWidth: 40,
    padding: 0,
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
  photoButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  photoPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  photoRemove: {
    marginLeft: spacing.sm,
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
