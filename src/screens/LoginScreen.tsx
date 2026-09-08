import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ErrorBanner, PrimaryButton, Screen } from "@/components";
import { signInWithGoogle } from "@/services/authService";
import { colors, spacing, typography } from "@/theme";

export function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
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
        <PrimaryButton
          label="Continuar con Google"
          onPress={handleGoogleSignIn}
          loading={loading}
          icon={<Ionicons name="logo-google" size={18} color={colors.background} />}
        />
        {error ? <ErrorBanner message={error} /> : null}
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
});
