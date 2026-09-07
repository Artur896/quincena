import type { Contribution, Goal } from "@/types";

/** Suma total acumulada de una meta a partir de sus contribuciones históricas. */
export function sumContributions(contributions: Contribution[]): number {
  return contributions.reduce((total, contribution) => total + contribution.amount, 0);
}

/**
 * Agrupa las contribuciones históricas de un usuario por mes, para construir
 * la vista de "historial mensual" de la pantalla Meta.
 */
export function groupContributionsByMonth(
  contributions: Contribution[],
): Record<string, number> {
  return contributions.reduce<Record<string, number>>((acc, contribution) => {
    acc[contribution.month] = (acc[contribution.month] ?? 0) + contribution.amount;
    return acc;
  }, {});
}

/**
 * Estima la fecha en la que se completará una meta activa, asumiendo que se
 * sigue aportando `goalsAllocation` en cada quincena (2 veces al mes) desde
 * hoy hasta llegar al monto objetivo.
 */
export function estimateCompletionDate(
  goal: Pick<Goal, "targetAmount" | "accumulatedAmount">,
  goalsAllocationPerQuincena: number,
  from: Date = new Date(),
): Date | null {
  const remaining = goal.targetAmount - goal.accumulatedAmount;
  if (remaining <= 0) return from;
  if (goalsAllocationPerQuincena <= 0) return null;

  const quincenasNeeded = Math.ceil(remaining / goalsAllocationPerQuincena);
  const daysPerQuincena = 15;
  const estimated = new Date(from);
  estimated.setDate(estimated.getDate() + quincenasNeeded * daysPerQuincena);
  return estimated;
}

export function isGoalComplete(goal: Pick<Goal, "targetAmount" | "accumulatedAmount">): boolean {
  return goal.accumulatedAmount >= goal.targetAmount;
}
