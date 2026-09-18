import { GOAL_CATEGORIES } from "@/constants/categories";
import type { CategoryId, GoalCategory } from "@/types";

/**
 * Selecciona una categoría al azar. Todas las categorías tienen la misma
 * probabilidad sin importar cuántas haya — al agregar una nueva, el resto
 * se "reparte" automáticamente porque esto se calcula en el momento
 * (1/N), no contra un peso guardado que haya que rebalancear a mano.
 * `random` es inyectable para pruebas deterministas.
 */
export function pickWeightedCategory(
  categories: GoalCategory[] = GOAL_CATEGORIES,
  random: () => number = Math.random,
): GoalCategory {
  const index = Math.floor(random() * categories.length);
  return categories[Math.min(index, categories.length - 1)];
}

export interface RouletteSegment {
  category: GoalCategory;
  startAngle: number;
  endAngle: number;
  midAngle: number;
}

/**
 * Calcula el arco (en grados) de cada categoría — todas del mismo tamaño
 * (360 / cantidad de categorías), reflejando que todas tienen la misma
 * probabilidad de salir sorteadas. Único punto de verdad para el layout de
 * la ruleta: lo usan tanto el dibujo (RouletteWheel) como el cálculo del
 * ángulo final (abajo), así nunca pueden desincronizarse.
 */
export function getSegmentLayout(categories: GoalCategory[] = GOAL_CATEGORIES): RouletteSegment[] {
  const sweep = 360 / categories.length;

  return categories.map((category, index) => {
    const startAngle = index * sweep;
    const endAngle = startAngle + sweep;
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
