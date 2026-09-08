import { useEffect, useState } from "react";
import {
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

import { useAppStore } from "@/store/useAppStore";
import { colors, radius, spacing, typography } from "@/theme";
import { formatMoney } from "@/utils/money";
import { ErrorBanner } from "./ErrorBanner";
import { PrimaryButton } from "./PrimaryButton";

interface EditIncomeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditIncomeModal({ visible, onClose }: EditIncomeModalProps) {
  const incomeConfig = useAppStore((state) => state.incomeConfig);
  const saveIncomeConfig = useAppStore((state) => state.saveIncomeConfig);

  const [income, setIncome] = useState("");
  const [transport, setTransport] = useState("");
  const [free, setFree] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Repuebla el formulario con los valores actuales cada vez que se abre,
  // en vez de arrancar en blanco como el onboarding inicial.
  useEffect(() => {
    if (visible && incomeConfig) {
      setIncome(String(incomeConfig.biweeklyIncome));
      setTransport(String(incomeConfig.fixedTransport));
      setFree(String(incomeConfig.freeMoney));
      setError(null);
    }
  }, [visible, incomeConfig]);

  const goalsAllocation = Math.max(0, Number(income || 0) - Number(transport || 0) - Number(free || 0));

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await saveIncomeConfig({
        biweeklyIncome: Number(income || 0),
        fixedTransport: Number(transport || 0),
        freeMoney: Number(free || 0),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={[typography.title, styles.title]}>Editar ingreso</Text>

            <Field label="Ingreso quincenal" value={income} onChangeText={setIncome} />
            <Field label="Transporte fijo" value={transport} onChangeText={setTransport} />
            <Field label="Dinero libre deseado" value={free} onChangeText={setFree} />

            <View style={styles.allocationRow}>
              <Text style={typography.caption}>Dinero para metas (calculado)</Text>
              <Text style={[typography.subtitle, styles.allocationValue]}>
                {formatMoney(goalsAllocation)}
              </Text>
            </View>

            {error ? <ErrorBanner message={error} /> : null}

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
              <View style={styles.confirmButton}>
                <PrimaryButton label="Guardar" onPress={handleSave} loading={saving} />
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={typography.caption}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    textAlign: "center",
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
  },
  allocationRow: {
    gap: 4,
  },
  allocationValue: {
    color: colors.accent,
  },
  actions: {
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
