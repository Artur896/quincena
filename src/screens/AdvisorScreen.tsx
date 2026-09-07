import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card, EmptyState, Screen } from "@/components";
import { askAdvisor } from "@/services/advisorService";
import { colors, radius, spacing, typography } from "@/theme";
import type { AdvisorMessage } from "@/types";

const SUGGESTIONS = [
  "¿Estoy gastando demasiado?",
  "¿Cuándo terminaré mi meta?",
  "¿Puedo comprar esto?",
  "Analiza mis hábitos financieros",
];

export function AdvisorScreen() {
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: AdvisorMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { reply } = await askAdvisor(text.trim(), messages);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          content: "No pude conectarme con el asesor. Intenta de nuevo en un momento.",
          createdAt: new Date().toISOString(),
        },
      ]);
      void err;
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll={messages.length > 0}>
        <View style={styles.header}>
          <Text style={typography.display}>Asesor</Text>
          <Text style={[typography.body, styles.subtitle]}>
            Solo responde preguntas. Nunca mueve tu dinero por ti.
          </Text>
        </View>

        {messages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="sparkles-outline"
              title="Pregúntale a tu asesor"
              description="Tiene acceso a tus ingresos, gastos, metas e historial."
            />
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(suggestion)}
                >
                  <Text style={typography.caption}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.messages}>
            {messages.map((message) => (
              <Card
                key={message.id}
                style={[
                  styles.messageCard,
                  message.role === "user" ? styles.userMessage : styles.assistantMessage,
                ]}
              >
                <Text style={typography.body}>{message.content}</Text>
              </Card>
            ))}
            {loading ? (
              <Text style={typography.caption}>Pensando...</Text>
            ) : null}
          </View>
        )}
      </Screen>

      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu pregunta..."
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          onSubmitEditing={() => sendMessage(input)}
        />
        <Pressable style={styles.sendButton} onPress={() => sendMessage(input)} disabled={loading}>
          <Ionicons name="arrow-up" size={18} color={colors.background} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  emptyWrap: {
    gap: spacing.md,
  },
  suggestions: {
    gap: spacing.sm,
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  messages: {
    gap: spacing.sm,
  },
  messageCard: {
    maxWidth: "85%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  assistantMessage: {
    alignSelf: "flex-start",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
