import type { Quincena } from "@/types";

/** Formatea una fecha como clave de mes 'YYYY-MM'. */
export function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function currentMonthKey(): string {
  return toMonthKey(new Date());
}

/**
 * Determina a qué quincena pertenece una fecha:
 * Quincena 1 = días 1-15, Quincena 2 = días 16 hasta fin de mes.
 */
export function quincenaOf(date: Date): Quincena {
  return date.getDate() <= 15 ? 1 : 2;
}

export function currentQuincena(): Quincena {
  return quincenaOf(new Date());
}

/** La ruleta solo puede girarse los primeros días del mes (día 1 al 9). */
export function isRouletteWindowOpen(date: Date = new Date()): boolean {
  return date.getDate() <= 9;
}

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const name = MONTH_NAMES[(month ?? 1) - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

export function addMonthsToKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1 + delta, 1);
  return toMonthKey(date);
}

export function daysRemainingInMonth(date: Date = new Date()): number {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return lastDay - date.getDate();
}
