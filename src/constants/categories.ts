import { colors } from "@/theme";
import type { GoalCategory } from "@/types";

/**
 * Las 4 categorías de fábrica (globales, user_id null en goal_categories).
 * Todas tienen la misma probabilidad de salir sorteadas sin importar el
 * `weight`/`priority` guardado — utils/roulette.ts sortea 1/N entre todas
 * las categorías activas, sean de fábrica o agregadas por el usuario, para
 * que la probabilidad se reparta sola según cuántas haya en ese momento.
 * Sirven como fallback antes de que el store cargue las categorías reales
 * desde Supabase (que incluyen también las que el usuario haya agregado —
 * ver src/services/categoriesService.ts).
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
    userId: null,
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
    userId: null,
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
    userId: null,
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
    userId: null,
  },
];

/** Paleta para categorías personalizadas, sin repetir los 4 colores de fábrica. */
export const CUSTOM_CATEGORY_COLORS = [
  "#5FBF8F",
  "#E8C468",
  "#7FB2E8",
  "#C97FE8",
  "#E8977F",
  "#7FE8D0",
  "#E8E07F",
  "#B0B7C6",
] as const;

/** Íconos disponibles para elegir al crear una categoría propia. */
export const CUSTOM_CATEGORY_ICONS = [
  "home",
  "airplane",
  "laptop",
  "shirt",
  "car",
  "school",
  "medkit",
  "gift",
  "restaurant",
  "bicycle",
  "phone-portrait",
  "briefcase",
] as const;

export function getCategoryById(id: string): GoalCategory | undefined {
  return GOAL_CATEGORIES.find((category) => category.id === id);
}

export const DEFAULT_INCOME_CONFIG = {
  biweeklyIncome: 8000,
  fixedTransport: 3600,
  goalsAllocation: 3000,
  freeMoney: 1400,
};
