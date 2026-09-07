import { getCategoryById } from "@/constants/categories";
import { supabase } from "@/lib/supabase";
import type { CategoryId, Contribution, Goal, Quincena } from "@/types";
import { mapContribution, mapGoal } from "./mappers";

export async function getGoalForMonth(userId: string, month: string): Promise<Goal | null> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (error) throw error;
  return data ? mapGoal(data) : null;
}

export async function getActiveGoal(userId: string): Promise<Goal | null> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapGoal(data) : null;
}

export async function getGoalHistory(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("month", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapGoal);
}

export async function getContributionsForGoal(goalId: string): Promise<Contribution[]> {
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapContribution);
}

export async function getAllContributions(userId: string): Promise<Contribution[]> {
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapContribution);
}

/** Crea la meta del mes a partir del resultado de la ruleta. Falla si ya existe una para ese mes. */
export async function createGoalFromRoulette(
  userId: string,
  categoryId: CategoryId,
  month: string,
): Promise<Goal> {
  const category = getCategoryById(categoryId);
  if (!category) throw new Error(`Categoría desconocida: ${categoryId}`);

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      category_id: categoryId,
      month,
      target_amount: category.defaultTarget,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapGoal(data);
}

/**
 * Registra el aporte de una quincena a la meta activa del mes. Es idempotente
 * por (goal, mes, quincena): un segundo intento para la misma quincena falla
 * por la restricción única en vez de duplicar el aporte.
 */
export async function contributeToGoal(
  userId: string,
  goal: Goal,
  quincena: Quincena,
  amount: number,
): Promise<Contribution> {
  const { data, error } = await supabase
    .from("contributions")
    .insert({
      goal_id: goal.id,
      user_id: userId,
      amount,
      quincena,
      month: goal.month,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapContribution(data);
}
