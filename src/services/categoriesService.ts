import { supabase } from "@/lib/supabase";
import type { CategoryPriority, GoalCategory } from "@/types";
import { mapGoalCategory } from "./mappers";

/** RLS ya filtra a las 4 globales (user_id null) + las propias del usuario. */
export async function getCategories(): Promise<GoalCategory[]> {
  const { data, error } = await supabase.from("goal_categories").select("*").order("weight", {
    ascending: false,
  });

  if (error) throw error;
  return (data ?? []).map(mapGoalCategory);
}

export interface CreateCategoryInput {
  userId: string;
  name: string;
  priority: CategoryPriority;
  defaultTarget: number;
  color: string;
  icon: string;
  weight: number;
  description?: string;
}

const DIACRITICS_PATTERN = new RegExp("[\\u0300-\\u036f]", "g");

function generateCategoryId(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slug || "meta"}-${suffix}`;
}

export async function createCustomCategory(input: CreateCategoryInput): Promise<GoalCategory> {
  const { data, error } = await supabase
    .from("goal_categories")
    .insert({
      id: generateCategoryId(input.name),
      name: input.name,
      priority: input.priority,
      default_target: input.defaultTarget,
      color: input.color,
      icon: input.icon,
      description: input.description ?? "Meta personalizada",
      weight: input.weight,
      user_id: input.userId,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapGoalCategory(data);
}
