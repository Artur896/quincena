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

import {
  Card,
  CategoryPill,
  EditIncomeModal,
  EmptyState,
  ErrorBanner,
  MoneyText,
  MovementRow,
  PrimaryButton,
  ProgressBar,
  Screen,
  SectionHeader,
} from "@/components";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { uploadContributionPhoto } from "@/services/goalsService";
import { useAppStore } from "@/store/useAppStore";
import { colors, radius, spacing, typography } from "@/theme";
import { currentMonthKey, currentQuincena } from "@/utils/date";
import { formatMoney, progressPercentage } from "@/utils/money";

const LOCATION_OPTIONS = ["Efectivo en casa", "Alcancía", "Cuenta separada", "Otro"];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function HomeScreen() {
  const summary = useFinancialSummary();
  const { currentGoal, currentCategory } = summary;

  const userId = useAppStore((state) => state.userId);
  const incomeConfig = useAppStore((state) => state.incomeConfig);
  const contributions = useAppStore((state) => state.contributions);
  const confirmContribution = useAppStore((state) => state.confirmContribution);

  const month = currentMonthKey();
  const quincena = currentQuincena();
  const pendingContribution = Boolean(
    currentGoal &&
      currentGoal.month === month &&
      !contributions.some(
        (contribution) =>
          contribution.goalId === currentGoal.id &&
          contribution.month === month &&
          contribution.quincena === quincena,
      ),
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editIncomeVisible, setEditIncomeVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [location, setLocation] = useState(LOCATION_OPTIONS[0]);
  const [customLocation, setCustomLocation] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function openModal() {
    setError(null);
    setAmount(incomeConfig ? String(incomeConfig.goalsAllocation) : "");
    setLocation(LOCATION_OPTIONS[0]);
    setCustomLocation("");
    setPhotoUri(null);
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

  async function handleConfirm() {
    if (!amount || !userId) return;
    setError(null);
    setSaving(true);
    try {
      const photoUrl = photoUri ? await uploadContributionPhoto(userId, photoUri) : null;
      const finalLocation = location === "Otro" ? customLocation.trim() || "Otro" : location;
      const confirmedAmount = Number(amount);
      await confirmContribution({ amount: confirmedAmount, photoUrl, storageLocation: finalLocation });

      setNote(
        incomeConfig && confirmedAmount < incomeConfig.goalsAllocation
          ? "No llegaste al monto completo esta quincena, pero ya quedó guardado — lo que cuenta es que sigues sumando."
          : "Aporte de la quincena registrado.",
      );
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
        <View style={styles.greetingBlock}>
          <Text style={typography.caption}>{greeting()}</Text>
          <Text style={typography.display}>Tu enfoque de hoy</Text>
        </View>
        <Pressable
          onPress={() => setEditIncomeVisible(true)}
          style={styles.settingsButton}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.delay(40).duration(400)}>
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
      </Animated.View>

      {pendingContribution ? (
        <Animated.View entering={FadeInDown.delay(70).duration(400)}>
          <Card style={styles.pendingCard}>
            <Text style={typography.subtitle}>Confirma tu aporte de esta quincena</Text>
            <Text style={typography.caption}>
              Sugerido: {formatMoney(incomeConfig?.goalsAllocation ?? 0)} · puedes ajustarlo si esta
              quincena no te alcanzó
            </Text>
            <PrimaryButton label="Confirmar aporte" onPress={openModal} variant="secondary" />
          </Card>
        </Animated.View>
      ) : null}

      {note ? (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={styles.noteCard}>
            <Text style={typography.caption}>{note}</Text>
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={typography.caption}>Dinero libre</Text>
          <MoneyText amount={summary.freeMoney} variant="title" />
        </Card>
        <Card style={styles.statCard}>
          <Text style={typography.caption}>Gastos de hoy</Text>
          <MoneyText amount={summary.todayExpenses} variant="title" color={colors.danger} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(400)}>
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
      </Animated.View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={[typography.title, styles.modalTitle]}>Aporte de la quincena</Text>

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

              <Text style={typography.caption}>¿Dónde lo guardaste?</Text>
              <View style={styles.categoryRow}>
                {LOCATION_OPTIONS.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setLocation(item)}
                    style={[styles.categoryChip, location === item && styles.categoryChipActive]}
                  >
                    <Text
                      style={[typography.caption, location === item && { color: colors.background }]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {location === "Otro" ? (
                <TextInput
                  value={customLocation}
                  onChangeText={setCustomLocation}
                  placeholder="¿Dónde exactamente?"
                  placeholderTextColor={colors.textTertiary}
                  style={styles.input}
                />
              ) : null}

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
                    <Text style={typography.caption}>Comprobante (cámara)</Text>
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
                    label="Guardar aporte"
                    onPress={handleConfirm}
                    disabled={!amount}
                    loading={saving}
                  />
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <EditIncomeModal visible={editIncomeVisible} onClose={() => setEditIncomeVisible(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetingBlock: {
    gap: 4,
  },
  settingsButton: {
    padding: spacing.xs,
  },
  goalCard: {
    gap: spacing.sm,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingCard: {
    gap: spacing.xs,
    borderColor: colors.accent,
  },
  noteCard: {
    backgroundColor: colors.surfaceElevated,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    gap: 4,
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
