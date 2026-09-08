import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
} from "@expo-google-fonts/work-sans";

// Pasado a useFonts() en App.tsx; las claves son los fontFamily usados en typography.ts.
export const fontsToLoad = {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
};

export const fontFamily = {
  jakartaSemiBold: "PlusJakartaSans_600SemiBold",
  jakartaBold: "PlusJakartaSans_700Bold",
  jakartaExtraBold: "PlusJakartaSans_800ExtraBold",
  workSansRegular: "WorkSans_400Regular",
  workSansMedium: "WorkSans_500Medium",
  workSansSemiBold: "WorkSans_600SemiBold",
} as const;
