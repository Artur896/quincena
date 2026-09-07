const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return formatter.format(amount);
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
