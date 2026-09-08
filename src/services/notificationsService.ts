import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const DAILY_EXPENSE_REMINDER_ID = "daily-expense-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Pide permiso (si hace falta) y programa el recordatorio diario de las
 * 10pm para registrar gastos. Idempotente: no duplica si ya está programado. */
export async function setupDailyExpenseReminder(): Promise<void> {
  // Notificaciones locales programadas son un feature de app nativa; en web
  // expo-notifications no soporta triggers de hora/minuto repetibles.
  if (Platform.OS === "web") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Recordatorios",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const alreadyScheduled = scheduled.some(
    (notification) => notification.identifier === DAILY_EXPENSE_REMINDER_ID,
  );
  if (alreadyScheduled) return;

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_EXPENSE_REMINDER_ID,
    content: {
      title: "Quincena",
      body: "¿Gastaste algo hoy? Ingresa tus gastos para mantener tu control al día.",
    },
    trigger: {
      hour: 22,
      minute: 0,
      repeats: true,
    },
  });
}
