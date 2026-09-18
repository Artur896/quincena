// Antes era una unión cerrada de las 4 categorías de fábrica; ahora el
// usuario puede agregar categorías propias (goal_categories.user_id no
// nulo), así que cualquier string identifica una categoría válida.
export type CategoryId = string;

export type CategoryPriority = "maxima" | "alta" | "media" | "baja";

export interface GoalCategory {
  id: CategoryId;
  name: string;
  priority: CategoryPriority;
  defaultTarget: number;
  color: string;
  icon: string;
  description: string;
  /** Ya no afecta el sorteo (la ruleta es equiprobable) — se conserva solo por compatibilidad de esquema. */
  weight: number;
  /** null = categoría global de fábrica; si no, el uid del dueño. */
  userId: string | null;
  /** null = visible en la ruleta; con fecha = el usuario la quitó (se
   * conserva para que las metas históricas sigan resolviendo bien). */
  archivedAt: string | null;
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
  photoUrl: string | null;
  storageLocation: string | null;
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
