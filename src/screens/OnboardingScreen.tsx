import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Card, PrimaryButton, Screen } from "@/components";
import { useAppStore } from "@/store/useAppStore";
import { colors, radius, spacing, typography } from "@/theme";
import { formatMoney } from "@/utils/money";

export function OnboardingScreen() {
  const saveIncomeConfig = useAppStore((state) => state.saveIncomeConfig);
  const [income, setIncome] = useState("8000");
  const [transport, setTransport] = useState("3600");
  const [free, setFree] = useState("1400");
  const [loading, setLoading] = useState(false);

  const goalsAllocation = Math.max(
    0,
    Number(income || 0) - Number(transport || 0) - Number(free || 0),
  );

  async function handleSave() {
    setLoading(true);
    try {
      await saveIncomeConfig({
        biweeklyIncome: Number(income || 0),
        fixedTransport: Number(transport || 0),
        freeMoney: Number(free || 0),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={typography.display}>Empecemos</Text>
        <Text style={[typography.body, styles.subtitle]}>
          Cuéntanos tu quincena. Con esto calculamos cuánto va directo a tus metas.
        </Text>
      </View>

      <View style={styles.form}>
        <Field label="Ingreso quincenal" value={income} onChangeText={setIncome} />
        <Field label="Transporte fijo" value={transport} onChangeText={setTransport} />
        <Field label="Dinero libre deseado" value={free} onChangeText={setFree} />
      </View>

      <Card>
        <Text style={typography.caption}>Dinero para metas (calculado)</Text>
        <Text style={[typography.title, styles.allocation]}>{formatMoney(goalsAllocation)}</Text>
        <Text style={typography.caption}>
          Cada quincena este monto se acumulará automáticamente en tu meta del mes.
        </Text>
      </Card>

      <PrimaryButton label="Guardar y continuar" onPress={handleSave} loading={loading} />
    </Screen>
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
  header: {
    gap: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.md,
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
  allocation: {
    marginVertical: spacing.xs,
    color: colors.accent,
  },
});
