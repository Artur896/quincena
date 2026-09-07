import { GOAL_CATEGORIES } from "@/constants/categories";
import type { CategoryId, GoalCategory } from "@/types";

/**
 * Selecciona una categoría al azar respetando el peso de prioridad de cada
 * una (ruleta ponderada, no equiprobable). `random` es inyectable para
 * pruebas deterministas.
 */
export function pickWeightedCategory(
  categories: GoalCategory[] = GOAL_CATEGORIES,
  random: () => number = Math.random,
): GoalCategory {
  const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0);
  let ticket = random() * totalWeight;

  for (const category of categories) {
    ticket -= category.weight;
    if (ticket <= 0) {
      return category;
    }
  }

  return categories[categories.length - 1];
}

/**
 * Ángulo final (en grados) al que debe detenerse la aguja de la ruleta para
 * que visualmente apunte al centro del segmento de `categoryId`, dando
 * varias vueltas completas primero para el efecto de animación.
 */
export function angleForCategory(
  categoryId: CategoryId,
  categories: GoalCategory[] = GOAL_CATEGORIES,
  fullSpins = 6,
): number {
  const segmentSize = 360 / categories.length;
  const index = categories.findIndex((category) => category.id === categoryId);
  const safeIndex = index === -1 ? 0 : index;
  const segmentCenter = safeIndex * segmentSize + segmentSize / 2;

  return fullSpins * 360 + (360 - segmentCenter);
}
