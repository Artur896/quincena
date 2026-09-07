import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

/** Login sin contraseña: envía un código de un solo uso al correo del usuario. */
export async function requestOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function verifyOtp(email: string, token: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw error;
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
