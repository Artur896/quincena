const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return formatter.format(amount);
}

/**
 * Igual que formatMoney pero sin depender de Intl.NumberFormat — ese
 * objeto vive en el hilo de JS y no se puede compartir con el hilo de UI
 * de Reanimated. MoneyText la usa dentro de un worklet (useAnimatedProps)
 * para el count-up animado; en un build nativo real (no en Expo Go/web)
 * llamar formatMoney ahí tronaba con "Object is not a function" porque el
 * formatter capturado no existe del otro lado del hilo.
 */
export function formatMoneyWorklet(amount: number): string {
  "worklet";
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const digits = Math.abs(rounded).toString();
  let withCommas = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) withCommas += ",";
    withCommas += digits[i];
  }
  return `${isNegative ? "-" : ""}$${withCommas}`;
}

export function formatMoneyCompact(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    const thousands = amount / 1000;
    const rounded = Number.isInteger(thousands) ? thousands : Math.round(thousands * 10) / 10;
    return `$${rounded}k`;
  }
  return formatMoney(amount);
}

export function clampPercentage(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function progressPercentage(accumulated: number, target: number): number {
  if (target <= 0) return 0;
  return clampPercentage((accumulated / target) * 100);
}
