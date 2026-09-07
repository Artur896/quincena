import { supabase } from "@/lib/supabase";
import type { Expense } from "@/types";
import { mapExpense } from "./mappers";

export async function getExpenses(userId: string, limit = 50): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapExpense);
}

export async function getTodayExpensesTotal(userId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", userId)
    .eq("date", today);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

export interface CreateExpenseInput {
  userId: string;
  amount: number;
  category: string;
  description: string;
  date?: string;
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: input.userId,
      amount: input.amount,
      category: input.category,
      description: input.description,
      date: input.date ?? new Date().toISOString().slice(0, 10),
      source: "manual",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapExpense(data);
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}
