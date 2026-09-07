import { colors } from "@/theme";
import type { GoalCategory } from "@/types";

/**
 * Las 4 categorías de la ruleta. El peso determina la probabilidad relativa
 * de salir sorteada: a mayor prioridad, mayor peso (ver src/utils/roulette.ts).
 */
export const GOAL_CATEGORIES: GoalCategory[] = [
  {
    id: "casa",
    name: "Casa",
    priority: "maxima",
    defaultTarget: 50000,
    color: colors.categoryCasa,
    icon: "home",
    description: "Construcción y patrimonio",
    weight: 40,
  },
  {
    id: "viajes",
    name: "Viajes",
    priority: "alta",
    defaultTarget: 15000,
    color: colors.categoryViajes,
    icon: "airplane",
    description: "Vacaciones o experiencias importantes",
    weight: 30,
  },
  {
    id: "compu",
    name: "Compu",
    priority: "media",
    defaultTarget: 20000,
    color: colors.categoryCompu,
    icon: "laptop",
    description: "Computadora, periféricos o tecnología",
    weight: 20,
  },
  {
    id: "ropa",
    name: "Ropa",
    priority: "baja",
    defaultTarget: 5000,
    color: colors.categoryRopa,
    icon: "shirt",
    description: "Vestimenta y accesorios",
    weight: 10,
  },
];

export function getCategoryById(id: string): GoalCategory | undefined {
  return GOAL_CATEGORIES.find((category) => category.id === id);
}

export const DEFAULT_INCOME_CONFIG = {
  biweeklyIncome: 8000,
  fixedTransport: 3600,
  goalsAllocation: 3000,
  freeMoney: 1400,
};
