export type CategoryId = "casa" | "viajes" | "compu" | "ropa";

export type CategoryPriority = "maxima" | "alta" | "media" | "baja";

export interface GoalCategory {
  id: CategoryId;
  name: string;
  priority: CategoryPriority;
  defaultTarget: number;
  color: string;
  icon: string;
  description: string;
  /** Peso relativo dentro de la ruleta ponderada. Mayor prioridad -> mayor peso. */
  weight: number;
}

export type GoalStatus = "active" | "completed" | "archived";

export interface Goal {
  id: string;
  userId: string;
  categoryId: CategoryId;
  /** Mes al que pertenece esta meta, formato 'YYYY-MM'. */
  month: string;
  targetAmount: number;
  accumulatedAmount: number;
  status: GoalStatus;
  startedAt: string;
  completedAt: string | null;
}

export type Quincena = 1 | 2;

export interface Contribution {
  id: string;
  goalId: string;
  amount: number;
  quincena: Quincena;
  month: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  title: string;
  photoUrl: string | null;
  date: string;
  source: "manual" | "auto";
}

export interface IncomeConfig {
  userId: string;
  biweeklyIncome: number;
  fixedTransport: number;
  goalsAllocation: number;
  freeMoney: number;
  updatedAt: string;
}

export interface RouletteSpin {
  id: string;
  userId: string;
  month: string;
  resultCategoryId: CategoryId;
  spunAt: string;
}

export type MovementType = "contribution" | "expense" | "roulette";

export interface Movement {
  id: string;
  type: MovementType;
  title: string;
  subtitle: string;
  amount: number;
  date: string;
}

export interface FinancialSummary {
  currentGoal: Goal | null;
  currentCategory: GoalCategory | null;
  freeMoney: number;
  todayExpenses: number;
  recentMovements: Movement[];
  hasSpunThisMonth: boolean;
}

export interface AdvisorContext {
  income: IncomeConfig;
  expenses: Expense[];
  goals: Goal[];
  contributions: Contribution[];
}

export interface AdvisorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
