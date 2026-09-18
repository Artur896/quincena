import type { Contribution, Expense, Goal, GoalCategory, IncomeConfig, RouletteSpin } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Los mappers traducen filas snake_case de Postgres a los tipos camelCase
// que usa el resto de la app.

export function mapGoal(row: any): Goal {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    month: row.month,
    targetAmount: Number(row.target_amount),
    accumulatedAmount: Number(row.accumulated_amount),
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export function mapContribution(row: any): Contribution {
  return {
    id: row.id,
    goalId: row.goal_id,
    amount: Number(row.amount),
    quincena: row.quincena,
    month: row.month,
    photoUrl: row.photo_url ?? null,
    storageLocation: row.storage_location ?? null,
    createdAt: row.created_at,
  };
}

export function mapExpense(row: any): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    category: row.category,
    title: row.title,
    photoUrl: row.photo_url ?? null,
    date: row.date,
    source: row.source,
  };
}

export function mapIncomeConfig(row: any): IncomeConfig {
  return {
    userId: row.user_id,
    biweeklyIncome: Number(row.biweekly_income),
    fixedTransport: Number(row.fixed_transport),
    goalsAllocation: Number(row.goals_allocation),
    freeMoney: Number(row.free_money),
    updatedAt: row.updated_at,
  };
}

export function mapGoalCategory(row: any): GoalCategory {
  return {
    id: row.id,
    name: row.name,
    priority: row.priority,
    defaultTarget: Number(row.default_target),
    color: row.color,
    icon: row.icon,
    description: row.description,
    weight: Number(row.weight),
    userId: row.user_id ?? null,
    archivedAt: row.archived_at ?? null,
  };
}

export function mapRouletteSpin(row: any): RouletteSpin {
  return {
    id: row.id,
    userId: row.user_id,
    month: row.month,
    resultCategoryId: row.result_category_id,
    spunAt: row.spun_at,
  };
}
