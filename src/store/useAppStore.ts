import { create } from "zustand";

import { getCategoryById } from "@/constants/categories";
import {
  contributeToGoal,
  createGoalFromRoulette,
  getActiveGoal,
  getAllContributions,
  getGoalHistory,
} from "@/services/goalsService";
import { createExpense, getExpenses, getTodayExpensesTotal } from "@/services/expensesService";
import { defaultIncomeConfig, getIncomeConfig, upsertIncomeConfig } from "@/services/incomeService";
import { getSpinForMonth, getSpinHistory, recordSpin } from "@/services/rouletteService";
import { currentMonthKey, currentQuincena } from "@/utils/date";
import { pickWeightedCategory } from "@/utils/roulette";
import type {
  Contribution,
  Expense,
  Goal,
  GoalCategory,
  IncomeConfig,
  RouletteSpin,
} from "@/types";

interface AppState {
  userId: string | null;
  incomeConfig: IncomeConfig | null;
  hasSavedIncomeConfig: boolean;
  activeGoal: Goal | null;
  goalHistory: Goal[];
  contributions: Contribution[];
  expenses: Expense[];
  todayExpensesTotal: number;
  spins: RouletteSpin[];
  isLoading: boolean;
  hasInitialized: boolean;
  error: string | null;

  initialize: (userId: string) => Promise<void>;
  saveIncomeConfig: (input: {
    biweeklyIncome: number;
    fixedTransport: number;
    freeMoney: number;
  }) => Promise<void>;
  spinRoulette: () => Promise<GoalCategory>;
  contributeCurrentQuincena: () => Promise<void>;
  addExpense: (input: {
    amount: number;
    category: string;
    title: string;
    photoUrl?: string | null;
  }) => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  userId: null,
  incomeConfig: null,
  hasSavedIncomeConfig: false,
  activeGoal: null,
  goalHistory: [],
  contributions: [],
  expenses: [],
  todayExpensesTotal: 0,
  spins: [],
  isLoading: false,
  hasInitialized: false,
  error: null,

  initialize: async (userId: string) => {
    set({ isLoading: true, error: null, userId });
    try {
      const month = currentMonthKey();
      const [incomeConfig, activeGoal, goalHistory, expenses, todayExpensesTotal, spins] =
        await Promise.all([
          getIncomeConfig(userId),
          getActiveGoal(userId),
          getGoalHistory(userId),
          getExpenses(userId),
          getTodayExpensesTotal(userId),
          getSpinHistory(userId),
        ]);

      const contributions = activeGoal ? await getAllContributions(userId) : [];

      set({
        incomeConfig: incomeConfig ?? defaultIncomeConfig(userId),
        hasSavedIncomeConfig: Boolean(incomeConfig),
        activeGoal,
        goalHistory,
        contributions,
        expenses,
        todayExpensesTotal,
        spins,
        isLoading: false,
        hasInitialized: true,
      });
      void month;

      if (activeGoal && incomeConfig && activeGoal.month === month) {
        await get().contributeCurrentQuincena();
      }
    } catch (err) {
      set({ isLoading: false, hasInitialized: true, error: (err as Error).message });
    }
  },

  saveIncomeConfig: async (input) => {
    const { userId } = get();
    if (!userId) return;
    const incomeConfig = await upsertIncomeConfig({ userId, ...input });
    set({ incomeConfig, hasSavedIncomeConfig: true });
  },

  spinRoulette: async () => {
    const { userId } = get();
    if (!userId) throw new Error("No hay usuario activo.");

    const month = currentMonthKey();
    const existing = await getSpinForMonth(userId, month);
    if (existing) {
      throw new Error("Ya giraste la ruleta este mes.");
    }

    const category = pickWeightedCategory();
    const spin = await recordSpin(userId, month, category.id);
    const goal = await createGoalFromRoulette(userId, category.id, month);

    set((state) => ({
      activeGoal: goal,
      goalHistory: [goal, ...state.goalHistory],
      spins: [spin, ...state.spins],
    }));

    return category;
  },

  contributeCurrentQuincena: async () => {
    const { userId, activeGoal, incomeConfig, contributions } = get();
    if (!userId || !activeGoal || !incomeConfig) {
      throw new Error("Falta configurar ingreso o girar la ruleta este mes.");
    }

    const quincena = currentQuincena();
    const alreadyContributed = contributions.some(
      (contribution) =>
        contribution.goalId === activeGoal.id &&
        contribution.month === activeGoal.month &&
        contribution.quincena === quincena,
    );
    if (alreadyContributed) return;

    const contribution = await contributeToGoal(
      userId,
      activeGoal,
      quincena,
      incomeConfig.goalsAllocation,
    );

    set((state) => ({
      contributions: [...state.contributions, contribution],
      activeGoal: state.activeGoal
        ? {
            ...state.activeGoal,
            accumulatedAmount: state.activeGoal.accumulatedAmount + contribution.amount,
          }
        : state.activeGoal,
    }));
  },

  addExpense: async (input) => {
    const { userId } = get();
    if (!userId) return;
    const expense = await createExpense({ userId, ...input });
    set((state) => ({
      expenses: [expense, ...state.expenses],
      todayExpensesTotal:
        expense.date === new Date().toISOString().slice(0, 10)
          ? state.todayExpensesTotal + expense.amount
          : state.todayExpensesTotal,
    }));
  },

  refreshExpenses: async () => {
    const { userId } = get();
    if (!userId) return;
    const [expenses, todayExpensesTotal] = await Promise.all([
      getExpenses(userId),
      getTodayExpensesTotal(userId),
    ]);
    set({ expenses, todayExpensesTotal });
  },
}));

export function activeGoalCategory(state: AppState): GoalCategory | null {
  if (!state.activeGoal) return null;
  return getCategoryById(state.activeGoal.categoryId) ?? null;
}
