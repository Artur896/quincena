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

export interface RouletteSegment {
  category: GoalCategory;
  startAngle: number;
  endAngle: number;
  midAngle: number;
}

/**
 * Calcula el arco (en grados) de cada categoría proporcional a su `weight`,
 * en vez de repartir la circunferencia en partes iguales — así el tamaño
 * visual del segmento sí refleja su probabilidad real de salir sorteado.
 * Único punto de verdad para el layout de la ruleta: lo usan tanto el
 * dibujo (RouletteWheel) como el cálculo del ángulo final (abajo), así
 * nunca pueden desincronizarse.
 */
export function getSegmentLayout(categories: GoalCategory[] = GOAL_CATEGORIES): RouletteSegment[] {
  const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0);
  let cursor = 0;

  return categories.map((category) => {
    const sweep = (category.weight / totalWeight) * 360;
    const startAngle = cursor;
    const endAngle = cursor + sweep;
    cursor = endAngle;
    return { category, startAngle, endAngle, midAngle: startAngle + sweep / 2 };
  });
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
  const segments = getSegmentLayout(categories);
  const segment = segments.find((item) => item.category.id === categoryId) ?? segments.at(-1);
  const segmentCenter = segment?.midAngle ?? 0;

  return fullSpins * 360 + (360 - segmentCenter);
}
