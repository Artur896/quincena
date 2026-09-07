import { useMemo } from "react";

import { activeGoalCategory, useAppStore } from "@/store/useAppStore";
import type { FinancialSummary, Movement } from "@/types";
import { currentMonthKey } from "@/utils/date";
import { formatMoney } from "@/utils/money";

export function useFinancialSummary(): FinancialSummary {
  const activeGoal = useAppStore((state) => state.activeGoal);
  const incomeConfig = useAppStore((state) => state.incomeConfig);
  const contributions = useAppStore((state) => state.contributions);
  const expenses = useAppStore((state) => state.expenses);
  const todayExpensesTotal = useAppStore((state) => state.todayExpensesTotal);
  const spins = useAppStore((state) => state.spins);
  const currentCategory = useAppStore(activeGoalCategory);

  return useMemo(() => {
    const goalMovements: Movement[] = contributions
      .filter((contribution) => contribution.goalId === activeGoal?.id)
      .map((contribution) => ({
        id: contribution.id,
        type: "contribution" as const,
        title: `Aporte a ${currentCategory?.name ?? "tu meta"}`,
        subtitle: `Quincena ${contribution.quincena} · ${formatMoney(contribution.amount)}`,
        amount: contribution.amount,
        date: contribution.createdAt,
      }));

    const expenseMovements: Movement[] = expenses.map((expense) => ({
      id: expense.id,
      type: "expense" as const,
      title: expense.description || expense.category,
      subtitle: expense.category,
      amount: -expense.amount,
      date: expense.date,
    }));

    const recentMovements = [...goalMovements, ...expenseMovements]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    return {
      currentGoal: activeGoal,
      currentCategory,
      freeMoney: incomeConfig?.freeMoney ?? 0,
      todayExpenses: todayExpensesTotal,
      recentMovements,
      hasSpunThisMonth: spins.some((spin) => spin.month === currentMonthKey()),
    };
  }, [activeGoal, contributions, currentCategory, expenses, incomeConfig, spins, todayExpensesTotal]);
}
