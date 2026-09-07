export const colors = {
  background: "#0B0B0A",
  surface: "#171512",
  surfaceElevated: "#201D19",
  border: "#2C2924",

  textPrimary: "#F5F5F4",
  textSecondary: "#A8A29B",
  textTertiary: "#726C63",

  accent: "#E8C468",
  accentSoft: "rgba(232, 196, 104, 0.14)",

  success: "#5FBF8F",
  danger: "#E0684F",

  // Cada categoría tiene su propio tono (antes "casa" reusaba el accent y se
  // perdía contra los botones/estados activos). El accent queda reservado
  // para el cromo de la UI (botones, tab activo, foco).
  categoryCasa: "#D98A5C",
  categoryViajes: "#57A8D8",
  categoryCompu: "#8F7FE0",
  categoryRopa: "#E17FA0",
} as const;

export type ColorToken = keyof typeof colors;
