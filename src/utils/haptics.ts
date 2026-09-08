import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const isSupported = Platform.OS !== "web";

/** Toque ligero: press de botones. */
export function tapHaptic() {
  if (!isSupported) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Cambio de selección: tabs, chips. */
export function selectionHaptic() {
  if (!isSupported) return;
  void Haptics.selectionAsync();
}

/** Confirmación de éxito: resultado de la ruleta, meta completada. */
export function successHaptic() {
  if (!isSupported) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
