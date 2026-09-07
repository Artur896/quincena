import { colors } from "./colors";

export const typography = {
  display: {
    fontSize: 34,
    fontWeight: "700" as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.textSecondary,
  },
  micro: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: colors.textTertiary,
    letterSpacing: 0.4,
  },
  money: {
    fontSize: 40,
    fontWeight: "800" as const,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
};
