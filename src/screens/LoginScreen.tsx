import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton, Screen } from "@/components";
import { requestOtp, verifyOtp } from "@/services/authService";
import { colors, radius, spacing, typography } from "@/theme";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestCode() {
    setLoading(true);
    setError(null);
    try {
      await requestOtp(email.trim());
      setStep("code");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(email.trim(), code.trim());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll={false} style={styles.content}>
      <View style={styles.header}>
        <Text style={typography.display}>Quincena</Text>
        <Text style={[typography.body, styles.subtitle]}>
          Una meta a la vez. Enfoque financiero real.
        </Text>
      </View>

      <View style={styles.form}>
        {step === "email" ? (
          <>
            <Text style={typography.caption}>Correo</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <PrimaryButton
              label="Enviar código"
              onPress={handleRequestCode}
              disabled={!email.includes("@")}
              loading={loading}
            />
          </>
        ) : (
          <>
            <Text style={typography.caption}>Código enviado a {email}</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              style={styles.input}
            />
            <PrimaryButton
              label="Entrar"
              onPress={handleVerifyCode}
              disabled={code.length < 6}
              loading={loading}
            />
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  form: {
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
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
