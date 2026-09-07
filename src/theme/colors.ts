export const colors = {
  background: "#0B0B0C",
  surface: "#161618",
  surfaceElevated: "#1F1F22",
  border: "#2A2A2E",

  textPrimary: "#F5F5F4",
  textSecondary: "#A1A1A6",
  textTertiary: "#6B6B70",

  accent: "#E8C468",
  accentSoft: "rgba(232, 196, 104, 0.14)",

  success: "#5FBF8F",
  danger: "#E0684F",

  categoryCasa: "#E8C468",
  categoryViajes: "#6FA8DC",
  categoryCompu: "#9B8CDB",
  categoryRopa: "#E0899B",
} as const;

export type ColorToken = keyof typeof colors;
