import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

const extra = Constants.expoConfig?.extra ?? {};

function readConfig(envValue: string | undefined, extraValue: unknown): string {
  if (envValue) return envValue;
  if (typeof extraValue === "string" && !extraValue.includes("PLACEHOLDER")) return extraValue;
  return "";
}

const supabaseUrl = readConfig(process.env.EXPO_PUBLIC_SUPABASE_URL, extra.supabaseUrl);
const supabaseAnonKey = readConfig(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  extra.supabaseAnonKey,
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[quincena] Supabase no está configurado. Define EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (o supabaseUrl/supabaseAnonKey en app.json).",
  );
}

// Si falta configuración usamos una URL válida mínima para que createClient
// no truene al arrancar la app; las llamadas reales fallarán con un error
// claro de red en vez de tumbar la app entera en el import.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
