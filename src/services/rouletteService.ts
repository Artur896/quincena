import { supabase } from "@/lib/supabase";
import type { RouletteSpin } from "@/types";
import { mapRouletteSpin } from "./mappers";

export async function getSpinForMonth(
  userId: string,
  month: string,
): Promise<RouletteSpin | null> {
  const { data, error } = await supabase
    .from("roulette_spins")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRouletteSpin(data) : null;
}

/**
 * Registra el giro del mes. La restricción única (user_id, month) en la base
 * de datos es la garantía real de "una sola vez al mes"; esta llamada falla
 * si ya existe un giro para ese mes.
 */
export async function recordSpin(
  userId: string,
  month: string,
  resultCategoryId: string,
): Promise<RouletteSpin> {
  const { data, error } = await supabase
    .from("roulette_spins")
    .insert({ user_id: userId, month, result_category_id: resultCategoryId })
    .select("*")
    .single();

  if (error) throw error;
  return mapRouletteSpin(data);
}

export async function getSpinHistory(userId: string): Promise<RouletteSpin[]> {
  const { data, error } = await supabase
    .from("roulette_spins")
    .select("*")
    .eq("user_id", userId)
    .order("spun_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRouletteSpin);
}
