import { DEFAULT_INCOME_CONFIG } from "@/constants/categories";
import { supabase } from "@/lib/supabase";
import type { IncomeConfig } from "@/types";
import { mapIncomeConfig } from "./mappers";

export async function getIncomeConfig(userId: string): Promise<IncomeConfig | null> {
  const { data, error } = await supabase
    .from("income_configs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapIncomeConfig(data) : null;
}

export interface UpsertIncomeConfigInput {
  userId: string;
  biweeklyIncome: number;
  fixedTransport: number;
  freeMoney: number;
}

/** El dinero para metas siempre es el residual: ingreso - transporte - libre. */
export async function upsertIncomeConfig(
  input: UpsertIncomeConfigInput,
): Promise<IncomeConfig> {
  const goalsAllocation = Math.max(
    0,
    input.biweeklyIncome - input.fixedTransport - input.freeMoney,
  );

  const { data, error } = await supabase
    .from("income_configs")
    .upsert(
      {
        user_id: input.userId,
        biweekly_income: input.biweeklyIncome,
        fixed_transport: input.fixedTransport,
        goals_allocation: goalsAllocation,
        free_money: input.freeMoney,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return mapIncomeConfig(data);
}

export function defaultIncomeConfig(userId: string): IncomeConfig {
  return {
    userId,
    ...DEFAULT_INCOME_CONFIG,
    updatedAt: new Date().toISOString(),
  };
}
